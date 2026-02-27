import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cards } = req.query;
  if (!cards) {
    return res.status(400).json({ error: "cards query parameter required" });
  }

  const cardNumbers = cards.split(",").map((c) => c.trim()).filter(Boolean);
  if (cardNumbers.length === 0) {
    return res.status(400).json({ error: "No valid card numbers provided" });
  }

  try {
    const { rows } = await sql`
      SELECT card_number, hp, rarity, retreat, damage1, damage2,
             img, market_value, original, translations,
             enrichment_status, enrichment_error
      FROM card_metadata
      WHERE card_number = ANY(${cardNumbers})
    `;

    const result = {};

    // Map found rows
    for (const row of rows) {
      const status = row.enrichment_status || "pending";
      if (status === "complete") {
        result[row.card_number] = {
          status: "complete",
          data: {
            cardNumber: row.card_number,
            hp: row.hp,
            rarity: row.rarity,
            retreat: row.retreat,
            damage1: row.damage1,
            damage2: row.damage2,
            img: row.img,
            marketValue: parseFloat(row.market_value) || 0,
            original: row.original,
            translations: row.translations,
          },
        };
      } else {
        result[row.card_number] = {
          status,
          error: row.enrichment_error || undefined,
        };
      }
    }

    // Mark missing cards as pending
    for (const cn of cardNumbers) {
      if (!result[cn]) {
        result[cn] = { status: "pending" };
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
