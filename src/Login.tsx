// src/Login.tsx — v4: Vivid Surrealist 3D
import { useState, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin, onRequirePasswordChange }: any) {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [pwVisible, setPwVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef  = useRef<number>(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setLoading(false); setError("Credenciales incorrectas o usuario no registrado."); return; }
    if (data?.user) {
      const { data: profile, error: pErr } = await supabase.from("profiles").select("must_change_password").eq("user_id", data.user.id).single();
      setLoading(false);
      if (pErr || !profile) { setError("Error al cargar el perfil."); return; }
      profile.must_change_password ? onRequirePasswordChange(data.user) : onLogin(data.user);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const c = cardRef.current; if (!c) return;
      const r = c.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 14;
      c.style.transform = `perspective(1400px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(24px)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (cardRef.current) cardRef.current.style.transform = "perspective(1400px) rotateY(0deg) rotateX(0deg) translateZ(0)";
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* ── Escena principal ── */
        .ls {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: #0E001E;
          font-family: 'Outfit', system-ui, sans-serif;
          overflow: hidden; z-index: 9999;
        }

        /* ── Orbs más grandes y vivos ── */
        .orb { position: absolute; border-radius: 50%; pointer-events: none; will-change: transform; }
        .orb-1 {
          width: 900px; height: 900px; top: -260px; right: -180px;
          background: radial-gradient(circle at 40% 40%, rgba(124,58,237,0.55), rgba(79,20,180,0.2) 50%, transparent 70%);
          filter: blur(55px);
          animation: drift1 14s ease-in-out infinite;
        }
        .orb-2 {
          width: 720px; height: 720px; bottom: -180px; left: -140px;
          background: radial-gradient(circle at 60% 60%, rgba(67,56,202,0.55), rgba(30,20,130,0.2) 50%, transparent 70%);
          filter: blur(50px);
          animation: drift2 18s ease-in-out infinite;
        }
        .orb-3 {
          width: 380px; height: 380px; top: 40%; left: 38%;
          background: radial-gradient(circle, rgba(200,130,20,0.22), transparent 60%);
          filter: blur(44px);
          animation: drift3 22s ease-in-out infinite;
        }
        /* Orb lateral izquierdo */
        .orb-4 {
          width: 500px; height: 500px; top: 20%; left: -180px;
          background: radial-gradient(circle, rgba(139,92,246,0.3), transparent 65%);
          filter: blur(60px);
          animation: drift2 26s ease-in-out infinite reverse;
        }
        /* Orb lateral derecho */
        .orb-5 {
          width: 500px; height: 500px; bottom: 10%; right: -180px;
          background: radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%);
          filter: blur(55px);
          animation: drift1 20s ease-in-out infinite reverse;
        }
        @keyframes drift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,30px) scale(1.07)}}
        @keyframes drift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-35px) scale(1.05)}}
        @keyframes drift3{0%,100%{transform:translate(0,0)}33%{transform:translate(20px,-20px)}66%{transform:translate(-18px,18px)}}

        /* ── 3 grupos de anillos (centro + 2 lados) ── */
        .ring-group { position: absolute; pointer-events: none; transform-style: preserve-3d; }

        /* Centro — grande */
        .rg-center { width: 680px; height: 680px; top:50%; left:50%; transform:translate(-50%,-50%); }
        /* Izquierdo */
        .rg-left   { width: 420px; height: 420px; top:50%; left:-80px; transform:translateY(-50%); }
        /* Derecho */
        .rg-right  { width: 420px; height: 420px; top:50%; right:-80px; transform:translateY(-50%); }

        .ring { position: absolute; inset: 0; border-radius: 50%; }
        /* Centro */
        .rg-center .r1 { border:1px solid rgba(212,160,23,0.22); animation: rs1 28s linear infinite; transform:rotateX(74deg) rotateZ(0deg); }
        .rg-center .r2 { inset:70px; border:1px solid rgba(255,255,255,0.08); animation:rs2 20s linear infinite reverse; transform:rotateX(74deg) rotateZ(45deg); }
        .rg-center .r3 { inset:145px; border:1px solid rgba(212,160,23,0.1); animation:rs1 36s linear infinite; transform:rotateX(62deg) rotateZ(22deg); }
        /* Lado izq */
        .rg-left .r1  { border:1px solid rgba(139,92,246,0.25); animation:rs1 22s linear infinite; transform:rotateX(70deg) rotateZ(0deg); }
        .rg-left .r2  { inset:50px; border:1px solid rgba(255,255,255,0.06); animation:rs2 16s linear infinite; transform:rotateX(70deg) rotateZ(60deg); }
        /* Lado der */
        .rg-right .r1 { border:1px solid rgba(99,102,241,0.25); animation:rs2 24s linear infinite; transform:rotateX(70deg) rotateZ(0deg); }
        .rg-right .r2 { inset:50px; border:1px solid rgba(255,255,255,0.06); animation:rs1 18s linear infinite; transform:rotateX(70deg) rotateZ(30deg); }

        @keyframes rs1{to{transform:rotateX(74deg) rotateZ(360deg)}}
        @keyframes rs2{to{transform:rotateX(74deg) rotateZ(-360deg)}}

        /* ── Cubos 3D wireframe ── */
        .cube-wrap {
          position: absolute; pointer-events: none;
          transform-style: preserve-3d;
        }
        .c-left  { width:90px; height:90px; top:15%; left:8%; animation: cube-spin-a 25s linear infinite; }
        .c-left2 { width:55px; height:55px; top:65%; left:12%; animation: cube-spin-b 32s linear infinite reverse; }
        .c-right  { width:80px; height:80px; top:20%; right:7%; animation: cube-spin-b 28s linear infinite; }
        .c-right2 { width:50px; height:50px; bottom:22%; right:10%; animation: cube-spin-a 20s linear infinite; }

        .cf { position:absolute; border:1px solid rgba(212,160,23,0.18); background:rgba(109,40,217,0.04); }

        @keyframes cube-spin-a { from{transform:rotateX(20deg) rotateY(0) rotateZ(10deg)} to{transform:rotateX(20deg) rotateY(360deg) rotateZ(10deg)} }
        @keyframes cube-spin-b { from{transform:rotateX(-15deg) rotateY(0) rotateZ(-5deg)} to{transform:rotateX(-15deg) rotateY(-360deg) rotateZ(-5deg)} }

        /* ── Grid de perspectiva ── */
        .persp-grid {
          position: absolute; bottom: 0; left: -20%; right: -20%;
          height: 55vh;
          background-image:
            linear-gradient(rgba(124,58,237,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.12) 1px, transparent 1px);
          background-size: 70px 70px;
          transform: perspective(350px) rotateX(65deg);
          transform-origin: bottom center;
          pointer-events: none;
          mask-image: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
          -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
        }

        /* ── Partículas flotantes ── */
        .pts { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
        .pt  {
          position:absolute; width:3px; height:3px; border-radius:50%;
          background:rgba(212,160,23,0.7);
          animation: pt-rise linear infinite;
          will-change: transform, opacity;
        }
        .pt:nth-child(1)  {left:8%;  bottom:-5%; animation-duration:12s; animation-delay:0s;    width:2px; height:2px;}
        .pt:nth-child(2)  {left:18%; bottom:-5%; animation-duration:18s; animation-delay:2s;    opacity:.5;}
        .pt:nth-child(3)  {left:28%; bottom:-5%; animation-duration:14s; animation-delay:4s;    width:2px;}
        .pt:nth-child(4)  {left:72%; bottom:-5%; animation-duration:16s; animation-delay:1s;    opacity:.4;}
        .pt:nth-child(5)  {left:82%; bottom:-5%; animation-duration:20s; animation-delay:6s;    width:2px;}
        .pt:nth-child(6)  {left:90%; bottom:-5%; animation-duration:13s; animation-delay:3s;    opacity:.6;}
        .pt:nth-child(7)  {left:5%;  bottom:-5%; animation-duration:22s; animation-delay:8s;    width:2px; opacity:.3;}
        .pt:nth-child(8)  {left:95%; bottom:-5%; animation-duration:15s; animation-delay:5s;    opacity:.5;}
        .pt:nth-child(9)  {left:45%; bottom:-5%; animation-duration:24s; animation-delay:7s;    width:2px; opacity:.35;}
        .pt:nth-child(10) {left:60%; bottom:-5%; animation-duration:11s; animation-delay:9s;}
        @keyframes pt-rise {
          0%   { transform:translateY(0) scale(1);  opacity:0; }
          10%  { opacity:1; }
          90%  { opacity:.3; }
          100% { transform:translateY(-110vh) scale(0.4); opacity:0; }
        }

        /* ── Texto fantasma ── */
        .ghost {
          position:absolute; bottom:-3%; left:50%; transform:translateX(-50%);
          font-family:'Cormorant Garamond',Georgia,serif;
          font-size:clamp(90px,16vw,220px);
          font-weight:600; letter-spacing:-0.04em; line-height:1;
          white-space:nowrap; color:transparent;
          -webkit-text-stroke:1px rgba(255,255,255,0.055);
          pointer-events:none; user-select:none;
        }

        /* ── Grain ── */
        .grain {
          position:fixed; inset:-100px; pointer-events:none; z-index:5; opacity:.05;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:128px; animation:grain-anim .5s steps(1) infinite;
        }
        @keyframes grain-anim{0%{transform:translate(0,0)}25%{transform:translate(-2%,1%)}50%{transform:translate(1%,-2%)}75%{transform:translate(-1%,2%)}100%{transform:translate(2%,-1%)}}

        /* ── Centro ── */
        .center { position:relative; z-index:10; display:flex; flex-direction:column; align-items:center; width:100%; max-width:420px; padding:0 1.25rem; }

        /* Escudo flotante */
        .crest-wrap { position:relative; z-index:2; margin-bottom:-28px; animation:crest-float 6s ease-in-out infinite; }
        @keyframes crest-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        .crest-img {
          width:76px; height:76px; border-radius:50%; object-fit:cover;
          border:1.5px solid rgba(212,160,23,0.55);
          box-shadow:0 0 0 6px rgba(212,160,23,0.07),0 0 0 14px rgba(212,160,23,0.03),0 18px 40px rgba(0,0,0,0.65),0 0 35px rgba(124,58,237,0.35);
        }

        /* Card glass */
        .card {
          width:100%;
          background:rgba(255,255,255,0.045);
          backdrop-filter:blur(30px) saturate(160%); -webkit-backdrop-filter:blur(30px) saturate(160%);
          border:1px solid rgba(255,255,255,0.1); border-top:1px solid rgba(255,255,255,0.16);
          border-radius:22px;
          padding:3rem 2.5rem 2rem;
          box-shadow:0 1px 0 rgba(255,255,255,0.08) inset,0 -1px 0 rgba(0,0,0,0.3) inset,0 40px 80px rgba(0,0,0,0.55),0 0 80px rgba(124,58,237,0.12);
          transition:transform .12s ease-out; will-change:transform;
        }

        /* Inst label */
        .card-inst { text-align:center; font-size:.7rem; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-bottom:1.75rem; }
        .card-inst span { display:inline-block; width:22px; height:1px; background:rgba(212,160,23,0.45); vertical-align:middle; margin:0 .6rem; }

        /* Heading */
        .card-h { font-family:'Cormorant Garamond',Georgia,serif; font-size:2.6rem; font-weight:600; color:#F0EBFF; letter-spacing:-.02em; line-height:1.1; text-align:center; margin-bottom:.4rem; }
        .card-sub { text-align:center; font-size:.82rem; color:rgba(255,255,255,.32); margin-bottom:2rem; font-weight:300; }

        /* Fields */
        .field { margin-bottom:1.1rem; }
        .field label { display:block; font-size:.68rem; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:rgba(255,255,255,.4); margin-bottom:.45rem; }
        .field-inner { position:relative; }
        .field-inner input {
          width:100%; padding:.8rem 1rem;
          background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); border-radius:10px;
          color:#F0EBFF; font-family:'Outfit',sans-serif; font-size:.9rem; font-weight:300;
          outline:none; transition:border-color .18s,background .18s,box-shadow .18s; -webkit-appearance:none;
        }
        .field-inner input::placeholder{color:rgba(255,255,255,.2)}
        .field-inner input:focus{border-color:rgba(212,160,23,.65);background:rgba(255,255,255,.09);box-shadow:0 0 0 3px rgba(212,160,23,.12)}
        .field-inner input:-webkit-autofill,.field-inner input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px #180035 inset;-webkit-text-fill-color:#F0EBFF}
        .pw-eye{position:absolute;right:.875rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,.25);padding:0;display:flex;transition:color .15s;line-height:1}
        .pw-eye:hover{color:rgba(212,160,23,.85)}
        .pw-eye svg{width:16px;height:16px}

        /* Error */
        .err{display:flex;align-items:flex-start;gap:.5rem;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:.65rem .875rem;font-size:.82rem;color:#FCA5A5;margin-bottom:1rem;animation:shake .28s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}30%{transform:translateX(-4px)}70%{transform:translateX(4px)}}

        /* Button */
        .btn{width:100%;margin-top:.5rem;padding:.9rem;background:#FAFAFA;color:#0A000F;border:none;border-radius:10px;font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:600;letter-spacing:.01em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:background .15s,transform .12s,box-shadow .15s;box-shadow:0 2px 8px rgba(0,0,0,.3),0 0 20px rgba(255,255,255,.06)}
        .btn:hover:not(:disabled){background:#fff;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.4),0 0 30px rgba(255,255,255,.08)}
        .btn:active:not(:disabled){transform:translateY(0)}
        .btn:disabled{background:rgba(255,255,255,.18);color:rgba(255,255,255,.35);cursor:not-allowed;box-shadow:none}

        /* Spinner */
        .spin{width:15px;height:15px;border:2px solid rgba(0,0,0,.2);border-top-color:#0A000F;border-radius:50%;animation:spin .65s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* Footer */
        .card-foot{margin-top:1.75rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,.07);text-align:center;font-size:.7rem;color:rgba(255,255,255,.2);line-height:1.7;font-weight:300}

        /* Mobile */
        @media(max-width:767px){
          .rg-left,.rg-right,.c-left,.c-left2,.c-right,.c-right2,.persp-grid{display:none}
          .rg-center{width:420px;height:420px}
          .card{padding:2.25rem 1.5rem 1.75rem;border-radius:18px}
          .card-h{font-size:2rem}
          .center{padding:0 1rem}
          .crest-img{width:64px;height:64px}
          .crest-wrap{margin-bottom:-22px}
          .ghost{font-size:24vw}
        }
      `}</style>

      <div className="ls">
        {/* ── Orbs ── */}
        {["orb-1","orb-2","orb-3","orb-4","orb-5"].map(c => <div key={c} className={`orb ${c}`} aria-hidden="true" />)}

        {/* ── Grid de perspectiva ── */}
        <div className="persp-grid" aria-hidden="true" />

        {/* ── Anillos 3D: centro ── */}
        <div className="ring-group rg-center" aria-hidden="true">
          <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
        </div>
        {/* Anillos laterales */}
        <div className="ring-group rg-left" aria-hidden="true">
          <div className="ring r1" /><div className="ring r2" />
        </div>
        <div className="ring-group rg-right" aria-hidden="true">
          <div className="ring r1" /><div className="ring r2" />
        </div>

        {/* ── Cubos 3D wireframe ── */}
        {[
          { cls:"c-left",  s:90 },
          { cls:"c-left2", s:55 },
          { cls:"c-right", s:80 },
          { cls:"c-right2",s:50 },
        ].map(({ cls, s }) => (
          <div key={cls} className={`cube-wrap ${cls}`} aria-hidden="true" style={{ width: s, height: s }}>
            {/* front */}  <div className="cf" style={{width:s,height:s,transform:`translateZ(${s/2}px)`}} />
            {/* back */}   <div className="cf" style={{width:s,height:s,transform:`translateZ(-${s/2}px) rotateY(180deg)`}} />
            {/* left */}   <div className="cf" style={{width:s,height:s,transform:`translateX(-${s/2}px) rotateY(-90deg)`}} />
            {/* right */}  <div className="cf" style={{width:s,height:s,transform:`translateX(${s/2}px) rotateY(90deg)`}} />
            {/* top */}    <div className="cf" style={{width:s,height:s,transform:`translateY(-${s/2}px) rotateX(90deg)`}} />
            {/* bottom */} <div className="cf" style={{width:s,height:s,transform:`translateY(${s/2}px) rotateX(-90deg)`}} />
          </div>
        ))}

        {/* ── Partículas ── */}
        <div className="pts" aria-hidden="true">
          {Array.from({length:10}).map((_,i) => <div key={i} className="pt" />)}
        </div>

        {/* ── Texto fantasma ── */}
        <div className="ghost" aria-hidden="true">CONVENIOS</div>

        {/* ── Grain ── */}
        <div className="grain" aria-hidden="true" />

        {/* ── Contenido central ── */}
        <div className="center">
          <div className="crest-wrap">
            <img src="/Escudo SF.jpg" alt="Escudo FM San Fernando" className="crest-img" />
          </div>

          <div className="card" ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <p className="card-inst"><span />FM San Fernando · UNMSM<span /></p>
            <h1 className="card-h">Bienvenido</h1>
            <p className="card-sub">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="ls-email">Correo electrónico</label>
                <div className="field-inner">
                  <input id="ls-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@unmsm.edu.pe" autoComplete="email" required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ls-pw">Contraseña</label>
                <div className="field-inner">
                  <input id="ls-pw" type={pwVisible?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{paddingRight:"2.75rem"}} required />
                  <button type="button" className="pw-eye" onClick={()=>setPwVisible(v=>!v)} aria-label={pwVisible?"Ocultar":"Mostrar"} tabIndex={-1}>
                    {pwVisible
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              {error && (
                <div className="err" role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:"1px"}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r=".6" fill="currentColor"/></svg>
                  {error}
                </div>
              )}
              <button type="submit" className="btn" disabled={loading}>
                {loading
                  ? <><div className="spin"/>Verificando...</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Ingresar al sistema</>
                }
              </button>
            </form>

            <div className="card-foot">
              Sistema de Gestión de Convenios<br/>
              © {new Date().getFullYear()} Universidad Nacional Mayor de San Marcos
            </div>
          </div>
        </div>
      </div>
    </>
  );
}