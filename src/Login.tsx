// src/Login.tsx — Redesign v3: Dark Surrealist Minimal
import { useState, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onRequirePasswordChange }: any) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef<number>(0);

  // ── Auth logic (unchanged) ────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setLoading(false); setError("Credenciales incorrectas o usuario no registrado."); return; }
    if (data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles").select("must_change_password").eq("user_id", data.user.id).single();
      setLoading(false);
      if (profileError || !profile) { setError("Error al cargar el perfil."); return; }
      profile.must_change_password ? onRequirePasswordChange(data.user) : onLogin(data.user);
    }
  };

  // ── 3D card tilt (rAF-throttled, no React re-render) ─────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 12;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 12;
      card.style.transform = `perspective(1400px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(24px)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (cardRef.current)
      cardRef.current.style.transform = "perspective(1400px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Scene ─────────────────────────────────────────── */
        .ls {
          min-height: 100dvh;
          width: 100%;
          background: #070010;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', system-ui, sans-serif;
        }

        /* ── Blurred orbs ──────────────────────────────────── */
        .orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          will-change: transform;
        }
        .orb-1 {
          width: 700px; height: 700px;
          top: -180px; right: -100px;
          background: radial-gradient(circle at 40% 40%, rgba(109,40,217,0.45), transparent 65%);
          filter: blur(72px);
          animation: drift1 14s ease-in-out infinite;
        }
        .orb-2 {
          width: 560px; height: 560px;
          bottom: -120px; left: -80px;
          background: radial-gradient(circle at 60% 60%, rgba(49,46,129,0.5), transparent 65%);
          filter: blur(64px);
          animation: drift2 18s ease-in-out infinite;
        }
        .orb-3 {
          width: 260px; height: 260px;
          top: 45%; left: 35%;
          background: radial-gradient(circle, rgba(180,120,20,0.18), transparent 60%);
          filter: blur(48px);
          animation: drift3 22s ease-in-out infinite;
        }
        @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,30px) scale(1.08)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.06)} }
        @keyframes drift3 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(20px,-20px)} 66%{transform:translate(-20px,20px)} }

        /* ── 3D Rings ──────────────────────────────────────── */
        .ring-wrap {
          position: absolute;
          width: 600px; height: 600px;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          transform-style: preserve-3d;
        }
        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(212,160,23,0.2);
        }
        .ring-1 { animation: ring-spin-1 28s linear infinite; transform: rotateX(74deg) rotateZ(0deg); }
        .ring-2 {
          inset: 60px;
          border-color: rgba(255,255,255,0.07);
          animation: ring-spin-2 20s linear infinite reverse;
          transform: rotateX(74deg) rotateZ(45deg);
        }
        .ring-3 {
          inset: 130px;
          border-color: rgba(212,160,23,0.1);
          animation: ring-spin-1 35s linear infinite;
          transform: rotateX(60deg) rotateZ(20deg);
        }
        @keyframes ring-spin-1 { to { transform: rotateX(74deg) rotateZ(360deg); } }
        @keyframes ring-spin-2 { to { transform: rotateX(74deg) rotateZ(-315deg); } }

        /* ── Ghost text ────────────────────────────────────── */
        .ghost {
          position: absolute;
          bottom: -2%;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(80px, 15vw, 200px);
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1;
          white-space: nowrap;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255,255,255,0.045);
          pointer-events: none;
          user-select: none;
        }

        /* ── Grain overlay ─────────────────────────────────── */
        .grain {
          position: fixed;
          inset: -100px;
          pointer-events: none;
          z-index: 5;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 128px 128px;
          animation: grain-drift 0.5s steps(1) infinite;
        }
        @keyframes grain-drift { 0%{transform:translate(0,0)} 25%{transform:translate(-2%,1%)} 50%{transform:translate(1%,-2%)} 75%{transform:translate(-1%,2%)} 100%{transform:translate(2%,-1%)} }

        /* ── Center layout ─────────────────────────────────── */
        .center {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          width: 100%;
          max-width: 420px;
          padding: 0 1.25rem;
        }

        /* ── Floating crest ────────────────────────────────── */
        .crest-wrap {
          position: relative;
          z-index: 2;
          margin-bottom: -28px;
          animation: crest-float 6s ease-in-out infinite;
        }
        @keyframes crest-float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .crest-img {
          width: 72px; height: 72px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid rgba(212,160,23,0.5);
          box-shadow:
            0 0 0 6px rgba(212,160,23,0.06),
            0 0 0 12px rgba(212,160,23,0.03),
            0 16px 40px rgba(0,0,0,0.6),
            0 0 30px rgba(109,40,217,0.3);
        }

        /* ── Glass card ────────────────────────────────────── */
        .card {
          width: 100%;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(32px) saturate(160%);
          -webkit-backdrop-filter: blur(32px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.09);
          border-top: 1px solid rgba(255,255,255,0.14);
          border-radius: 20px;
          padding: 3rem 2.5rem 2rem;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.07) inset,
            0 -1px 0 rgba(0,0,0,0.3) inset,
            0 40px 80px rgba(0,0,0,0.55),
            0 0 0 0.5px rgba(255,255,255,0.04);
          transition: transform 0.12s ease-out;
          will-change: transform;
        }

        /* ── Card top label ────────────────────────────────── */
        .card-inst {
          text-align: center;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 1.75rem;
        }
        .card-inst span {
          display: inline-block;
          width: 24px;
          height: 1px;
          background: rgba(212,160,23,0.4);
          vertical-align: middle;
          margin: 0 0.6rem;
        }

        /* ── Heading ───────────────────────────────────────── */
        .card-h {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 600;
          color: #F0EBFF;
          letter-spacing: -0.02em;
          line-height: 1.1;
          text-align: center;
          margin-bottom: 0.4rem;
        }
        .card-sub {
          text-align: center;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.32);
          margin-bottom: 2rem;
          font-weight: 300;
        }

        /* ── Fields ────────────────────────────────────────── */
        .field { margin-bottom: 1.1rem; }
        .field label {
          display: block;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 0.45rem;
        }
        .field-inner { position: relative; }
        .field-inner input {
          width: 100%;
          padding: 0.8rem 1rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #F0EBFF;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 300;
          outline: none;
          transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
          -webkit-appearance: none;
        }
        .field-inner input::placeholder { color: rgba(255,255,255,0.18); }
        .field-inner input:focus {
          border-color: rgba(212,160,23,0.6);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 3px rgba(212,160,23,0.1);
        }
        /* autofill dark override */
        .field-inner input:-webkit-autofill,
        .field-inner input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #160030 inset;
          -webkit-text-fill-color: #F0EBFF;
        }
        .pw-eye {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.25);
          padding: 0;
          display: flex;
          transition: color 0.15s;
          line-height: 1;
        }
        .pw-eye:hover { color: rgba(212,160,23,0.8); }
        .pw-eye svg { width: 16px; height: 16px; }

        /* ── Error ─────────────────────────────────────────── */
        .err {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px;
          padding: 0.65rem 0.875rem;
          font-size: 0.82rem;
          color: #FCA5A5;
          margin-bottom: 1rem;
          animation: shake 0.28s ease;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 30%{transform:translateX(-4px)} 70%{transform:translateX(4px)} }

        /* ── Button ────────────────────────────────────────── */
        .btn {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.875rem;
          background: #FAFAFA;
          color: #0A000F;
          border: none;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.06);
        }
        .btn:hover:not(:disabled) {
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.08);
        }
        .btn:active:not(:disabled) { transform: translateY(0); }
        .btn:disabled { background: rgba(255,255,255,0.18); color: rgba(255,255,255,0.35); cursor: not-allowed; box-shadow: none; }

        /* ── Spinner ───────────────────────────────────────── */
        .spin {
          width: 15px; height: 15px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0A000F;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Card footer ───────────────────────────────────── */
        .card-foot {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          text-align: center;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.2);
          line-height: 1.7;
          font-weight: 300;
        }

        /* ── Mobile ────────────────────────────────────────── */
        @media (max-width: 767px) {
          .ring-wrap { width: 360px; height: 360px; }
          .ghost { font-size: 22vw; bottom: -1%; }
          .card { padding: 2.5rem 1.75rem 1.75rem; border-radius: 16px; }
          .card-h { font-size: 2rem; }
          .center { padding: 0 1rem; }
          .crest-img { width: 60px; height: 60px; }
          .crest-wrap { margin-bottom: -22px; }
        }
        @media (max-width: 380px) {
          .card { padding: 2rem 1.25rem 1.5rem; }
        }
      `}</style>

      {/* ── Scene ────────────────────────────────────── */}
      <div className="ls">

        {/* Blurred orbs */}
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />
        <div className="orb orb-3" aria-hidden="true" />

        {/* 3D orbital rings */}
        <div className="ring-wrap" aria-hidden="true">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>

        {/* Ghost text */}
        <div className="ghost" aria-hidden="true">CONVENIOS</div>

        {/* Grain texture */}
        <div className="grain" aria-hidden="true" />

        {/* Center */}
        <div className="center">

          {/* Floating crest */}
          <div className="crest-wrap">
            <img src="/Escudo SF.jpg" alt="Escudo FM San Fernando" className="crest-img" />
          </div>

          {/* Glass card — mouse tilt */}
          <div
            className="card"
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Institution label */}
            <p className="card-inst">
              <span />FM San Fernando · UNMSM<span />
            </p>

            <h1 className="card-h">Bienvenido</h1>
            <p className="card-sub">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleLogin} noValidate>

              {/* Email */}
              <div className="field">
                <label htmlFor="ls-email">Correo electrónico</label>
                <div className="field-inner">
                  <input
                    id="ls-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@unmsm.edu.pe"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label htmlFor="ls-password">Contraseña</label>
                <div className="field-inner">
                  <input
                    id="ls-password"
                    type={pwVisible ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ paddingRight: "2.75rem" }}
                    required
                  />
                  <button
                    type="button"
                    className="pw-eye"
                    onClick={() => setPwVisible(v => !v)}
                    aria-label={pwVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={-1}
                  >
                    {pwVisible ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="err" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:"1px"}}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.6" fill="currentColor"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="btn" disabled={loading}>
                {loading ? (
                  <><div className="spin" />Verificando...</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Ingresar al sistema
                  </>
                )}
              </button>

            </form>

            <div className="card-foot">
              Sistema de Gestión de Convenios<br />
              © {new Date().getFullYear()} Universidad Nacional Mayor de San Marcos
            </div>
          </div>

        </div>
      </div>
    </>
  );
}