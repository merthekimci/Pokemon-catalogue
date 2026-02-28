import { sql } from "@vercel/postgres";
import {
  fetchMarketPrice,
  checkMetadataCache,
  writeMetadataCache,
  gptEnrichCard,
} from "./shared/card-utils.js";

const INLINE_BATCH_SIZE = 2;
const SCAN_LIMIT = 10;

export default async function handler(req, res) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers["authorization"];
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    // Find cards needing work:
    // 1. Never completed (pending/failed)
    // 2. Stale locks (enriching for >5 min)
    // 3. Complete but missing bio/lore/market value
    // 4. Stale market price (>24h old)
    // All filtered by retry_count < 3
    const { rows: needsWork } = await sql`
      SELECT card_number,
             translations->'en'->>'name' AS en_name,
             enrichment_status,
             market_value,
             market_updated_at,
             translations,
             retry_count
      FROM card_metadata
      WHERE (COALESCE(retry_count, 0) < 3)
        AND (
          enrichment_status IN ('pending', 'failed')
          OR (
            enrichment_status = 'enriching'
            AND updated_at < NOW() - INTERVAL '5 minutes'
          )
          OR (
            enrichment_status = 'complete' AND (
              COALESCE(translations->'en'->>'bio', '') = ''
              OR COALESCE(translations->'tr'->>'bio', '') = ''
              OR COALESCE(translations->'en'->>'lore', '') = ''
              OR COALESCE(translations->'tr'->>'lore', '') = ''
              OR market_value IS NULL
              OR market_value = 0
            )
          )
          OR (
            enrichment_status = 'complete'
            AND (
              market_updated_at IS NULL
              OR market_updated_at < NOW() - INTERVAL '24 hours'
            )
          )
        )
      ORDER BY
        CASE enrichment_status
          WHEN 'pending' THEN 1
          WHEN 'failed' THEN 2
          WHEN 'enriching' THEN 3
          ELSE 4
        END,
        updated_at ASC
      LIMIT ${SCAN_LIMIT}
    `;

    if (needsWork.length === 0) {
      return res.status(200).json({ ok: true, message: "Nothing to process", found: 0 });
    }

    // Process first batch inline
    const inlineBatch = needsWork.slice(0, INLINE_BATCH_SIZE);
    const remaining = needsWork.slice(INLINE_BATCH_SIZE);
    const results = {};

    for (const row of inlineBatch) {
      results[row.card_number] = await processCard(row, apiKey);
    }

    // Delegate remaining to worker via fire-and-forget
    if (remaining.length > 0) {
      const cardNumbers = remaining.map((r) => r.card_number);
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
          body: JSON.stringify({ cardNumbers }),
        }).catch((e) => console.error("[cron-scan] worker dispatch failed:", e.message));
      } else {
        console.error("[cron-scan] VERCEL_URL not set — cannot delegate to worker");
      }
    }

    return res.status(200).json({
      ok: true,
      found: needsWork.length,
      processedInline: Object.keys(results).length,
      delegatedToWorker: remaining.length,
      results,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function processCard(row, apiKey) {
  const { card_number: cardNumber, en_name: englishName } = row;

  try {
    // Atomic claim
    const { rowCount } = await sql`
      UPDATE card_metadata
      SET enrichment_status = 'enriching', updated_at = NOW()
      WHERE card_number = ${cardNumber}
        AND (enrichment_status != 'enriching' OR updated_at < NOW() - INTERVAL '5 minutes')
      AND COALESCE(retry_count, 0) < 3
      RETURNING card_number
    `;
    if (rowCount === 0) return "skipped_locked";

    const cached = await checkMetadataCache(cardNumber);
    const name = englishName || cached?.translations?.en?.name || "";

    // Determine what work is needed
    const needsGpt = !cached?.translations?.en?.bio
      || !cached?.translations?.tr?.bio
      || !cached?.translations?.en?.lore
      || !cached?.translations?.tr?.lore
      || cached?.enrichment_status !== "complete";

    const needsMarket = !cached?.market_value || cached.market_value === 0
      || !cached?.market_updated_at
      || new Date(cached.market_updated_at).getTime() < Date.now() - 24 * 60 * 60 * 1000;

    // Run GPT + market price in parallel
    const [gptResult, price] = await Promise.all([
      needsGpt ? gptEnrichCard(name, cardNumber, apiKey) : null,
      needsMarket ? fetchMarketPrice(name, cardNumber) : (cached?.market_value || 0),
    ]);

    if (needsGpt && !gptResult) {
      await sql`
        UPDATE card_metadata
        SET enrichment_status = 'failed',
            enrichment_error = 'GPT enrichment failed (cron scanner)',
            retry_count = COALESCE(retry_count, 0) + 1,
            updated_at = NOW()
        WHERE card_number = ${cardNumber}
      `.catch(() => {});
      return "failed";
    }

    // Merge enriched data with existing
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

    return "complete";
  } catch (err) {
    await sql`
      UPDATE card_metadata
      SET enrichment_status = 'failed',
          enrichment_error = ${err.message || "Unknown error"},
          retry_count = COALESCE(retry_count, 0) + 1,
          updated_at = NOW()
      WHERE card_number = ${cardNumber}
    `.catch(() => {});
    return "error";
  }
}
