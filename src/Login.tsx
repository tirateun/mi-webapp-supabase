// src/Login.tsx — v6: Dense Medical · Vivid Purple
import { useState, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

/* ── DNA Helix (SVG generado) ──────────────────────────── */
function DNA({ h = 260, flip = false, alpha = 0.9 }: { h?: number; flip?: boolean; alpha?: number }) {
  const W = 48; const segs = 7; const segH = h / segs;
  const s1: string[] = [], s2: string[] = [], rungs: React.ReactNode[] = [];
  for (let i = 0; i <= segs * 8; i++) {
    const t = i / (segs * 8); const y = t * h;
    const ph = t * Math.PI * 2 * segs;
    const x1 = W / 2 + (W / 2 - 3) * Math.sin(ph);
    const x2 = W / 2 - (W / 2 - 3) * Math.sin(ph);
    s1.push(i === 0 ? `M${x1},${y}` : `L${x1},${y}`);
    s2.push(i === 0 ? `M${x2},${y}` : `L${x2},${y}`);
    if (i % 4 === 0) rungs.push(
      <line key={i} x1={x1} y1={y} x2={x2} y2={y}
        stroke={`rgba(255,255,255,${0.1 * alpha})`} strokeWidth="1.2"/>
    );
  }
  return (
    <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <path d={s1.join("")} stroke={`rgba(160,100,255,${0.5 * alpha})`} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d={s2.join("")} stroke={`rgba(212,160,23,${0.45 * alpha})`} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {rungs}
    </svg>
  );
}

/* ── Átomo / Molécula ──────────────────────────────────── */
function Atom({ size = 70, alpha = 1 }: { size?: number; alpha?: number }) {
  const c = size / 2; const r = size / 2 - 4;
  const col = `rgba(200,150,255,${0.22 * alpha})`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <ellipse cx={c} cy={c} rx={r} ry={r * 0.35} stroke={col} strokeWidth="1.2" fill="none"/>
      <ellipse cx={c} cy={c} rx={r} ry={r * 0.35} stroke={col} strokeWidth="1.2" fill="none" transform={`rotate(60 ${c} ${c})`}/>
      <ellipse cx={c} cy={c} rx={r} ry={r * 0.35} stroke={col} strokeWidth="1.2" fill="none" transform={`rotate(120 ${c} ${c})`}/>
      <circle cx={c} cy={c} r="4" fill={`rgba(212,160,23,${0.35 * alpha})`}/>
    </svg>
  );
}

/* ── Cruz médica ───────────────────────────────────────── */
function Cross({ size = 36, alpha = 0.2 }: { size?: number; alpha?: number }) {
  const t = size / 3;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={t} y={0} width={t} height={size} rx="2.5" fill={`rgba(212,160,23,${alpha})`}/>
      <rect x={0} y={t} width={size} height={t} rx="2.5" fill={`rgba(212,160,23,${alpha})`}/>
    </svg>
  );
}

/* ── Cápsula / Pastilla ────────────────────────────────── */
function Pill({ w = 40, h = 16, rot = 0, alpha = 0.18 }: { w?: number; h?: number; rot?: number; alpha?: number }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ transform: `rotate(${rot}deg)` }}>
      <rect x="0" y="0" width={w} height={h} rx={h / 2}
        fill="none" stroke={`rgba(212,160,23,${alpha})`} strokeWidth="1.2"/>
      <line x1={w/2} y1="2" x2={w/2} y2={h-2} stroke={`rgba(212,160,23,${alpha * 0.8})`} strokeWidth="1"/>
    </svg>
  );
}

/* ── ECG / Pulso cardíaco ──────────────────────────────── */
function ECG({ bottom, opacity, delay = 0, flip = false }:
  { bottom: string; opacity: number; delay?: number; flip?: boolean }) {
  const d = `M-50,0 L30,0 L40,-12 L50,0 L56,0 L60,-62 L65,78 L70,0 L90,0 L115,-22 L140,0 L190,0
    L230,0 L240,-12 L250,0 L256,0 L260,-62 L265,78 L270,0 L290,0 L315,-22 L340,0 L390,0
    L430,0 L440,-12 L450,0 L456,0 L460,-62 L465,78 L470,0 L490,0 L515,-22 L540,0 L640,0`;
  return (
    <svg style={{ position:"absolute", bottom, left:0, width:"100%", height:"140px",
      pointerEvents:"none", transform: flip ? "scaleY(-1)" : undefined, opacity }}
      viewBox="0 0 640 120" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0,70)">
        <line x1="-50" y1="0" x2="700" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        <path d={d} fill="none" stroke="rgba(212,160,23,0.7)" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="230 410"
          style={{ animation:`ecg-s 5s linear infinite`, animationDelay:`${delay}s` }}/>
        <path d={d} fill="none" stroke="rgba(160,100,255,0.4)" strokeWidth="1"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="130 510"
          style={{ animation:`ecg-s 5s linear infinite`, animationDelay:`${delay - 2}s` }}/>
      </g>
    </svg>
  );
}

/* ── Nodo molecular (círculo + líneas) ─────────────────── */
function MolNode({ size = 8, alpha = 0.35 }: { size?: number; alpha?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={size/2 - 1}
        stroke={`rgba(212,160,23,${alpha})`} strokeWidth="1.2" fill={`rgba(212,160,23,${alpha*0.3})`}/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════ */
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
    const { data, error: aErr } = await supabase.auth.signInWithPassword({ email, password });
    if (aErr) { setLoading(false); setError("Credenciales incorrectas o usuario no registrado."); return; }
    if (data?.user) {
      const { data: prof, error: pErr } = await supabase.from("profiles").select("must_change_password").eq("user_id", data.user.id).single();
      setLoading(false);
      if (pErr || !prof) { setError("Error al cargar el perfil."); return; }
      prof.must_change_password ? onRequirePasswordChange(data.user) : onLogin(data.user);
    }
  };

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const c = cardRef.current; if (!c) return;
      const r = c.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 11;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 11;
      c.style.transform = `perspective(1400px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(20px)`;
    });
  }, []);
  const onLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (cardRef.current) cardRef.current.style.transform = "perspective(1400px) rotateY(0) rotateX(0) translateZ(0)";
  }, []);

  /* ── Datos de decoraciones — SOLO LADO DERECHO ── */
  // La fachada ocupa el lado izquierdo; los adornos van solo a la derecha y centro
  const dnaItems = [
    { s: { right:"1%",  top:"4%"  }, h:200, flip:true,  delay:-1  },
    { s: { right:"9%",  top:"18%" }, h:250, flip:false, delay:-3  },
    { s: { right:"1%",  top:"38%" }, h:230, flip:true,  delay:-5  },
    { s: { right:"10%", top:"56%" }, h:200, flip:false, delay:-7  },
    { s: { right:"2%",  top:"73%" }, h:190, flip:true,  delay:-9  },
    { s: { right:"11%", top:"85%" }, h:160, flip:false, delay:-11 },
  ];

  const crossItems = [
    { s:{ right:"3%",  top:"6%"  }, size:44, alpha:0.22, delay:-0.5 },
    { s:{ right:"15%", top:"14%" }, size:30, alpha:0.18, delay:-1.5 },
    { s:{ right:"5%",  top:"26%" }, size:36, alpha:0.20, delay:-2.5 },
    { s:{ right:"18%", top:"38%" }, size:22, alpha:0.15, delay:-3.5 },
    { s:{ right:"7%",  top:"50%" }, size:32, alpha:0.18, delay:-4.5 },
    { s:{ right:"17%", top:"62%" }, size:24, alpha:0.14, delay:-5.5 },
    { s:{ right:"4%",  top:"70%" }, size:38, alpha:0.21, delay:-6.5 },
    { s:{ right:"14%", top:"80%" }, size:26, alpha:0.16, delay:-7.5 },
    { s:{ right:"6%",  top:"88%" }, size:30, alpha:0.17, delay:-8.5 },
    { s:{ right:"19%", top:"93%" }, size:18, alpha:0.13, delay:-9.5 },
    { s:{ right:"12%", top:"4%"  }, size:20, alpha:0.12, delay:-10.5 },
    { s:{ right:"21%", top:"48%" }, size:24, alpha:0.15, delay:-11.5 },
  ];

  const atomItems = [
    { s:{ right:"5%",  top:"10%" }, size:80, alpha:1,   delay:-4  },
    { s:{ right:"17%", top:"30%" }, size:55, alpha:0.8, delay:-12 },
    { s:{ right:"5%",  top:"55%" }, size:68, alpha:0.9, delay:-20 },
    { s:{ right:"17%", top:"72%" }, size:52, alpha:0.7, delay:-28 },
    { s:{ right:"7%",  top:"88%" }, size:60, alpha:0.85,delay:-36 },
  ];

  const pillItems = [
    { s:{ right:"14%",top:"8%"  }, w:42, h:16, rot:-35, alpha:0.18 },
    { s:{ right:"4%", top:"22%" }, w:46, h:17, rot:25,  alpha:0.15 },
    { s:{ right:"19%",top:"44%" }, w:36, h:14, rot:-50, alpha:0.16 },
    { s:{ right:"9%", top:"62%" }, w:44, h:16, rot:40,  alpha:0.14 },
    { s:{ right:"20%",top:"80%" }, w:38, h:15, rot:-20, alpha:0.17 },
    { s:{ right:"4%", top:"93%" }, w:34, h:13, rot:55,  alpha:0.13 },
  ];

  const nodeItems = [
    ...Array.from({length:18}, (_,i) => ({
      s:{ right:`${[3,8,14,19,5,11,17,22,4,9,15,20,6,12,18,23,7,13][i]}%`,
          top:`${(i * 5.5 + 3) % 97}%` },
      size: [7,9,6,10,8,7,11,6,9,8,7,10,6,9,8,7,10,6][i]
    })),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Outfit:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .ls{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
          background:#1C0040;font-family:'Outfit',system-ui,sans-serif;overflow:hidden;z-index:9999}

        /* ── Fachada de la Facultad ─────────────────────────── */
        .building {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 45%;
          background: url('/facultad.png') center/cover no-repeat;
          z-index: 1;
        }
        /* Overlay morado más sutil para que la imagen se vea bien */
        .building::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(
            105deg,
            rgba(28,0,64,0.30) 0%,
            rgba(28,0,64,0.45) 50%,
            rgba(28,0,64,0.90) 82%,
            rgba(28,0,64,1.00) 100%
          );
        }
        /* Viñeta oscura solo en bordes superior e inferior */
        .building::after {
          content: '';
          position: absolute; inset: 0;
          background:
            linear-gradient(to bottom, rgba(28,0,64,0.55) 0%, transparent 15%, transparent 80%, rgba(28,0,64,0.65) 100%);
          pointer-events: none;
        }

        /* Leyenda institucional sobre la fachada */
        .building-caption {
          position: absolute;
          bottom: 2.5rem; left: 2rem;
          z-index: 2;
          pointer-events: none;
        }
        .building-caption .bc-year {
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(212,160,23,0.6);
          margin-bottom: 0.4rem;
          display: block;
        }
        .building-caption .bc-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.1rem; font-weight: 600;
          color: rgba(255,255,255,0.55);
          line-height: 1.3; display: block;
        }
        .building-caption .bc-rule {
          display: block; width: 32px; height: 1.5px;
          background: rgba(212,160,23,0.45);
          margin-top: 0.6rem; border-radius: 1px;
        }

        /* ── Orbs más vívidos ── */
        .orb{position:absolute;border-radius:50%;pointer-events:none;will-change:transform;z-index:2}
        .orb-1{width:900px;height:900px;top:-250px;right:-200px;
          background:radial-gradient(circle at 40% 40%,rgba(140,60,255,0.65),rgba(100,30,220,0.2) 50%,transparent 70%);
          filter:blur(55px);animation:d1 14s ease-in-out infinite}
        .orb-2{width:750px;height:750px;bottom:-200px;left:-170px;
          background:radial-gradient(circle at 60% 60%,rgba(90,60,220,0.6),rgba(50,30,180,0.2) 50%,transparent 70%);
          filter:blur(50px);animation:d2 19s ease-in-out infinite}
        .orb-3{width:500px;height:500px;top:30%;left:30%;
          background:radial-gradient(circle,rgba(180,100,255,0.25),transparent 60%);
          filter:blur(45px);animation:d3 23s ease-in-out infinite}
        .orb-4{width:400px;height:400px;top:10%;left:-100px;
          background:radial-gradient(circle,rgba(130,80,255,0.35),transparent 65%);
          filter:blur(50px);animation:d2 26s ease-in-out infinite reverse}
        .orb-5{width:400px;height:400px;bottom:5%;right:-100px;
          background:radial-gradient(circle,rgba(110,70,240,0.3),transparent 65%);
          filter:blur(48px);animation:d1 21s ease-in-out infinite reverse}
        @keyframes d1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-35px,25px) scale(1.07)}}
        @keyframes d2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(28px,-32px) scale(1.05)}}
        @keyframes d3{0%,100%{transform:translate(0,0)}33%{transform:translate(16px,-14px)}66%{transform:translate(-14px,16px)}}

        @keyframes ecg-s{from{stroke-dashoffset:700}to{stroke-dashoffset:-700}}

        /* ── Decoraciones posicionadas ── */
        .abs{position:absolute;pointer-events:none;z-index:3}
        
        /* DNA */
        .dna-el{animation:dna-f 8s ease-in-out infinite}
        @keyframes dna-f{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        
        /* Crosses */
        .cross-el{animation:mc-f 9s ease-in-out infinite}
        @keyframes mc-f{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-10px) rotate(7deg)}}
        
        /* Atoms */
        .atom-el{animation:at-spin linear infinite}
        @keyframes at-spin{to{transform:rotate(360deg)}}
        
        /* Pills */
        .pill-el{animation:pill-f 11s ease-in-out infinite}
        @keyframes pill-f{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}

        /* Nodes */
        .node-el{animation:nd-pulse 4s ease-in-out infinite}
        @keyframes nd-pulse{0%,100%{opacity:.35}50%{opacity:.7}}

        /* ── Textos fantasma ── */
        .ghost{position:absolute;font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;
          letter-spacing:-.04em;line-height:1;white-space:nowrap;color:transparent;
          -webkit-text-stroke:1px rgba(255,255,255,0.06);pointer-events:none;user-select:none}
        .ghost-bot{bottom:-2%;left:50%;transform:translateX(-50%);font-size:clamp(80px,14vw,200px)}
        .ghost-top{top:-1%;left:50%;transform:translateX(-50%);font-size:clamp(50px,9vw,140px);opacity:.8}

        /* ── Grain ── */
        .grain{position:fixed;inset:-100px;pointer-events:none;z-index:5;opacity:.04;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:128px;animation:gr .5s steps(1) infinite}
        @keyframes gr{0%{transform:translate(0,0)}25%{transform:translate(-2%,1%)}50%{transform:translate(1%,-2%)}75%{transform:translate(-1%,2%)}100%{transform:translate(2%,-1%)}}

        /* ── Centro ── */
        .center{position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;width:100%;max-width:420px;padding:0 1.25rem}

        /* Escudo flotante */
        .crest-wrap{position:relative;z-index:2;margin-bottom:-28px;animation:cf 6s ease-in-out infinite}
        @keyframes cf{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        .crest-img{width:76px;height:76px;border-radius:50%;object-fit:cover;
          border:1.5px solid rgba(212,160,23,0.6);
          box-shadow:0 0 0 6px rgba(212,160,23,0.08),0 0 0 14px rgba(212,160,23,0.04),
            0 18px 40px rgba(0,0,0,0.7),0 0 40px rgba(150,80,255,0.45)}

        /* Card glass */
        .card{width:100%;background:rgba(255,255,255,0.05);
          backdrop-filter:blur(32px) saturate(170%);-webkit-backdrop-filter:blur(32px) saturate(170%);
          border:1px solid rgba(255,255,255,0.11);border-top:1px solid rgba(255,255,255,0.18);
          border-radius:22px;padding:3rem 2.5rem 2rem;
          box-shadow:0 1px 0 rgba(255,255,255,0.09) inset,0 40px 80px rgba(0,0,0,0.6),
            0 0 100px rgba(140,60,255,0.15);
          transition:transform .12s ease-out;will-change:transform}

        .card-inst{text-align:center;font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,0.32);margin-bottom:1.75rem}
        .card-inst span{display:inline-block;width:22px;height:1px;background:rgba(212,160,23,0.5);vertical-align:middle;margin:0 .6rem}
        .card-h{font-family:'Cormorant Garamond',Georgia,serif;font-size:2.6rem;font-weight:600;color:#F0EBFF;letter-spacing:-.02em;line-height:1.1;text-align:center;margin-bottom:.4rem}
        .card-sub{text-align:center;font-size:.82rem;color:rgba(255,255,255,.3);margin-bottom:2rem;font-weight:300}

        .field{margin-bottom:1.1rem}
        .field label{display:block;font-size:.68rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:.45rem}
        .fi{position:relative}
        .fi input{width:100%;padding:.8rem 1rem;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:10px;color:#F0EBFF;font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:300;outline:none;transition:border-color .18s,background .18s,box-shadow .18s;-webkit-appearance:none}
        .fi input::placeholder{color:rgba(255,255,255,.2)}
        .fi input:focus{border-color:rgba(212,160,23,.65);background:rgba(255,255,255,.09);box-shadow:0 0 0 3px rgba(212,160,23,.12)}
        .fi input:-webkit-autofill,.fi input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 100px #200048 inset;-webkit-text-fill-color:#F0EBFF}
        .pw-eye{position:absolute;right:.875rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,.25);padding:0;display:flex;transition:color .15s;line-height:1}
        .pw-eye:hover{color:rgba(212,160,23,.9)}
        .pw-eye svg{width:16px;height:16px}

        .err{display:flex;align-items:flex-start;gap:.5rem;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:.65rem .875rem;font-size:.82rem;color:#FCA5A5;margin-bottom:1rem;animation:shake .28s ease}
        @keyframes shake{0%,100%{transform:translateX(0)}30%{transform:translateX(-4px)}70%{transform:translateX(4px)}}

        .btn{width:100%;margin-top:.5rem;padding:.9rem;background:#FAFAFA;color:#0A000F;border:none;border-radius:10px;font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;transition:background .15s,transform .12s,box-shadow .15s;box-shadow:0 2px 8px rgba(0,0,0,.3)}
        .btn:hover:not(:disabled){background:#fff;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.4)}
        .btn:active:not(:disabled){transform:translateY(0)}
        .btn:disabled{background:rgba(255,255,255,.18);color:rgba(255,255,255,.35);cursor:not-allowed;box-shadow:none}
        .spin{width:15px;height:15px;border:2px solid rgba(0,0,0,.2);border-top-color:#0A000F;border-radius:50%;animation:spin .65s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .card-foot{margin-top:1.75rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,.08);text-align:center;font-size:.7rem;color:rgba(255,255,255,.2);line-height:1.7;font-weight:300}

        /* ── Partículas ── */
        .pts{position:absolute;inset:0;pointer-events:none;overflow:hidden}
        .pt{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(212,160,23,0.7);animation:pt-r linear infinite;bottom:-5%}
        @keyframes pt-r{0%{transform:translateY(0) scale(1);opacity:0}10%{opacity:1}90%{opacity:.3}100%{transform:translateY(-105vh) scale(.4);opacity:0}}

        @media(max-width:900px){.dna-el:nth-child(n+7){display:none}.atom-el:nth-child(n+6){display:none}.building-caption{display:none}}
        @media(max-width:767px){
          .building{width:100%;opacity:.25}
          .ghost-top{display:none}.card{padding:2.25rem 1.5rem 1.75rem;border-radius:18px}
          .card-h{font-size:2rem}.center{padding:0 1rem}
          .crest-img{width:64px;height:64px}.crest-wrap{margin-bottom:-22px}
          .ghost-bot{font-size:22vw}
          .dna-el,.atom-el,.pill-el,.node-el{display:none}
        }
      `}</style>

      <div className="ls">
        {/* ── Fachada de la Facultad (panel izquierdo) ── */}
        <div className="building" aria-hidden="true" />
        <div className="building-caption" aria-hidden="true">
          <span className="bc-year">Est. 1811 · Lima, Perú</span>
          <span className="bc-name">Facultad de Medicina<br/>San Fernando</span>
          <span className="bc-rule" />
        </div>

        {/* Orbs */}
        {["orb-1","orb-2","orb-3","orb-4","orb-5"].map(c=><div key={c} className={`orb ${c}`} aria-hidden="true"/>)}

        {/* ECG lines — arrancan desde el centro hacia la derecha */}
        <ECG bottom="18%" opacity={0.35} delay={0}/>
        <ECG bottom="42%" opacity={0.16} delay={-2}/>
        <ECG bottom="65%" opacity={0.09} delay={-4} flip/>

        {/* DNA helices — 12 instancias */}
        {dnaItems.map((d, i) => (
          <div key={`dna-${i}`} className="abs dna-el" style={{ ...d.s, animationDelay:`${d.delay}s` }}>
            <DNA h={d.h} flip={d.flip} alpha={0.85 - i * 0.015}/>
          </div>
        ))}

        {/* Átomos — 10 instancias */}
        {atomItems.map((a, i) => (
          <div key={`atom-${i}`} className="abs atom-el"
            style={{ ...a.s, animationDuration:`${40 + i * 5}s`, animationDelay:`${a.delay}s` }}>
            <Atom size={a.size} alpha={a.alpha}/>
          </div>
        ))}

        {/* Cruces médicas — 24 instancias */}
        {crossItems.map((c, i) => (
          <div key={`cross-${i}`} className="abs cross-el"
            style={{ ...c.s, animationDelay:`${c.delay}s`, animationDuration:`${8 + (i%5)}s` }}>
            <Cross size={c.size} alpha={c.alpha}/>
          </div>
        ))}

        {/* Cápsulas — 12 instancias */}
        {pillItems.map((p, i) => (
          <div key={`pill-${i}`} className="abs pill-el"
            style={{ ...p.s, animationDelay:`${-i * 1.2}s`, animationDuration:`${10 + (i%4)}s` }}>
            <Pill w={p.w} h={p.h} rot={p.rot} alpha={p.alpha}/>
          </div>
        ))}

        {/* Nodos moleculares — 32 instancias */}
        {nodeItems.map((n, i) => (
          <div key={`node-${i}`} className="abs node-el"
            style={{ ...n.s, animationDelay:`${-i * 0.25}s`, animationDuration:`${3 + (i%4)}s` }}>
            <MolNode size={n.size} alpha={0.3 + (i%3) * 0.08}/>
          </div>
        ))}

        {/* Partículas flotantes — 30 */}
        <div className="pts" aria-hidden="true">
          {Array.from({length:30}).map((_,i)=>(
            <div key={i} className="pt" style={{
              left:`${[3,8,13,18,23,28,33,38,43,48,53,58,63,68,73,78,83,88,93,96,5,10,15,20,25,75,80,85,90,95][i]}%`,
              animationDuration:`${10 + (i%10) * 1.5}s`,
              animationDelay:`${-(i * 0.7)}s`,
              opacity: 0.5 + (i%3) * 0.2,
              width: i%5===0 ? "3px" : "2px", height: i%5===0 ? "3px" : "2px"
            }}/>
          ))}
        </div>

        {/* Textos fantasma */}
        <div className="ghost ghost-top" aria-hidden="true">CONVENIOS</div>
        <div className="ghost ghost-bot" aria-hidden="true">MEDICINA</div>

        {/* Grain */}
        <div className="grain" aria-hidden="true"/>

        {/* Contenido central */}
        <div className="center">
          <div className="crest-wrap">
            <img src="/Escudo SF.jpg" alt="Escudo FM San Fernando" className="crest-img"/>
          </div>

          <div className="card" ref={cardRef} onMouseMove={onMove} onMouseLeave={onLeave}>
            <p className="card-inst"><span/>FM San Fernando · UNMSM<span/></p>
            <h1 className="card-h">Bienvenido</h1>
            <p className="card-sub">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="ls-em">Correo electrónico</label>
                <div className="fi">
                  <input id="ls-em" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="usuario@unmsm.edu.pe" autoComplete="email" required/>
                </div>
              </div>
              <div className="field">
                <label htmlFor="ls-pw">Contraseña</label>
                <div className="fi">
                  <input id="ls-pw" type={pwVisible?"text":"password"} value={password}
                    onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                    autoComplete="current-password" style={{paddingRight:"2.75rem"}} required/>
                  <button type="button" className="pw-eye" onClick={()=>setPwVisible(v=>!v)}
                    aria-label={pwVisible?"Ocultar":"Mostrar"} tabIndex={-1}>
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