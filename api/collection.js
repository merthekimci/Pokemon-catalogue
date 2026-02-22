import { sql } from "@vercel/postgres";

const PHONE_REGEX = /^\+905[0-9]{9}$/;

function validatePhone(phone) {
  return typeof phone === "string" && PHONE_REGEX.test(phone);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { phone } = req.query;

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Geçersiz telefon numarası" });
    }

    try {
      const { rows } = await sql`
        SELECT owner_name, theme, cards, favorites, updated_at
        FROM collections
        WHERE phone = ${phone}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ exists: false });
      }

      return res.status(200).json({ exists: true, data: rows[0] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { phone, owner_name, theme, cards, favorites } = req.body;

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Geçersiz telefon numarası" });
    }

    if (!Array.isArray(cards) || !Array.isArray(favorites)) {
      return res.status(400).json({ error: "cards ve favorites dizi olmalı" });
    }

    try {
      await sql`
        INSERT INTO collections (phone, owner_name, theme, cards, favorites, updated_at)
        VALUES (
          ${phone},
          ${owner_name ?? ""},
          ${theme ?? "dark"},
          ${JSON.stringify(cards)},
          ${JSON.stringify(favorites)},
          NOW()
        )
        ON CONFLICT (phone) DO UPDATE SET
          owner_name = EXCLUDED.owner_name,
          theme      = EXCLUDED.theme,
          cards      = EXCLUDED.cards,
          favorites  = EXCLUDED.favorites,
          updated_at = NOW()
      `;

      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
