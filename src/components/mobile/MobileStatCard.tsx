/**
 * MobileStatCard.tsx
 * Tarjeta de estadística para el dashboard móvil.
 * Muestra un número grande con ícono y label.
 *
 * Ejemplo:
 *   <MobileDashboard
 *     stats={[
 *       { label: 'Vigentes',    value: 18, icon: '✅', color: 'green' },
 *       { label: 'Por vencer', value: 5,  icon: '⏰', color: 'orange' },
 *       { label: 'Vencidos',   value: 3,  icon: '❌', color: 'red' },
 *       { label: 'Movilidades',value: 24, icon: '✈️', color: 'blue' },
 *     ]}
 *   />
 */

type StatColor = 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'gold';

interface Stat {
  label: string;
  value: number | string;
  icon: string;
  color: StatColor;
  onPress?: () => void;
}

interface MobileDashboardProps {
  stats: Stat[];
  title?: string;
}

const STAT_COLORS: Record<StatColor, { border: string; value: string; bg: string }> = {
  green:  { border: '#22C55E', value: '#166534', bg: '#F0FDF4' },
  orange: { border: '#F97316', value: '#9A3412', bg: '#FFF7ED' },
  red:    { border: '#EF4444', value: '#991B1B', bg: '#FFF1F2' },
  blue:   { border: '#3B82F6', value: '#1E40AF', bg: '#EFF6FF' },
  gray:   { border: '#94A3B8', value: '#475569', bg: '#F8FAFC' },
  gold:   { border: '#F4A522', value: '#92400E', bg: '#FFFBEB' },
};

const S = {
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#8BA4C0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding: '0 16px',
    marginBottom: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    padding: '0 16px',
  },
  card: (color: StatColor, pressable: boolean): React.CSSProperties => ({
    background: STAT_COLORS[color].bg,
    border: `1.5px solid ${STAT_COLORS[color].border}22`,
    borderLeft: `4px solid ${STAT_COLORS[color].border}`,
    borderRadius: '14px',
    padding: '14px',
    cursor: pressable ? 'pointer' : 'default',
    WebkitTapHighlightColor: 'transparent',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  }),
  icon: {
    fontSize: '22px',
    marginBottom: '6px',
    display: 'block',
    lineHeight: 1,
  },
  value: (color: StatColor): React.CSSProperties => ({
    fontSize: '28px',
    fontWeight: 800,
    color: STAT_COLORS[color].value,
    display: 'block',
    lineHeight: 1,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    marginBottom: '4px',
  }),
  label: {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 500,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    lineHeight: 1.2,
  },
};

export function MobileDashboard({ stats, title = 'Resumen' }: MobileDashboardProps) {
  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>{title}</p>
      <div style={S.grid}>
        {stats.map((stat, i) => (
          <div
            key={i}
            style={S.card(stat.color, !!stat.onPress)}
            onClick={stat.onPress}
            role={stat.onPress ? 'button' : undefined}
            tabIndex={stat.onPress ? 0 : undefined}
          >
            <span style={S.icon}>{stat.icon}</span>
            <span style={S.value(stat.color)}>{stat.value}</span>
            <span style={S.label}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MobileListHeader — cabecera de sección con botón de acción opcional
 *
 * Ejemplo:
 *   <MobileListHeader
 *     title="Convenios"
 *     count={23}
 *     action={{ label: 'Nuevo', onClick: () => setOpen(true) }}
 *   />
 */
interface ListHeaderProps {
  title: string;
  count?: number;
  action?: { label: string; onClick: () => void };
}

export function MobileListHeader({ title, count, action }: ListHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 16px 8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '16px', fontWeight: 700, color: '#0B1F4B',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>{title}</span>
        {count !== undefined && (
          <span style={{
            background: '#E2EAF4', color: '#1A3773',
            fontSize: '11px', fontWeight: 700,
            padding: '2px 7px', borderRadius: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}>{count}</span>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: '#0B1F4B', color: '#00B4D8',
            border: 'none', borderRadius: '10px',
            padding: '7px 14px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          + {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * MobileSearchBar — barra de búsqueda para filtrar listas
 */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MobileSearchBar({ value, onChange, placeholder = 'Buscar...' }: SearchBarProps) {
  return (
    <div style={{ padding: '4px 16px 12px', position: 'relative' as const }}>
      <span style={{
        position: 'absolute', left: '28px', top: '50%',
        transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' as const,
      }}>🔍</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 14px 10px 40px',
          borderRadius: '12px',
          border: '1.5px solid #D6E4F2',
          background: '#fff',
          fontSize: '14px',
          color: '#0B1F4B',
          outline: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          boxSizing: 'border-box' as const,
          WebkitAppearance: 'none',
        }}
      />
    </div>
  );
}