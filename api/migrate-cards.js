import { sql } from "@vercel/postgres";

// One-time migration: backfill card_metadata and collection_cards
// from existing collections.cards JSONB blobs.
// Protected by MIGRATE_SECRET header. Idempotent (ON CONFLICT DO NOTHING).
// Delete this file after successful migration.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.MIGRATE_SECRET;
  if (!secret || req.headers["x-migrate-secret"] !== secret) {
    return res.status(403).json({ error: "Forbidden" });
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
