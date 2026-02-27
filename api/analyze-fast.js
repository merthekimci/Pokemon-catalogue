import {
  normalizeTrTypes,
  checkMetadataCache,
  resolveImage,
  writeMetadataCache,
} from "./shared/card-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  // Stripped-down prompt: essential fields only for fast card identification
  const prompt = `You are analyzing a photo of one or more Pokémon TCG cards.
Extract the data for EVERY card visible and return a JSON array.
Each card object must have these exact fields (use empty string "" for unknown text fields, 0 for unknown numeric fields):

{
  "cardNumber": "card set number exactly as printed on card e.g. 025/080, or - if not visible",
  "hp": numeric HP value (0 for trainer/item/supporter cards),
  "rarity": one of ["C","U","R","M","RR","SR"],
  "copies": 1,
  "original": {
    "name": "the exact name text as printed on the card — keep original language (Korean/Japanese/English)"
  },
  "translations": {
    "en": {
      "name": "English name of the Pokémon or card",
      "type": "English type: one of [Grass, Fire, Water, Lightning, Fighting, Metal, Colorless, Darkness, Psychic, Supporter, Item, Tool, Stadium]",
      "stage": "English stage: one of [Basic, Stage 1, Stage 2, Mega ex, Basic ex, Supporter, Item, Tool, Stadium]"
    },
    "tr": {
      "name": "Turkish or romanized name (Pokémon names usually unchanged)",
      "type": "Turkish type: one of [Ot, Ateş, Su, Elektrik, Dövüş, Çelik, Normal, Destekçi, Karanlık, Psişik]",
      "stage": "Turkish stage: one of [Temel, 1. Aşama, 2. Aşama, Mega ex, Temel ex, Destekçi, Eşya, Araç, Stadyum]"
    }
  }
}

Type mappings for translations.tr.type: Grass→Ot, Fire→Ateş, Water→Su, Lightning→Elektrik, Fighting→Dövüş, Metal→Çelik, Colorless→Normal, Darkness→Karanlık, Psychic→Psişik. Trainer/Supporter/Item/Tool/Stadium→Destekçi.
Stage mappings for translations.tr.stage: Basic→Temel, Stage 1→1. Aşama, Stage 2→2. Aşama, Supporter→Destekçi, Item→Eşya, Tool→Araç, Stadium→Stadyum.
Rarity mapping from card symbols: circle→C, diamond→U, star→R, star-holographic→M, two-stars→RR, gold/rainbow/special-art→SR.

Return ONLY the raw JSON array, no markdown, no explanation.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ error: data.error?.message || "OpenAI API error" });
    }

    const text = data.choices?.[0]?.message?.content || "[]";
    const json = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let cards;
    try {
      cards = JSON.parse(json);
    } catch (_) {
      return res.status(502).json({ error: "Kart verisi okunamadı. Lütfen daha net bir fotoğraf deneyin." });
    }

    normalizeTrTypes(cards);

    // Resolve images in parallel — use cache first, fast TCGdex match only (no vision)
    const cardsWithData = await Promise.all(
      cards.map(async (card) => {
        const cardNumber = card.cardNumber;
        const enName = card.translations?.en?.name || card.original?.name;

        // Check metadata cache — if fully enriched, return cached data
        const cached = await checkMetadataCache(cardNumber);
        if (cached && cached.enrichment_status === "complete") {
          return {
            cardNumber: cached.card_number,
            hp: cached.hp,
            rarity: cached.rarity || card.rarity,
            retreat: cached.retreat,
            damage1: cached.damage1,
            damage2: cached.damage2,
            img: cached.img,
            marketValue: parseFloat(cached.market_value) || 0,
            original: cached.original,
            translations: cached.translations,
            copies: card.copies || 1,
            trainer: cached.trainer || "ash-ketchum",
            _enrichmentStatus: "complete",
          };
        }

        // Fast image resolution: cache hit or simple localId match only
        const imgResult = await resolveImage(card, enName, { fastMode: true });

        // Write partial data to cache with pending status (non-blocking)
        const partialCard = { ...card, ...imgResult, marketValue: 0 };
        writeMetadataCache(cardNumber, partialCard, "pending");

        return {
          ...partialCard,
          copies: card.copies || 1,
          _enrichmentStatus: "pending",
        };
      })
    );

    return res.status(200).json({ cards: cardsWithData });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
