/**
 * BottomNav.tsx
 * Ruta final en tu proyecto: src/components/layout/BottomNav.tsx
 *
 * Barra de navegación inferior para móvil.
 * ⚠️  Revisar los `path` en NAV_ITEMS y MORE_ITEMS —
 *     deben coincidir exactamente con las rutas definidas en tu App.tsx.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type UserRole = 'admin' | 'interno' | 'consulta';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: (active: boolean) => React.ReactElement;
  roles: UserRole[];
}

interface BottomNavProps {
  role: UserRole;
  alertCount?: number; // número de convenios por vencer → badge rojo
}

// ─── Íconos SVG inline (sin librería externa) ─────────────────
const Ico = {
  dashboard: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? '#00B4D8' : '#8BA4C0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  convenios: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? '#00B4D8' : '#8BA4C0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4"/>
      <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9"/>
    </svg>
  ),
  movilidades: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? '#00B4D8' : '#8BA4C0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  contraprestaciones: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? '#00B4D8' : '#8BA4C0'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
    </svg>
  ),
  more: (a: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={a ? '#00B4D8' : '#8BA4C0'} strokeWidth="2">
      <circle cx="5"  cy="12" r="1.5" fill={a ? '#00B4D8' : '#8BA4C0'} stroke="none"/>
      <circle cx="12" cy="12" r="1.5" fill={a ? '#00B4D8' : '#8BA4C0'} stroke="none"/>
      <circle cx="19" cy="12" r="1.5" fill={a ? '#00B4D8' : '#8BA4C0'} stroke="none"/>
    </svg>
  ),
};

// ─── Ítems de la barra principal ──────────────────────────────
// ⚠️  Ajustar los `path` según tus rutas en App.tsx
const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Inicio',
    path: '/',                        // ruta del dashboard
    icon: Ico.dashboard,
    roles: ['admin', 'interno', 'consulta'],
  },
  {
    id: 'convenios',
    label: 'Convenios',
    path: '/agreements',              // ← ajustar si tu ruta es diferente
    icon: Ico.convenios,
    roles: ['admin', 'interno', 'consulta'],
  },
  {
    id: 'movilidades',
    label: 'Movilidades',
    path: '/movilidades',
    icon: Ico.movilidades,
    roles: ['admin', 'interno', 'consulta'],
  },
  {
    id: 'contraprestaciones',
    label: 'Contrapr.',
    path: '/contraprestaciones',
    icon: Ico.contraprestaciones,
    roles: ['admin', 'interno', 'consulta'],
  },
];

// ─── Ítems del drawer "Más" ───────────────────────────────────
const MORE_ITEMS = [
  { id: 'instituciones', label: 'Instituciones', path: '/instituciones', emoji: '🏛️', roles: ['admin','interno','consulta'] as UserRole[] },
  { id: 'reportes',      label: 'Reportes',      path: '/reportes',      emoji: '📊', roles: ['admin','interno']            as UserRole[] },
  { id: 'usuarios',      label: 'Usuarios',      path: '/usuarios',      emoji: '👥', roles: ['admin']                      as UserRole[] },
];

// ─── Estilos ──────────────────────────────────────────────────
const S = {
  nav: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
    background: '#0B1F4B',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
  } as React.CSSProperties,

  navItem: (active: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '10px 4px 8px', gap: 3,
    cursor: 'pointer', position: 'relative',
    minHeight: 60, border: 'none', background: 'none', outline: 'none',
    opacity: active ? 1 : 0.65,
    WebkitTapHighlightColor: 'transparent',
    transition: 'opacity 0.15s',
  }),

  indicator: {
    position: 'absolute', top: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: 32, height: 3,
    background: '#00B4D8',
    borderRadius: '0 0 3px 3px',
  } as React.CSSProperties,

  label: (active: boolean): React.CSSProperties => ({
    fontSize: 10, fontWeight: active ? 700 : 400,
    color: active ? '#00B4D8' : '#8BA4C0',
    letterSpacing: '0.01em', lineHeight: 1,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),

  badge: {
    position: 'absolute', top: 8, right: 'calc(50% - 18px)',
    background: '#EF4444', color: '#fff',
    fontSize: 9, fontWeight: 700,
    borderRadius: 10, minWidth: 16, height: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px', border: '1.5px solid #0B1F4B',
  } as React.CSSProperties,

  overlay: {
    position: 'fixed', inset: 0, zIndex: 49,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(2px)',
  } as React.CSSProperties,

  drawer: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
    background: '#1A3773',
    borderRadius: '20px 20px 0 0',
    padding: '12px 0 calc(80px + env(safe-area-inset-bottom, 0px))',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
  } as React.CSSProperties,

  drawerHandle: {
    width: 36, height: 4,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    margin: '0 auto 20px',
  } as React.CSSProperties,

  drawerBtn: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 24px',
    cursor: 'pointer', border: 'none', background: 'none',
    width: '100%', textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  } as React.CSSProperties,
};

// ─── Componente ───────────────────────────────────────────────
export function BottomNav({ role, alertCount = 0 }: BottomNavProps) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const visibleItems     = NAV_ITEMS.filter(i => i.roles.includes(role));
  const visibleMoreItems = MORE_ITEMS.filter(i => i.roles.includes(role));

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const go = (path: string) => { navigate(path); setShowMore(false); };

  return (
    <>
      {/* Overlay del drawer */}
      {showMore && <div style={S.overlay} onClick={() => setShowMore(false)} />}

      {/* Drawer "Más" */}
      {showMore && (
        <div style={S.drawer}>
          <div style={S.drawerHandle} />
          {visibleMoreItems.map(item => (
            <button key={item.id} style={S.drawerBtn} onClick={() => go(item.path)}>
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{item.emoji}</span>
              <span style={{ fontSize: 15, color: '#fff', fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Barra inferior */}
      <nav style={S.nav} role="navigation" aria-label="Navegación principal">
        {visibleItems.map(item => {
          const active     = isActive(item.path);
          const showBadge  = item.id === 'convenios' && alertCount > 0;
          return (
            <button key={item.id} style={S.navItem(active)}
              onClick={() => go(item.path)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}>
              {active && <div style={S.indicator} />}
              <div style={{ position: 'relative' }}>
                {item.icon(active)}
                {showBadge && (
                  <span style={S.badge}>{alertCount > 9 ? '9+' : alertCount}</span>
                )}
              </div>
              <span style={S.label(active)}>{item.label}</span>
            </button>
          );
        })}

        {visibleMoreItems.length > 0 && (
          <button style={S.navItem(showMore)}
            onClick={() => setShowMore(v => !v)}
            aria-label="Más opciones"
            aria-expanded={showMore}>
            {Ico.more(showMore)}
            <span style={S.label(showMore)}>Más</span>
          </button>
        )}
      </nav>
    </>
  );
}