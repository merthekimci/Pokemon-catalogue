import { sql } from "@vercel/postgres";

const PHONE_REGEX = /^\+905[0-9]{9}$/;

function validatePhone(phone) {
  return typeof phone === "string" && PHONE_REGEX.test(phone);
}

// Idempotent migration — adds columns/tables if they don't exist
async function ensureSchema() {
  await sql`ALTER TABLE collections ADD COLUMN IF NOT EXISTS device_id TEXT`;
  await sql`ALTER TABLE collections ADD COLUMN IF NOT EXISTS portrait TEXT`;

  // Global card metadata — one row per unique card (shared across all collectors)
  await sql`
    CREATE TABLE IF NOT EXISTS card_metadata (
      card_number       TEXT PRIMARY KEY,
      hp                INTEGER NOT NULL DEFAULT 0,
      rarity            TEXT NOT NULL DEFAULT '',
      retreat           TEXT NOT NULL DEFAULT '',
      damage1           TEXT NOT NULL DEFAULT '',
      damage2           TEXT NOT NULL DEFAULT '',
      img               TEXT NOT NULL DEFAULT '',
      market_value      NUMERIC(10,4) NOT NULL DEFAULT 0,
      original          JSONB NOT NULL DEFAULT '{}',
      translations      JSONB NOT NULL DEFAULT '{}',
      enrichment_status TEXT NOT NULL DEFAULT 'complete',
      enrichment_error  TEXT NOT NULL DEFAULT '',
      market_updated_at TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // Migration for existing tables missing enrichment columns
  await sql`ALTER TABLE card_metadata ADD COLUMN IF NOT EXISTS enrichment_status TEXT NOT NULL DEFAULT 'complete'`;
  await sql`ALTER TABLE card_metadata ADD COLUMN IF NOT EXISTS enrichment_error TEXT NOT NULL DEFAULT ''`;

  // Per-collector card ownership — references card_metadata by card_number
  await sql`
    CREATE TABLE IF NOT EXISTS collection_cards (
      id           BIGSERIAL PRIMARY KEY,
      phone        TEXT NOT NULL,
      card_number  TEXT NOT NULL,
      collector_id BIGINT NOT NULL,
      copies       INTEGER NOT NULL DEFAULT 1,
      trainer      TEXT NOT NULL DEFAULT 'ash-ketchum',
      added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (phone, card_number)
    )
  `;
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
        SELECT owner_name, theme, cards, favorites, device_id, portrait, updated_at
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

      // Assemble cards from normalized tables (collection_cards JOIN card_metadata)
      const { rows: joinedCards } = await sql`
        SELECT
          cc.collector_id, cc.copies, cc.trainer, cc.added_at,
          cm.card_number, cm.hp, cm.rarity, cm.retreat,
          cm.damage1, cm.damage2, cm.img, cm.market_value,
          cm.original, cm.translations, cm.enrichment_status
        FROM collection_cards cc
        JOIN card_metadata cm ON cm.card_number = cc.card_number
        WHERE cc.phone = ${phone}
        ORDER BY cc.added_at ASC
      `;

      if (joinedCards.length > 0) {
        // Serve from normalized tables — assemble into the card shape the frontend expects
        row.cards = joinedCards.map((r) => ({
          id: Number(r.collector_id),
          cardNumber: r.card_number,
          hp: r.hp,
          rarity: r.rarity,
          retreat: r.retreat,
          damage1: r.damage1,
          damage2: r.damage2,
          img: r.img,
          marketValue: parseFloat(r.market_value) || 0,
          original: r.original,
          translations: r.translations,
          copies: r.copies,
          trainer: r.trainer,
          addedAt: r.added_at ? new Date(r.added_at).toISOString() : undefined,
          _enrichmentStatus: r.enrichment_status || "complete",
        }));
      }
      // else: fall back to row.cards from JSONB (pre-migration data)

      return res.status(200).json({ exists: true, data: row });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { phone, owner_name, theme, cards, catalogue, favorites, device_id, portrait } = req.body;

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: "Geçersiz telefon numarası" });
    }

    if (!Array.isArray(favorites)) {
      return res.status(400).json({ error: "favorites dizi olmalı" });
    }

    try {
      // Check if phone is already bound to a different device
      const { rows } = await sql`
        SELECT device_id FROM collections WHERE phone = ${phone}
      `;

      if (rows.length > 0 && rows[0].device_id && device_id && rows[0].device_id !== device_id) {
        return res.status(403).json({ error: "device_mismatch" });
      }

      // Upsert collections row (no longer writes cards JSONB when catalogue is provided)
      await sql`
        INSERT INTO collections (phone, owner_name, theme, cards, favorites, device_id, portrait, updated_at)
        VALUES (
          ${phone},
          ${owner_name ?? ""},
          ${theme ?? "dark"},
          ${JSON.stringify(catalogue ? [] : (cards || []))},
          ${JSON.stringify(favorites)},
          ${device_id ?? null},
          ${portrait !== undefined ? portrait : null},
          NOW()
        )
        ON CONFLICT (phone) DO UPDATE SET
          owner_name = EXCLUDED.owner_name,
          theme      = EXCLUDED.theme,
          cards      = CASE WHEN ${!!catalogue} THEN collections.cards ELSE EXCLUDED.cards END,
          favorites  = EXCLUDED.favorites,
          device_id  = COALESCE(collections.device_id, EXCLUDED.device_id),
          portrait   = CASE WHEN ${portrait !== undefined} THEN ${portrait ?? null} ELSE collections.portrait END,
          updated_at = NOW()
      `;

      // Write to normalized collection_cards table when catalogue is provided
      if (Array.isArray(catalogue)) {
        // Delete cards that are no longer in the catalogue (user removed them)
        const cardNumbers = catalogue.map((c) => c.card_number).filter(Boolean);
        if (cardNumbers.length > 0) {
          await sql`
            DELETE FROM collection_cards
            WHERE phone = ${phone}
              AND card_number != ALL(${cardNumbers})
          `;
        } else {
          await sql`DELETE FROM collection_cards WHERE phone = ${phone}`;
        }

        // Upsert each card in the catalogue
        for (const entry of catalogue) {
          if (!entry.card_number) continue;
          await sql`
            INSERT INTO collection_cards (phone, card_number, collector_id, copies, trainer, added_at)
            VALUES (
              ${phone},
              ${entry.card_number},
              ${entry.collector_id || 0},
              ${entry.copies || 1},
              ${entry.trainer || 'ash-ketchum'},
              ${entry.added_at ? new Date(entry.added_at) : new Date()}
            )
            ON CONFLICT (phone, card_number) DO UPDATE SET
              copies       = EXCLUDED.copies,
              trainer      = EXCLUDED.trainer,
              collector_id = EXCLUDED.collector_id
          `;
        }
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
