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

  const prompt = `You are analyzing a photo of one or more Pokémon TCG cards.
Extract the data for EVERY card visible and return a JSON array.
Each card object must have these exact fields (use empty string "" for unknown text fields, 0 for unknown numeric fields):

{
  "cardNumber": "card set number exactly as printed on card e.g. 025/080, or - if not visible",
  "hp": numeric HP value (0 for trainer/item/supporter cards),
  "rarity": one of ["C","U","R","M","RR","SR"],
  "retreat": "retreat cost as string number e.g. '2' or '0' or '-'",
  "damage1": "first attack damage as string e.g. '30' or '30+' or '-' or empty",
  "damage2": "second attack damage as string or empty string",
  "copies": 1,
  "marketValue": 0,
  "original": {
    "name": "the exact name text as printed on the card — keep original language (Korean/Japanese/English)",
    "type": "energy type in English exactly as used in TCG: one of [Grass, Fire, Water, Lightning, Fighting, Metal, Colorless, Darkness, Psychic, Supporter, Item, Tool, Stadium]",
    "stage": "stage in English: one of [Basic, Stage 1, Stage 2, Mega ex, Basic ex, Supporter, Item, Tool, Stadium]",
    "attack1": "first attack name exactly as on card",
    "attack2": "second attack name or empty string",
    "ability": "ability name if present, else empty string",
    "weakness": "weakness type and multiplier e.g. 'Fire ×2' or '-'"
  },
  "translations": {
    "en": {
      "name": "English name of the Pokémon or card",
      "type": "English type: one of [Grass, Fire, Water, Lightning, Fighting, Metal, Colorless, Darkness, Psychic, Supporter, Item, Tool, Stadium]",
      "stage": "English stage: one of [Basic, Stage 1, Stage 2, Mega ex, Basic ex, Supporter, Item, Tool, Stadium]",
      "attack1": "English attack name",
      "attack2": "English second attack name or empty string",
      "ability": "English ability name or empty string"
    },
    "tr": {
      "name": "Turkish or romanized name (Pokémon names usually unchanged)",
      "type": "Turkish type: one of [Ot, Ateş, Su, Elektrik, Dövüş, Çelik, Normal, Destekçi, Karanlık, Psişik]",
      "stage": "Turkish stage: one of [Temel, 1. Aşama, 2. Aşama, Mega ex, Temel ex, Destekçi, Eşya, Araç, Stadyum]",
      "attack1": "Turkish attack name (translate if known, else use English)",
      "attack2": "Turkish second attack name or empty string",
      "ability": "Turkish ability name or empty string"
    }
  }
}

Type mappings for translations.tr.type: Grass→Ot, Fire→Ateş, Water→Su, Lightning→Elektrik, Fighting→Dövüş, Metal→Çelik, Colorless→Normal, Darkness→Karanlık, Psychic→Psişik. Trainer/Supporter/Item/Tool/Stadium cards→Destekçi.
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
        max_tokens: 4000,
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
    const cards = JSON.parse(json);

    // Normalize translations.tr.type in case GPT-4o returned an English type name
    const TYPE_TR = {
      Grass: "Ot", Fire: "Ateş", Water: "Su", Lightning: "Elektrik",
      Fighting: "Dövüş", Metal: "Çelik", Colorless: "Normal",
      Darkness: "Karanlık", Psychic: "Psişik",
      Supporter: "Destekçi", Item: "Destekçi", Tool: "Destekçi", Stadium: "Destekçi",
    };
    cards.forEach((card) => {
      const trType = card.translations?.tr?.type;
      if (trType && TYPE_TR[trType]) {
        card.translations.tr.type = TYPE_TR[trType];
      }
    });

    // For each card, resolve the TCGdex image by English name.
    // Priority: ME02 set first (primary collection set), then any set.
    // We use results.find(r => r.image) instead of results[0] to skip entries
    // that lack images. We do NOT fall back to card-number ME02 URL because
    // imported cards may be from other sets (e.g. a 182-card set), and card
    // position N in ME02 is a completely different Pokémon.
    const cardsWithImages = await Promise.all(
      cards.map(async (card) => {
        if (card.img) return card; // already has an image

        const enName = card.translations?.en?.name || card.original?.name;
        if (!enName) return card;

        // 1. Try ME02 set first — the primary set for this collection
        try {
          const me02Res = await fetch(
            `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(enName)}&set.id=me02`
          );
          if (me02Res.ok) {
            const me02Results = await me02Res.json();
            const me02Match = Array.isArray(me02Results) && me02Results.find((r) => r.image);
            if (me02Match) return { ...card, img: me02Match.image + "/high.png" };
          }
        } catch (_) {}

        // 2. Search all sets — use the first result that actually has an image
        try {
          const tcgRes = await fetch(
            `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(enName)}`
          );
          if (tcgRes.ok) {
            const results = await tcgRes.json();
            const anyMatch = Array.isArray(results) && results.find((r) => r.image);
            if (anyMatch) return { ...card, img: anyMatch.image + "/high.png" };
          }
        } catch (_) {}

        // No image found — return card without img rather than guessing a wrong set URL
        return card;
      })
    );

    return res.status(200).json({ cards: cardsWithImages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
