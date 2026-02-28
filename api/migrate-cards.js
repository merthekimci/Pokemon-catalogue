import { sql } from "@vercel/postgres";

// One-time migrations for card_metadata and collection_cards.
// Protected by MIGRATE_SECRET header. Idempotent.
// Usage: POST /api/migrate-cards?action=backfill (default) or ?action=retry-count

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.MIGRATE_SECRET;
  if (!secret || req.headers["x-migrate-secret"] !== secret) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const action = req.query?.action || "backfill";

  if (action === "retry-count") {
    try {
      await sql`
        ALTER TABLE card_metadata
        ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0
      `;
      return res.status(200).json({ ok: true, message: "retry_count column added to card_metadata" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  try {
    // Fetch all collections with cards
    const { rows: collections } = await sql`
      SELECT phone, cards, updated_at FROM collections WHERE cards IS NOT NULL
    `;

    let metaInserted = 0;
    let ownerInserted = 0;
    let skipped = 0;

    for (const coll of collections) {
      const cards = coll.cards;
      if (!Array.isArray(cards)) continue;

      for (const card of cards) {
        const cardNumber = card.cardNumber ?? card.kartNo ?? "";
        if (!cardNumber || cardNumber === "-") {
          skipped++;
          continue;
        }

        // Backfill card_metadata
        try {
          const result = await sql`
            INSERT INTO card_metadata
              (card_number, hp, rarity, retreat, damage1, damage2, img, market_value, original, translations)
            VALUES (
              ${cardNumber},
              ${card.hp || 0},
              ${card.rarity || ''},
              ${card.retreat || ''},
              ${card.damage1 ?? card.dmg1 ?? ''},
              ${card.damage2 ?? card.dmg2 ?? ''},
              ${card.img || ''},
              ${card.marketValue || 0},
              ${JSON.stringify(card.original || {})},
              ${JSON.stringify(card.translations || {})}
            )
            ON CONFLICT (card_number) DO NOTHING
          `;
          if (result.rowCount > 0) metaInserted++;
        } catch (_) {}

        // Backfill collection_cards
        try {
          const result = await sql`
            INSERT INTO collection_cards
              (phone, card_number, collector_id, copies, trainer, added_at)
            VALUES (
              ${coll.phone},
              ${cardNumber},
              ${card.id || 0},
              ${card.copies || 1},
              ${card.trainer || 'ash-ketchum'},
              ${card.addedAt ? new Date(card.addedAt) : coll.updated_at || new Date()}
            )
            ON CONFLICT (phone, card_number) DO NOTHING
          `;
          if (result.rowCount > 0) ownerInserted++;
        } catch (_) {}
      }
    }

    return res.status(200).json({
      ok: true,
      collections: collections.length,
      metaInserted,
      ownerInserted,
      skipped,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
