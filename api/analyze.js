// Score TCGdex candidates by attribute similarity.
// localId match is the strongest signal (same card number = very likely same variant).
function scoreCandidates(candidates, extractedCardNum) {
  return candidates
    .filter((r) => r.image)
    .map((r) => ({ r, score: r.localId === extractedCardNum ? 10 : 0 }))
    .sort((a, b) => b.score - a.score);
}

// Use GPT-4o vision to pick the best-matching candidate when attribute scoring is ambiguous.
// Image 1 = the user's uploaded card photo; Images 2..N = candidate TCGdex scans.
async function pickBestByVision(imageBase64, mimeType, candidates, apiKey) {
  const urls = candidates.map((r) => r.image + "/high.png");
  const content = [
    {
      type: "text",
      text:
        `The first image is a photo of a physical Pokémon TCG card. ` +
        `The following ${urls.length} images are candidate card scans from a database. ` +
        `Which candidate number (1 to ${urls.length}) best matches the card variant in the first image? ` +
        `Consider card artwork, set symbol, and overall visual design. ` +
        `Respond with ONLY a single integer — the candidate number.`,
    },
    {
      type: "image_url",
      image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`, detail: "low" },
    },
    ...urls.map((url) => ({ type: "image_url", image_url: { url, detail: "low" } })),
  ];
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 10,
        messages: [{ role: "user", content }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const idx = parseInt(data.choices?.[0]?.message?.content?.trim(), 10);
    if (isNaN(idx) || idx < 1 || idx > urls.length) return null;
    return candidates[idx - 1];
  } catch (_) {
    return null;
  }
}

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

    // Resolve the correct TCGdex card image for each extracted card.
    //
    // Strategy:
    //   1. Fetch candidates by name from ME02 (primary set) then from all sets.
    //   2. Score candidates: localId match with extracted card number = +10 pts.
    //   3. If the top-scoring candidate is uniquely best → use it (no extra API call).
    //   4. If scores are tied or no localId match exists → use GPT-4o vision to pick
    //      the best visual match among the top-4 candidates.
    //
    // We never fall back to card-number + ME02 URL because the card may be from a
    // different set (e.g. 073/182 ≠ ME02's 80-card set), and position N in ME02
    // would be a completely different Pokémon.
    const cardsWithImages = await Promise.all(
      cards.map(async (card) => {
        if (card.img) return card;

        const enName = card.translations?.en?.name || card.original?.name;
        if (!enName) return card;

        const extractedNum = card.cardNumber?.split("/")?.[0]?.trim();
        let allCandidates = [];

        // 1. ME02 set — primary collection set
        try {
          const me02Res = await fetch(
            `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(enName)}&set.id=me02`
          );
          if (me02Res.ok) {
            const me02Results = await me02Res.json();
            if (Array.isArray(me02Results)) allCandidates.push(...me02Results);
          }
        } catch (_) {}

        // 2. All sets — broaden the candidate pool
        try {
          const tcgRes = await fetch(
            `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(enName)}`
          );
          if (tcgRes.ok) {
            const allResults = await tcgRes.json();
            if (Array.isArray(allResults)) {
              // Merge, deduplicate by id
              const seen = new Set(allCandidates.map((r) => r.id));
              allResults.forEach((r) => { if (!seen.has(r.id)) allCandidates.push(r); });
            }
          }
        } catch (_) {}

        const scored = scoreCandidates(allCandidates, extractedNum);
        if (scored.length === 0) return card;

        // Unique best by attributes — no vision call needed
        const isUnique = scored.length === 1 || scored[0].score > scored[1].score;
        if (isUnique) {
          return { ...card, img: scored[0].r.image + "/high.png" };
        }

        // Ambiguous — use GPT-4o vision to pick the correct variant
        const topCandidates = scored.slice(0, 4).map((s) => s.r);
        const best = await pickBestByVision(imageBase64, mimeType, topCandidates, apiKey);
        return { ...card, img: (best ?? scored[0].r).image + "/high.png" };
      })
    );

    return res.status(200).json({ cards: cardsWithImages });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
