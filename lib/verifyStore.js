// Vercel'in serverless ortamında bellek her request'te sıfırlanabilir,
// bu yüzden kodları global bir Map'te değil, bir modül-düzeyi Map'te tutuyoruz.
// TTL (süre dolunca) kontrolü her okumada yapılır.
// Not: Production'da çok kullanıcı varsa Redis gibi bir store daha sağlam olur,
// ama küçük bir topluluk için bu yeterli.

const store = new Map();
const TTL_MS = 15 * 60 * 1000; // 15 dakika

export function saveCode(discordId, data) {
  store.set(discordId, { ...data, createdAt: Date.now() });
}

export function getCode(discordId) {
  const entry = store.get(discordId);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(discordId);
    return null;
  }
  return entry;
}

export function deleteCode(discordId) {
  store.delete(discordId);
}
