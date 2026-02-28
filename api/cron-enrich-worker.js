import { sql } from "@vercel/postgres";
import {
  fetchMarketPrice,
  checkMetadataCache,
  writeMetadataCache,
  gptEnrichCard,
} from "./shared/card-utils.js";

const MAX_CARDS_PER_INVOCATION = 2;
const MAX_RETRIES = 3;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers["authorization"];
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { cardNumbers } = req.body;
  if (!Array.isArray(cardNumbers) || cardNumbers.length === 0) {
    return res.status(400).json({ error: "cardNumbers array required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  const batch = cardNumbers.slice(0, MAX_CARDS_PER_INVOCATION);
  const remaining = cardNumbers.slice(MAX_CARDS_PER_INVOCATION);
  const results = {};

  for (const cardNumber of batch) {
    try {
      // Atomic claim — skip if already being processed or max retries exceeded
      const { rowCount } = await sql`
        UPDATE card_metadata
        SET enrichment_status = 'enriching', updated_at = NOW()
        WHERE card_number = ${cardNumber}
          AND (enrichment_status != 'enriching' OR updated_at < NOW() - INTERVAL '5 minutes')
          AND COALESCE(retry_count, 0) < ${MAX_RETRIES}
        RETURNING card_number
      `;

      if (rowCount === 0) {
        results[cardNumber] = "skipped_locked_or_max_retries";
        continue;
      }

      const cached = await checkMetadataCache(cardNumber);
      const englishName = cached?.translations?.en?.name || "";

      // Determine what's needed
      const needsGpt = !cached?.translations?.en?.bio
        || !cached?.translations?.tr?.bio
        || !cached?.translations?.en?.lore
        || !cached?.translations?.tr?.lore
        || cached?.enrichment_status !== "complete";

      const needsMarket = !cached?.market_value || cached.market_value === 0
        || !cached?.market_updated_at
        || new Date(cached.market_updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

      // Run GPT + market in parallel
      const [gptResult, price] = await Promise.all([
        needsGpt ? gptEnrichCard(englishName, cardNumber, apiKey) : null,
        needsMarket ? fetchMarketPrice(englishName, cardNumber) : (cached?.market_value || 0),
      ]);

      if (needsGpt && !gptResult) {
        await sql`
          UPDATE card_metadata
          SET enrichment_status = 'failed',
              enrichment_error = 'GPT enrichment failed (cron worker)',
              retry_count = COALESCE(retry_count, 0) + 1,
              updated_at = NOW()
          WHERE card_number = ${cardNumber}
        `.catch(() => {});
        results[cardNumber] = "failed";
        continue;
      }

      // Merge with existing data
      const existingOriginal = cached?.original || {};
      const existingTranslations = cached?.translations || {};

      const enrichedData = {
        hp: cached?.hp || 0,
        rarity: cached?.rarity || "",
        retreat: gptResult?.retreat || cached?.retreat || "",
        damage1: gptResult?.damage1 || cached?.damage1 || "",
        damage2: gptResult?.damage2 || cached?.damage2 || "",
        img: cached?.img || "",
        marketValue: price || cached?.market_value || 0,
        original: { ...existingOriginal, ...(gptResult?.original || {}) },
        translations: {
          en: { ...(existingTranslations.en || {}), ...(gptResult?.translations?.en || {}) },
          tr: { ...(existingTranslations.tr || {}), ...(gptResult?.translations?.tr || {}) },
        },
        enrichmentError: "",
      };

      await writeMetadataCache(cardNumber, enrichedData, "complete");

      // Reset retry count on success
      await sql`
        UPDATE card_metadata SET retry_count = 0 WHERE card_number = ${cardNumber}
      `.catch(() => {});

      results[cardNumber] = "complete";
    } catch (err) {
      await sql`
        UPDATE card_metadata
        SET enrichment_status = 'failed',
            enrichment_error = ${err.message || "Unknown error"},
            retry_count = COALESCE(retry_count, 0) + 1,
            updated_at = NOW()
        WHERE card_number = ${cardNumber}
      `.catch(() => {});
      results[cardNumber] = "error";
    }
  }

  // Self-chain: if remaining cards, invoke self
  if (remaining.length > 0) {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "";
    if (baseUrl) {
      fetch(`${baseUrl}/api/cron-enrich-worker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ cardNumbers: remaining }),
      }).catch((e) => console.error("[cron-worker] self-chain failed:", e.message));
    } else {
      console.error("[cron-worker] VERCEL_URL not set — cannot self-chain");
    }
  }

  return res.status(200).json({ ok: true, results, remaining: remaining.length });
}
