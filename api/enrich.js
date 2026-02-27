import { sql } from "@vercel/postgres";
import {
  fetchMarketPrice,
  resolveImage,
  checkMetadataCache,
  writeMetadataCache,
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

        // GPT-4o text-only call for detailed metadata
        const enrichPrompt = `For the Pokémon TCG card "${englishName}" (card number ${cardNumber}), provide the following data as a JSON object.
Use empty string "" for unknown text fields, 0 for unknown numeric fields.

{
  "retreat": "retreat cost as string number e.g. '2' or '0' or '-'",
  "damage1": "first attack damage as string e.g. '30' or '30+' or '-' or empty",
  "damage2": "second attack damage as string or empty string",
  "trainer": "pick the trainer most associated with this Pokémon in anime/game lore. Use one of these exact slugs: ash-ketchum, misty, brock, dawn, blaine, professor-oak, cynthia, red, blue, lance, n, steven-stone, team-rocket. Default to ash-ketchum if uncertain. For Trainer/Item/Tool/Stadium cards use professor-oak.",
  "original": {
    "type": "energy type in English: one of [Grass, Fire, Water, Lightning, Fighting, Metal, Colorless, Darkness, Psychic, Supporter, Item, Tool, Stadium]",
    "stage": "stage in English: one of [Basic, Stage 1, Stage 2, Mega ex, Basic ex, Supporter, Item, Tool, Stadium]",
    "attack1": "first attack name in English",
    "attack2": "second attack name or empty string",
    "ability": "ability name if present, else empty string",
    "weakness": "weakness type and multiplier e.g. 'Fire ×2' or '-'"
  },
  "translations": {
    "en": {
      "attack1": "English attack name",
      "attack2": "English second attack name or empty string",
      "ability": "English ability name or empty string",
      "bio": "2-3 sentence English biography of this Pokémon — its nature, notable traits, and abilities. For Trainer/Item/Tool/Stadium cards, describe the card's role and effect.",
      "lore": "2-3 sentence English story about this Pokémon — its origin, legends, or role in the Pokémon world. For Trainer/Item/Tool/Stadium cards, give historical or strategic context."
    },
    "tr": {
      "attack1": "Turkish attack name (translate if known, else use English)",
      "attack2": "Turkish second attack name or empty string",
      "ability": "Turkish ability name or empty string",
      "bio": "Turkish translation of the English biography above",
      "lore": "Turkish translation of the English story above"
    }
  }
}

Return ONLY the raw JSON object, no markdown, no explanation.`;

        const [gptResult, imgResult, price] = await Promise.all([
          // GPT-4o text-only enrichment
          fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              max_tokens: 2000,
              messages: [{ role: "user", content: enrichPrompt }],
            }),
          }).then(async (r) => {
            if (!r.ok) return null;
            const d = await r.json();
            const text = d.choices?.[0]?.message?.content || "{}";
            const json = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            try { return JSON.parse(json); } catch (_) { return null; }
          }).catch(() => null),

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
