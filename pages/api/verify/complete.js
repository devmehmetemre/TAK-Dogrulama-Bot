import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";
import { getCode, deleteCode } from "../../../lib/verifyStore";
import { setField } from "../../../lib/sheets";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Giriş yapman gerekiyor." });

  const discordId = session.user.id;
  const pending = getCode(discordId);

  if (!pending) {
    return res.status(400).json({ error: "Bekleyen bir doğrulama bulunamadı veya süresi doldu. Tekrar başlat." });
  }

  // Roblox profil açıklamasını çek ve kodu ara
  const profileRes = await fetch(`https://users.roblox.com/v1/users/${pending.robloxUserId}`);
  if (!profileRes.ok) {
    return res.status(502).json({ error: "Roblox profiline ulaşılamadı. Biraz sonra tekrar dene." });
  }
  const profile = await profileRes.json();
  const description = profile.description || "";

  if (!description.includes(pending.code)) {
    return res.status(400).json({
      error: `Kod profilinde bulunamadı. "${pending.code}" kodunun Roblox profilinin Açıklama kısmında olduğundan emin ol. Kaydettikten sonra birkaç dakika beklemen gerekebilir.`,
    });
  }

  // Doğrulama başarılı → tabloya Discord ID yaz (E sütunu)
  await setField(pending.robloxUserId, "E", discordId);
  deleteCode(discordId);

  return res.status(200).json({
    success: true,
    robloxUsername: pending.robloxUsername,
    robloxUserId: pending.robloxUserId,
  });
}
