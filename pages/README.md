# TAS Doğrulama Web Sitesi

Discord ile giriş yap, Roblox hesabını bağla.
Next.js ile yazılmış, Vercel'de ücretsiz çalışır.

---

## Kurulum Adımları

### 1) Discord OAuth Ayarları

1. https://discord.com/developers/applications → uygulamana tıkla
2. Sol menü → **OAuth2 → General**
3. **Redirects** kısmına şunları ekle:
   - `http://localhost:3000/api/auth/callback/discord` (lokal test için)
   - `https://SITEN.vercel.app/api/auth/callback/discord` (production için)
4. **Client ID** ve **Client Secret**'i kopyala → `.env.local`'e yaz

### 2) Google Sheets

Discord botunla aynı servis hesabını kullanabilirsin — ekstra bir şey yapmana gerek yok. Sadece aynı `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SPREADSHEET_ID`, `SHEET_NAME` değerlerini `.env.local`'e kopyala.

### 3) Lokal Test

```bash
cp .env.local.example .env.local
# .env.local dosyasını doldur
npm install
npm run dev
# → http://localhost:3000
```

### 4) Vercel'e Deploy

1. Bu klasörü GitHub'a push et (`.env.local` gitignore'da, yüklenmez)
2. https://vercel.com → New Project → GitHub reposunu seç
3. Vercel otomatik Next.js projesi olarak tanır
4. **Settings → Environment Variables** kısmına `.env.local`'deki tüm değerleri gir:
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `NEXTAUTH_SECRET` → `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` ile üret
   - `NEXTAUTH_URL` → `https://SITEN.vercel.app` (Vercel'in verdiği URL)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `SPREADSHEET_ID`
   - `SHEET_NAME`
5. Deploy et
6. Vercel'in verdiği URL'yi al (`https://proje-adi.vercel.app`)
7. Discord Developer Portal'a geri dön, Redirect URI'a bu URL'yi ekle:
   `https://proje-adi.vercel.app/api/auth/callback/discord`
8. Hepsi bu kadar!

---

## Nasıl Çalışır

1. Kullanıcı siteye girer → **"Discord ile Giriş Yap"** → Discord OAuth
2. Roblox kullanıcı adını girer → site API'den kontrol eder, bir doğrulama kodu üretir
3. Kullanıcı kodu Roblox profilinin **Açıklama (About)** kısmına ekler
4. **"Doğrulamayı Tamamla"** → site kodu kontrol eder, başarılıysa Google Tablo'nun **E sütununa** Discord ID'yi yazar
5. Discord bot artık bu kişiyi tanıyor → `/albayver` gibi bir komut kullanıldığında Discord rolü de otomatik güncelleniyor
