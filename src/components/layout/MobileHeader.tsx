/**
 * MobileHeader.tsx
 * Ruta: src/components/layout/MobileHeader.tsx
 *
 * Acepta `onBack` para sobrescribir el comportamiento del botón volver
 * (necesario cuando la app usa navegación por estado, no por URL).
 */

type UserRole = 'admin' | 'interno' | 'consulta';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;        // si se pasa, muestra ← y lo llama al tocar
  role: UserRole;
  onChatbot?: () => void;     // botón 🤖 solo si se pasa (y rol ≠ consulta)
  isHome?: boolean;
}

const ROLE_BADGE: Record<UserRole, { label: string; bg: string; color: string }> = {
  admin:    { label: 'Admin',    bg: '#00B4D8', color: '#0B1F4B' },
  interno:  { label: 'Interno',  bg: '#F4A522', color: '#0B1F4B' },
  consulta: { label: 'Consulta', bg: '#1D6FA4', color: '#FFFFFF' },
};

const S = {
  header: {
    position: 'sticky', top: 0, zIndex: 40,
    background: '#0B1F4B',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  } as React.CSSProperties,
  inner: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', minHeight: 56,
  } as React.CSSProperties,
  iconBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, background: 'rgba(255,255,255,0.08)',
    borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
  } as React.CSSProperties,
  logoBox: {
    width: 36, height: 36, background: '#00B4D8', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontSize: 18,
  } as React.CSSProperties,
  titleArea: { flex: 1, minWidth: 0 } as React.CSSProperties,
  title: {
    fontSize: 16, fontWeight: 700, color: '#fff', margin: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as React.CSSProperties,
  subtitle: {
    fontSize: 11, color: '#8BA4C0', marginTop: 1,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } as React.CSSProperties,
  roleBadge: (role: UserRole): React.CSSProperties => ({
    background: ROLE_BADGE[role].bg, color: ROLE_BADGE[role].color,
    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
    flexShrink: 0, letterSpacing: '0.03em',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
  chatBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36,
    background: 'linear-gradient(135deg, #00B4D8, #1D6FA4)',
    borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
    WebkitTapHighlightColor: 'transparent', fontSize: 18,
  } as React.CSSProperties,
};

export function MobileHeader({
  title, subtitle, onBack, role, onChatbot, isHome = false,
}: MobileHeaderProps) {
  return (
    <header style={S.header}>
      <div style={S.inner}>
        {onBack ? (
          <button style={S.iconBtn} onClick={onBack} aria-label="Volver">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        ) : (
          <div style={S.logoBox}>🏛️</div>
        )}
        <div style={S.titleArea}>
          <h1 style={S.title}>{title}</h1>
          {subtitle
            ? <p style={S.subtitle}>{subtitle}</p>
            : isHome && <p style={S.subtitle}>FM San Fernando · UNMSM</p>
          }
        </div>
        <span style={S.roleBadge(role)}>{ROLE_BADGE[role].label}</span>
        {onChatbot && role !== 'consulta' && (
          <button style={S.chatBtn} onClick={onChatbot} aria-label="Asistente IA">🤖</button>
        )}
      </div>
    </header>
  );
}