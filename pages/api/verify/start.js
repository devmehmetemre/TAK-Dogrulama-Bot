import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import { saveCode } from "../../../lib/verifyStore";
import { findRowByDiscordId } from "../../../lib/sheets";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Giriş yapman gerekiyor." });

  const { robloxUsername } = req.body;
  if (!robloxUsername || typeof robloxUsername !== "string") {
    return res.status(400).json({ error: "Roblox kullanıcı adı gerekli." });
  }

  // Roblox API'den kullanıcıyı çek
  const robloxRes = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [robloxUsername.trim()], excludeBannedUsers: true }),
  });
  const robloxData = await robloxRes.json();

  if (!robloxData.data || robloxData.data.length === 0) {
    return res.status(404).json({ error: `"${robloxUsername}" adında bir Roblox kullanıcısı bulunamadı.` });
  }

  const robloxUser = robloxData.data[0];
  const discordId = session.user.id;

  // Bu Discord ID zaten başka bir Roblox hesabına bağlı mı?
  const existing = await findRowByDiscordId(discordId);
  if (existing && existing.userId) {
    return res.status(400).json({
      error: `Bu Discord hesabı zaten Roblox hesabıyla (ID: ${existing.userId}) bağlı.`,
      alreadyVerified: true,
    });
  }

  // Kod üret ve sakla
  const code = "TAS-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  saveCode(discordId, {
    code,
    robloxUserId: robloxUser.id,
    robloxUsername: robloxUser.name,
  });

  return res.status(200).json({ code, robloxUsername: robloxUser.name });
}
