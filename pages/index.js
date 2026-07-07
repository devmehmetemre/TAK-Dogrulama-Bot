import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Head from "next/head";

export default function Home() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const [verifyStatus, setVerifyStatus] = useState(null); // null | {verified, robloxUsername, rank, brans}
  const [step, setStep] = useState("idle"); // idle | enterUsername | showCode | success | error
  const [robloxInput, setRobloxInput] = useState("");
  const [codeData, setCodeData] = useState(null); // {code, robloxUsername}
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Giriş yapıldıysa mevcut doğrulama durumunu çek
  useEffect(() => {
    if (!session) return;
    fetch("/api/verify/status")
      .then((r) => r.json())
      .then(setVerifyStatus);
  }, [session]);

  async function handleStart() {
    if (!robloxInput.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxUsername: robloxInput.trim() }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMessage(data.error || "Bir hata oluştu.");
        if (data.alreadyVerified) setStep("idle");
      } else {
        setCodeData(data);
        setStep("showCode");
      }
    } catch (_) {
      setMessage("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/verify/complete", { method: "POST" });
      const data = await r.json();
      if (!r.ok) {
        setMessage(data.error || "Bir hata oluştu.");
      } else {
        setStep("success");
        setVerifyStatus({ verified: true, robloxUsername: data.robloxUsername });
      }
    } catch (_) {
      setMessage("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>TAS Doğrulama</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="page">
        <div className="card">
          {/* Başlık */}
          <div className="header">
            <div className="logo">🎖️</div>
            <h1>TAS Kimlik Doğrulama</h1>
            <p className="subtitle">Discord ve Roblox hesaplarını birbirine bağla</p>
          </div>

          {/* Yükleniyor */}
          {loading && <p className="info">Yükleniyor...</p>}

          {/* Giriş yapılmamış */}
          {!loading && !session && (
            <div className="section">
              <p className="info">Devam etmek için Discord hesabınla giriş yap.</p>
              <button className="btn discord" onClick={() => signIn("discord")}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963a.074.074 0 0 0-.041-.104 13.2 13.2 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
                </svg>
                Discord ile Giriş Yap
              </button>
            </div>
          )}

          {/* Giriş yapılmış */}
          {!loading && session && (
            <>
              {/* Kullanıcı bilgisi */}
              <div className="user-info">
                {session.user.image && (
                  <img src={session.user.image} alt="Avatar" className="avatar" />
                )}
                <div>
                  <strong>{session.user.name}</strong>
                  <span className="tag">Discord ile giriş yapıldı</span>
                </div>
                <button className="btn-link" onClick={() => signOut()}>Çıkış</button>
              </div>

              {/* Zaten doğrulanmış */}
              {verifyStatus?.verified && step !== "success" && (
                <div className="verified-box">
                  <span className="check">✅</span>
                  <div>
                    <strong>Hesabın doğrulandı!</strong>
                    <p>Roblox: <b>{verifyStatus.robloxUsername}</b></p>
                    {verifyStatus.rank && <p>Rütbe: <b>{verifyStatus.rank}</b></p>}
                    {verifyStatus.brans && <p>Branş: <b>{verifyStatus.brans}</b></p>}
                  </div>
                </div>
              )}

              {/* Başarı ekranı */}
              {step === "success" && (
                <div className="success-box">
                  <span className="check">🎉</span>
                  <strong>Doğrulama tamamlandı!</strong>
                  <p>Roblox hesabın (<b>{verifyStatus?.robloxUsername}</b>) Discord hesabınla başarıyla bağlandı.</p>
                </div>
              )}

              {/* Henüz doğrulanmamış + başlangıç */}
              {!verifyStatus?.verified && step === "idle" && (
                <div className="section">
                  <p className="info">Roblox hesabını Discord hesabınla bağla.</p>
                  <button className="btn primary" onClick={() => setStep("enterUsername")}>
                    Doğrulamayı Başlat
                  </button>
                </div>
              )}

              {/* Kullanıcı adı girişi */}
              {step === "enterUsername" && (
                <div className="section">
                  <label className="field-label">Roblox Kullanıcı Adın</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="örn: KullaniciAdi123"
                    value={robloxInput}
                    onChange={(e) => setRobloxInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    autoFocus
                  />
                  {message && <p className="error">{message}</p>}
                  <div className="btn-row">
                    <button className="btn secondary" onClick={() => { setStep("idle"); setMessage(""); }}>
                      Geri
                    </button>
                    <button className="btn primary" onClick={handleStart} disabled={busy}>
                      {busy ? "Kontrol ediliyor..." : "Devam Et"}
                    </button>
                  </div>
                </div>
              )}

              {/* Kod ekranı */}
              {step === "showCode" && codeData && (
                <div className="section">
                  <p className="info">
                    <b>{codeData.robloxUsername}</b> adlı Roblox profilinin{" "}
                    <b>Açıklama (About)</b> kısmına aşağıdaki kodu ekle, kaydet, sonra
                    "Doğrulamayı Tamamla"ya bas.
                  </p>
                  <div className="code-box">
                    <span className="code">{codeData.code}</span>
                    <button
                      className="btn-copy"
                      onClick={() => navigator.clipboard.writeText(codeData.code)}
                      title="Kopyala"
                    >
                      📋
                    </button>
                  </div>
                  <a
                    className="link"
                    href={`https://www.roblox.com/users/search?keyword=${encodeURIComponent(codeData.robloxUsername)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Roblox profilini aç →
                  </a>
                  {message && <p className="error">{message}</p>}
                  <div className="btn-row">
                    <button className="btn secondary" onClick={() => { setStep("enterUsername"); setMessage(""); }}>
                      Geri
                    </button>
                    <button className="btn primary" onClick={handleComplete} disabled={busy}>
                      {busy ? "Kontrol ediliyor..." : "Doğrulamayı Tamamla"}
                    </button>
                  </div>
                  <p className="hint">Bu kod 15 dakika geçerlidir.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #0f1117;
          color: #e2e8f0;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .card {
          background: #1a1d27;
          border: 1px solid #2d3148;
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .header { text-align: center; margin-bottom: 1.5rem; }
        .logo { font-size: 2.5rem; margin-bottom: 0.5rem; }
        h1 { font-size: 1.4rem; font-weight: 700; color: #fff; }
        .subtitle { font-size: 0.875rem; color: #94a3b8; margin-top: 0.25rem; }
        .section { display: flex; flex-direction: column; gap: 0.75rem; }
        .info { color: #94a3b8; font-size: 0.9rem; text-align: center; }
        .error { color: #f87171; font-size: 0.85rem; }
        .hint { color: #64748b; font-size: 0.78rem; text-align: center; }
        .btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          border: none; border-radius: 8px;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn:hover:not(:disabled) { opacity: 0.88; }
        .btn.discord { background: #5865f2; color: #fff; width: 100%; }
        .btn.primary  { background: #4f46e5; color: #fff; flex: 1; }
        .btn.secondary { background: #2d3148; color: #e2e8f0; flex: 1; }
        .btn-link { background: none; border: none; color: #64748b; font-size: 0.8rem; cursor: pointer; margin-left: auto; }
        .btn-row { display: flex; gap: 0.5rem; }
        .user-info {
          display: flex; align-items: center; gap: 0.75rem;
          background: #12141e; border-radius: 10px; padding: 0.75rem;
          margin-bottom: 1rem;
        }
        .avatar { width: 36px; height: 36px; border-radius: 50%; }
        .tag { display: block; font-size: 0.75rem; color: #64748b; }
        .verified-box, .success-box {
          display: flex; align-items: flex-start; gap: 0.75rem;
          background: #12231a; border: 1px solid #1a3d2a;
          border-radius: 10px; padding: 1rem;
        }
        .success-box { flex-direction: column; align-items: center; text-align: center; }
        .check { font-size: 1.5rem; }
        .verified-box p, .success-box p { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
        .code-box {
          display: flex; align-items: center; justify-content: space-between;
          background: #0d0f18; border: 1px solid #2d3148;
          border-radius: 8px; padding: 0.75rem 1rem;
        }
        .code { font-family: monospace; font-size: 1.2rem; letter-spacing: 0.1em; color: #fbbf24; }
        .btn-copy { background: none; border: none; font-size: 1.1rem; cursor: pointer; }
        .link { color: #818cf8; font-size: 0.85rem; text-align: center; }
        .field-label { font-size: 0.85rem; color: #94a3b8; }
        .input {
          width: 100%; padding: 0.65rem 0.85rem;
          background: #12141e; border: 1px solid #2d3148;
          border-radius: 8px; color: #e2e8f0; font-size: 0.9rem;
        }
        .input:focus { outline: none; border-color: #4f46e5; }
      `}</style>
    </>
  );
}
