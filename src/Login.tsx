// src/Login.tsx — Rediseño moderno split-screen
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onRequirePasswordChange }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwVisible, setPwVisible] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setLoading(false);
      setError("Credenciales incorrectas o usuario no registrado.");
      return;
    }

    if (data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("user_id", data.user.id)
        .single();

      setLoading(false);

      if (profileError || !profile) {
        setError("Error al cargar el perfil del usuario.");
        return;
      }

      if (profile.must_change_password) {
        onRequirePasswordChange(data.user);
      } else {
        onLogin(data.user);
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .login-root {
          min-height: 100dvh;
          display: flex;
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: #FAFAFA;
        }

        /* ── Panel izquierdo ── */
        .login-brand {
          width: 42%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 3.5rem;
          overflow: hidden;
          background:
            url('/Fondo 2022 47111 UNMSM.png') center/cover no-repeat;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg,
            rgba(30, 6, 56, 0.92) 0%,
            rgba(52, 18, 75, 0.88) 60%,
            rgba(20, 4, 38, 0.95) 100%);
        }
        /* Patrón de puntos decorativo */
        .login-brand::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(212,160,23,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .brand-top, .brand-mid, .brand-bot {
          position: relative;
          z-index: 1;
        }

        .brand-top {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }
        .brand-crest {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid rgba(212,160,23,0.6);
          object-fit: cover;
          flex-shrink: 0;
        }
        .brand-acronym {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
        }

        .brand-mid { padding: 2rem 0; }
        .brand-rule {
          width: 40px;
          height: 2px;
          background: #D4A017;
          margin-bottom: 2rem;
          border-radius: 1px;
        }
        .brand-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(1.65rem, 2.5vw, 2.25rem);
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.2;
          letter-spacing: -0.01em;
          margin: 0 0 1rem 0;
        }
        .brand-subtitle {
          font-size: 0.82rem;
          font-weight: 400;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
          margin: 0;
          max-width: 280px;
        }

        .brand-bot {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.04em;
        }

        /* ── Panel derecho ── */
        .login-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          background: #FAFAFA;
          animation: slideIn 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0);    }
        }

        .form-inner {
          width: 100%;
          max-width: 380px;
        }

        /* Header móvil (solo visible en móvil) */
        .mobile-header {
          display: none;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #E4E4E7;
        }
        .mobile-header img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #5B2C6F;
          object-fit: cover;
        }
        .mobile-header-text { line-height: 1.2; }
        .mobile-header-text strong {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #2C0A4F;
        }
        .mobile-header-text span {
          font-size: 0.75rem;
          color: #9CA3AF;
        }

        /* Form headings */
        .form-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2rem;
          font-weight: 600;
          color: #0F0A14;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }
        .form-subheading {
          font-size: 0.875rem;
          color: #6B7280;
          margin: 0 0 2.25rem;
          font-weight: 400;
        }

        /* Inputs */
        .field { margin-bottom: 1.25rem; }
        .field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .field-wrap { position: relative; }
        .field-wrap input {
          width: 100%;
          padding: 0.8125rem 1rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          color: #0F0A14;
          background: #fff;
          border: 1.5px solid #E4E4E7;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          -webkit-appearance: none;
        }
        .field-wrap input:focus {
          border-color: #5B2C6F;
          box-shadow: 0 0 0 3px rgba(91,44,111,0.1);
        }
        .field-wrap input::placeholder { color: #C4B5C9; }

        /* Toggle password */
        .pw-toggle {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9CA3AF;
          padding: 0;
          display: flex;
          align-items: center;
          font-size: 1rem;
          transition: color 0.15s;
        }
        .pw-toggle:hover { color: #5B2C6F; }

        /* Error */
        .form-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #FFF5F5;
          border: 1.5px solid #FECACA;
          border-radius: 8px;
          padding: 0.7rem 0.875rem;
          font-size: 0.85rem;
          color: #B91C1C;
          margin-bottom: 1.25rem;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0);  }
          25%      { transform: translateX(-4px); }
          75%      { transform: translateX(4px);  }
        }

        /* Submit */
        .btn-submit {
          width: 100%;
          padding: 0.9rem 1rem;
          background: #3D1A4F;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(61,26,79,0.2);
          margin-top: 0.5rem;
        }
        .btn-submit:hover:not(:disabled) {
          background: #4e2263;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.12), 0 8px 20px rgba(61,26,79,0.28);
        }
        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-submit:disabled {
          background: #9CA3AF;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Spinner */
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Form footer */
        .form-footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #E4E4E7;
          text-align: center;
        }
        .form-footer p {
          font-size: 0.75rem;
          color: #9CA3AF;
          margin: 0;
          line-height: 1.6;
        }

        /* ── Responsive ── */
        @media (max-width: 767px) {
          .login-brand   { display: none; }
          .login-form-panel {
            padding: 2rem 1.25rem;
            justify-content: flex-start;
            padding-top: 3rem;
          }
          .mobile-header { display: flex; }
          .form-heading  { font-size: 1.625rem; }
          .form-inner    { max-width: 100%; }
        }

        @media (max-width: 380px) {
          .login-form-panel { padding: 1.5rem 1rem; }
        }
      `}</style>

      <div className="login-root">

        {/* ── Panel izquierdo: identidad institucional ── */}
        <aside className="login-brand">
          <div className="brand-top">
            <img src="/Escudo SF.jpg" alt="Escudo FMSF" className="brand-crest" />
            <span className="brand-acronym">FM San Fernando · UNMSM</span>
          </div>

          <div className="brand-mid">
            <div className="brand-rule" />
            <h1 className="brand-title">
              Sistema de Gestión<br />de Convenios
            </h1>
            <p className="brand-subtitle">
              Unidad de Cooperación, Relaciones Interinstitucionales y Gestión de Proyectos
            </p>
          </div>

          <div className="brand-bot">
            © {new Date().getFullYear()} UNMSM · Todos los derechos reservados
          </div>
        </aside>

        {/* ── Panel derecho: formulario ── */}
        <main className="login-form-panel">
          <div className="form-inner">

            {/* Logo compacto — solo móvil */}
            <div className="mobile-header">
              <img src="/Escudo SF.jpg" alt="Logo" />
              <div className="mobile-header-text">
                <strong>Sistema de Convenios</strong>
                <span>FM San Fernando · UNMSM</span>
              </div>
            </div>

            <h2 className="form-heading">Bienvenido</h2>
            <p className="form-subheading">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleLogin} noValidate>

              {/* Email */}
              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <div className="field-wrap">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="usuario@unmsm.edu.pe"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <div className="field-wrap">
                  <input
                    id="password"
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
                    className="pw-toggle"
                    onClick={() => setPwVisible(v => !v)}
                    aria-label={pwVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {pwVisible ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="form-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Botón */}
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <><div className="spinner" />Verificando...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Ingresar
                  </>
                )}
              </button>

            </form>

            {/* Footer */}
            <div className="form-footer">
              <p>
                © {new Date().getFullYear()} Universidad Nacional Mayor de San Marcos<br />
                Facultad de Medicina San Fernando
              </p>
            </div>

          </div>
        </main>

      </div>
    </>
  );
}