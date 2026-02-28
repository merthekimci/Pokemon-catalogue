import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = req.headers["x-migrate-secret"];
  if (!secret || secret !== process.env.MIGRATE_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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
