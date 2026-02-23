import { sql } from "@vercel/postgres";

const PHONE_REGEX = /^\+905[0-9]{9}$/;

function validatePhone(phone) {
  return typeof phone === "string" && PHONE_REGEX.test(phone);
}

// Idempotent migration — adds device_id column if it doesn't exist
async function ensureSchema() {
  await sql`ALTER TABLE collections ADD COLUMN IF NOT EXISTS device_id TEXT`;
}

export default async function handler(req, res) {
  await ensureSchema();

  if (req.method === "GET") {
    const { phone, device_id } = req.query;

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Geçersiz telefon numarası" });
    }

    try {
      const { rows } = await sql`
        SELECT owner_name, theme, cards, favorites, device_id, updated_at
        FROM collections
        WHERE phone = ${phone}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ exists: false });
      }

      const row = rows[0];

      // If the phone is bound to a different device, block access
      if (row.device_id && device_id && row.device_id !== device_id) {
        return res.status(403).json({ error: "device_mismatch" });
      }

      return res.status(200).json({ exists: true, data: row });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { phone, owner_name, theme, cards, favorites, device_id } = req.body;

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Geçersiz telefon numarası" });
    }

    if (!Array.isArray(cards) || !Array.isArray(favorites)) {
      return res.status(400).json({ error: "cards ve favorites dizi olmalı" });
    }

    try {
      // Check if phone is already bound to a different device
      const { rows } = await sql`
        SELECT device_id FROM collections WHERE phone = ${phone}
      `;

      if (rows.length > 0 && rows[0].device_id && device_id && rows[0].device_id !== device_id) {
        return res.status(403).json({ error: "device_mismatch" });
      }

      await sql`
        INSERT INTO collections (phone, owner_name, theme, cards, favorites, device_id, updated_at)
        VALUES (
          ${phone},
          ${owner_name ?? ""},
          ${theme ?? "dark"},
          ${JSON.stringify(cards)},
          ${JSON.stringify(favorites)},
          ${device_id ?? null},
          NOW()
        )
        ON CONFLICT (phone) DO UPDATE SET
          owner_name = EXCLUDED.owner_name,
          theme      = EXCLUDED.theme,
          cards      = EXCLUDED.cards,
          favorites  = EXCLUDED.favorites,
          device_id  = COALESCE(collections.device_id, EXCLUDED.device_id),
          updated_at = NOW()
      `;

      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
