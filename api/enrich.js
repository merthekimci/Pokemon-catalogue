import { sql } from "@vercel/postgres";
import {
  fetchMarketPrice,
  resolveImage,
  checkMetadataCache,
  writeMetadataCache,
  gptEnrichCard,
} from "./shared/card-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cards, imageBase64, mimeType } = req.body;
  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: "cards array required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  const results = {};

  // Process each card in the batch
  await Promise.all(
    cards.map(async (entry) => {
      const { cardNumber, englishName } = entry;
      if (!cardNumber || cardNumber === "-") {
        results[cardNumber || "unknown"] = "skipped";
        return;
      }

      try {
        // Skip if already fully enriched
        const cached = await checkMetadataCache(cardNumber);
        if (cached && cached.enrichment_status === "complete") {
          results[cardNumber] = "already_complete";
          return;
        }

        // Mark as enriching
        await sql`
          UPDATE card_metadata SET enrichment_status = 'enriching', updated_at = NOW()
          WHERE card_number = ${cardNumber}
        `.catch(() => {});

        const [gptResult, imgResult, price] = await Promise.all([
          // GPT-4o text-only enrichment (shared utility)
          gptEnrichCard(englishName, cardNumber, apiKey),

          // Full image resolution (with vision matching if needed)
          resolveImage(
            { cardNumber, img: cached?.img || "" },
            englishName,
            { imageBase64, mimeType, apiKey, fastMode: !imageBase64 }
          ),

          // Market price lookup
          fetchMarketPrice(englishName, cardNumber),
        ]);

        if (!gptResult) {
          // GPT enrichment failed — mark as failed
          await sql`
            UPDATE card_metadata
            SET enrichment_status = 'failed', enrichment_error = 'GPT-4o enrichment failed', updated_at = NOW()
            WHERE card_number = ${cardNumber}
          `.catch(() => {});
          results[cardNumber] = "failed";
          return;
        }

        // Merge enriched data with existing cached data
        const existingOriginal = cached?.original || {};
        const existingTranslations = cached?.translations || {};

        const enrichedData = {
          hp: cached?.hp || 0,
          rarity: cached?.rarity || "",
          retreat: gptResult.retreat || "",
          damage1: gptResult.damage1 || "",
          damage2: gptResult.damage2 || "",
          img: imgResult.img || cached?.img || "",
          marketValue: price || 0,
          original: {
            ...existingOriginal,
            ...(gptResult.original || {}),
          },
          translations: {
            en: {
              ...(existingTranslations.en || {}),
              ...(gptResult.translations?.en || {}),
            },
            tr: {
              ...(existingTranslations.tr || {}),
              ...(gptResult.translations?.tr || {}),
            },
          },
          enrichmentError: "",
        };

        // Write fully enriched data to cache
        await writeMetadataCache(cardNumber, enrichedData, "complete");
        results[cardNumber] = "complete";
      } catch (err) {
        // Unexpected error — mark as failed
        await sql`
          UPDATE card_metadata
          SET enrichment_status = 'failed',
              enrichment_error = ${err.message || 'Unknown error'},
              updated_at = NOW()
          WHERE card_number = ${cardNumber}
        `.catch(() => {});
        results[cardNumber] = "failed";
      }
    })
  );

  return res.status(200).json({ ok: true, results });
}
