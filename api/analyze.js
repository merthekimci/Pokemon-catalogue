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
  "kartNo": "card set number e.g. 025/080 or - if not visible",
  "nameEN": "English or romanized Pokémon name",
  "type": one of ["Ot","Ateş","Su","Elektrik","Dövüş","Çelik","Normal","Destekçi","Karanlık","Psişik"],
  "hp": numeric HP value (0 for trainer/item/supporter cards),
  "stage": one of ["Temel","1. Aşama","2. Aşama","Mega ex","Temel ex","Destekçi","Eşya","Araç","Stadyum"],
  "attack1": "first attack name",
  "dmg1": "first attack damage as string e.g. '30' or '30+' or '-'",
  "attack2": "second attack name or empty string",
  "dmg2": "second attack damage as string or empty string",
  "weakness": "weakness type and multiplier e.g. 'Ateş ×2' or '-'",
  "retreat": "retreat cost as string number e.g. '2' or '0'",
  "rarity": one of ["C","U","R","M","RR","SR"],
  "ability": "ability name if present, else empty string",
  "copies": 1,
  "img": "",
  "marketValue": 0
}

Type mapping from card energy symbols: Grass→Ot, Fire→Ateş, Water→Su, Lightning→Elektrik, Fighting→Dövüş, Metal→Çelik, Colorless→Normal, Darkness→Karanlık, Psychic→Psişik. For Trainer/Supporter/Item cards use type "Destekçi".
Stage mapping: Basic→Temel, Stage 1→1. Aşama, Stage 2→2. Aşama, Supporter→Destekçi, Item→Eşya, Tool→Araç, Stadium→Stadyum.
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
    return res.status(200).json({ cards });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
