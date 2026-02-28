import { sql } from "@vercel/postgres";

// Type mappings: English → Turkish
export const TYPE_TR = {
  Grass: "Ot", Fire: "Ateş", Water: "Su", Lightning: "Elektrik",
  Fighting: "Dövüş", Metal: "Çelik", Colorless: "Normal",
  Darkness: "Karanlık", Psychic: "Psişik",
  Supporter: "Destekçi", Item: "Destekçi", Tool: "Destekçi", Stadium: "Destekçi",
};

// Fetch TCGplayer market price from pokemontcg.io API.
// Returns a USD price number, or 0 if unavailable.
export async function fetchMarketPrice(englishName, cardNumber) {
  if (!englishName) return 0;
  try {
    const num = cardNumber?.split("/")?.[0]?.trim();
    const query = `name:"${englishName}"`;
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=20&select=number,tcgplayer`;

    const res = await fetch(url);
    if (!res.ok) return 0;

    const data = await res.json();
    const results = data.data;
    if (!Array.isArray(results) || results.length === 0) return 0;

    let target = num ? results.find((r) => r.number === num) : null;
    if (!target || !target.tcgplayer?.prices) {
      target = results.find((r) => r.tcgplayer?.prices);
    }
    if (!target?.tcgplayer?.prices) return 0;

    const prices = target.tcgplayer.prices;
    const variants = ["holofoil", "reverseHolofoil", "normal", "1stEditionHolofoil", "1stEditionNormal"];
    for (const variant of variants) {
      if (prices[variant]) {
        const p = prices[variant].market ?? prices[variant].mid ?? 0;
        if (p > 0) return p;
      }
    }
    return 0;
  } catch (_) {
    return 0;
  }
}

// Score TCGdex candidates by attribute similarity.
export function scoreCandidates(candidates, extractedCardNum) {
  return candidates
    .filter((r) => r.image)
    .map((r) => ({ r, score: r.localId === extractedCardNum ? 10 : 0 }))
    .sort((a, b) => b.score - a.score);
}

// Use GPT-4o vision to pick the best-matching candidate when attribute scoring is ambiguous.
export async function pickBestByVision(imageBase64, mimeType, candidates, apiKey) {
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

// Fetch TCGdex candidates for a given English name, ME02 set priority.
export async function fetchTCGdexCandidates(enName) {
  let allCandidates = [];

  // ME02 set — primary collection set
  try {
    const me02Res = await fetch(
      `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(enName)}&set.id=me02`
    );
    if (me02Res.ok) {
      const me02Results = await me02Res.json();
      if (Array.isArray(me02Results)) allCandidates.push(...me02Results);
    }
  } catch (_) {}

  // All sets — broaden the candidate pool
  try {
    const tcgRes = await fetch(
      `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(enName)}`
    );
    if (tcgRes.ok) {
      const allResults = await tcgRes.json();
      if (Array.isArray(allResults)) {
        const seen = new Set(allCandidates.map((r) => r.id));
        allResults.forEach((r) => { if (!seen.has(r.id)) allCandidates.push(r); });
      }
    }
  } catch (_) {}

  return allCandidates;
}

// Resolve card image via TCGdex. Fast mode skips vision matching.
export async function resolveImage(card, enName, { imageBase64, mimeType, apiKey, fastMode = false } = {}) {
  if (card.img) return { img: card.img };
  if (!enName) return {};

  const extractedNum = card.cardNumber?.split("/")?.[0]?.trim();
  const allCandidates = await fetchTCGdexCandidates(enName);
  const scored = scoreCandidates(allCandidates, extractedNum);
  if (scored.length === 0) return {};

  const isUnique = scored.length === 1 || scored[0].score > scored[1].score;
  if (isUnique) {
    return { img: scored[0].r.image + "/high.png" };
  }

  // Fast mode: skip vision matching, use best score
  if (fastMode || !imageBase64 || !apiKey) {
    return { img: scored[0].r.image + "/high.png" };
  }

  // Full mode: use GPT-4o vision to pick the correct variant
  const topCandidates = scored.slice(0, 4).map((s) => s.r);
  const best = await pickBestByVision(imageBase64, mimeType, topCandidates, apiKey);
  return { img: (best ?? scored[0].r).image + "/high.png" };
}

// GPT-4o text-only enrichment for a single card.
// Returns parsed JSON object with retreat, damage, original, translations (incl. bio/lore), or null on failure.
export async function gptEnrichCard(englishName, cardNumber, apiKey) {
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

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });
    if (!res.ok) return null;
    const d = await res.json();
    const text = d.choices?.[0]?.message?.content || "{}";
    const json = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try { return JSON.parse(json); } catch (_) { return null; }
  } catch (_) {
    return null;
  }
}

// Normalize Turkish type names (GPT-4o sometimes returns English)
export function normalizeTrTypes(cards) {
  cards.forEach((card) => {
    const trType = card.translations?.tr?.type;
    if (trType && TYPE_TR[trType]) {
      card.translations.tr.type = TYPE_TR[trType];
    }
  });
}

// Check card_metadata cache for a card number.
// Returns the cached row or null.
export async function checkMetadataCache(cardNumber) {
  if (!cardNumber || cardNumber === "-") return null;
  try {
    const { rows } = await sql`
      SELECT * FROM card_metadata WHERE card_number = ${cardNumber}
    `;
    return rows.length > 0 ? rows[0] : null;
  } catch (_) {
    return null;
  }
}

// Write card data to card_metadata cache.
export async function writeMetadataCache(cardNumber, data, enrichmentStatus = "complete") {
  if (!cardNumber || cardNumber === "-") return;
  await sql`
    INSERT INTO card_metadata
      (card_number, hp, rarity, retreat, damage1, damage2, img, market_value,
       original, translations, enrichment_status, enrichment_error, market_updated_at)
    VALUES (
      ${cardNumber},
      ${data.hp || 0},
      ${data.rarity || ""},
      ${data.retreat || ""},
      ${data.damage1 || ""},
      ${data.damage2 || ""},
      ${data.img || ""},
      ${data.marketValue || 0},
      ${JSON.stringify(data.original || {})},
      ${JSON.stringify(data.translations || {})},
      ${enrichmentStatus},
      ${data.enrichmentError || ""},
      NOW()
    )
    ON CONFLICT (card_number) DO UPDATE SET
      hp = CASE WHEN EXCLUDED.hp > 0 THEN EXCLUDED.hp ELSE card_metadata.hp END,
      rarity = CASE WHEN EXCLUDED.rarity != '' THEN EXCLUDED.rarity ELSE card_metadata.rarity END,
      retreat = CASE WHEN EXCLUDED.retreat != '' THEN EXCLUDED.retreat ELSE card_metadata.retreat END,
      damage1 = CASE WHEN EXCLUDED.damage1 != '' THEN EXCLUDED.damage1 ELSE card_metadata.damage1 END,
      damage2 = CASE WHEN EXCLUDED.damage2 != '' THEN EXCLUDED.damage2 ELSE card_metadata.damage2 END,
      img = COALESCE(NULLIF(EXCLUDED.img, ''), card_metadata.img),
      market_value = CASE WHEN EXCLUDED.market_value > 0 THEN EXCLUDED.market_value ELSE card_metadata.market_value END,
      original = CASE WHEN EXCLUDED.original != '{}' THEN EXCLUDED.original ELSE card_metadata.original END,
      translations = CASE WHEN EXCLUDED.translations != '{}' THEN EXCLUDED.translations ELSE card_metadata.translations END,
      enrichment_status = EXCLUDED.enrichment_status,
      enrichment_error = EXCLUDED.enrichment_error,
      market_updated_at = NOW(),
      updated_at = NOW()
  `.catch(() => {});
}
