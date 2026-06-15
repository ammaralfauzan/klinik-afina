"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    if (email === "admin@klinik-afina.com" && password === "admin123") {
      document.cookie = "isLoggedIn=true; path=/; max-age=86400";
      localStorage.setItem("isLoggedIn", "true");
      router.push("/");
    } else {
      setError("Email atau password salah. Coba lagi.");
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; }
        h1, h2, h3 { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .login-input {
          width: 100%; background: #F8F7FF; border: 1.5px solid #E8E4FF;
          border-radius: 10px; padding: 12px 14px; font-size: 14px;
          color: #1A1A2E; outline: none; transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .login-input::placeholder { color: #B0AECA; }
        .login-input:focus { border-color: #7B61FF; background: #fff; box-shadow: 0 0 0 3px rgba(123,97,255,0.1); }
        .login-btn {
          width: 100%; background: #7B61FF; color: #fff;
          border: none; border-radius: 12px; padding: 14px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .login-btn:hover:not(:disabled) { background: #6A50EE; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(123,97,255,0.35); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .login-card { animation: fadeIn 0.5s ease forwards; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #2E2466 0%, #3D3178 50%, #4B3F9E 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "fixed", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(123,97,255,0.15)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: "-60px", left: "-60px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(245,166,35,0.1)", pointerEvents: "none" }} />

        <div className="login-card" style={{
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          maxWidth: "420px",
          width: "100%",
          padding: "40px 36px",
          position: "relative",
        }}>
          {/* Logo & Title */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#fff", border: "2px solid #E8E4FF",
              boxShadow: "0 4px 16px rgba(123,97,255,0.12)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "6px", marginBottom: "16px",
            }}>
              <Image src="/logo-afina.png" alt="Klinik Afina" width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "50%" }} />
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#1A1A2E", margin: 0 }}>Klinik & RB Afina</h1>
            <p style={{ fontSize: "13px", color: "#8B8FA8", marginTop: "4px", fontWeight: 500 }}>Sistem Manajemen</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
              fontSize: "13px", color: "#dc2626", fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#7B61FF", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Email</label>
              <input
                className="login-input"
                type="email"
                placeholder="admin@klinik-afina.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#7B61FF", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ paddingRight: "44px" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#B0AECA",
                    display: "flex", alignItems: "center", padding: "4px",
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              style={{ marginTop: "4px" }}
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "11px", color: "#B0AECA", marginTop: "28px" }}>
            &copy; {new Date().getFullYear()} Klinik & RB Afina. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
