import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import { findRowByDiscordId } from "../../../lib/sheets";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ verified: false });

  const row = await findRowByDiscordId(session.user.id);
  if (!row) return res.status(200).json({ verified: false });

  // Roblox kullanıcı adını da çek
  let robloxUsername = null;
  try {
    const r = await fetch(`https://users.roblox.com/v1/users/${row.userId}`);
    const d = await r.json();
    robloxUsername = d.name || null;
  } catch (_) {}

  return res.status(200).json({
    verified: true,
    robloxUserId: row.userId,
    robloxUsername,
    rank: row.rank,
    brans: row.brans,
  });
}
