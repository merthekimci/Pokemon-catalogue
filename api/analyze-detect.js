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

  const prompt = `How many Pokémon TCG cards are visible in this image?
Determine the grid layout (rows and columns) that best fits the card arrangement.

Return ONLY a JSON object with these exact fields, no markdown, no explanation:
{"count": <number of cards>, "rows": <number of rows>, "cols": <number of columns>}

Examples:
- Single card: {"count": 1, "rows": 1, "cols": 1}
- 3 cards in a row: {"count": 3, "rows": 1, "cols": 3}
- 6 cards in 2 rows of 3: {"count": 6, "rows": 2, "cols": 3}
- 9 cards in 3x3 grid: {"count": 9, "rows": 3, "cols": 3}
- 4 cards in 2x2: {"count": 4, "rows": 2, "cols": 2}

If some grid cells are empty (e.g. 7 cards in a 3x3 binder page), still return the full grid dimensions but the actual card count:
{"count": 7, "rows": 3, "cols": 3}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                  detail: "low",
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

    const text = data.choices?.[0]?.message?.content || "{}";
    const json = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      result = JSON.parse(json);
    } catch (_) {
      // Fallback: assume single card if detection fails
      return res.status(200).json({ count: 1, rows: 1, cols: 1 });
    }

    const count = Math.max(1, Math.min(parseInt(result.count) || 1, 12));
    const rows = Math.max(1, Math.min(parseInt(result.rows) || 1, 4));
    const cols = Math.max(1, Math.min(parseInt(result.cols) || 1, 4));

    return res.status(200).json({ count, rows, cols });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
