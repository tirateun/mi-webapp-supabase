/**
 * MobileCard.tsx
 * Tarjeta de ítem para listas en móvil (reemplaza filas de tabla en pantallas pequeñas).
 *
 * Ejemplo para lista de convenios:
 *
 *   <MobileCard
 *     title="Convenio con Universidad Continental"
 *     badge={{ label: 'Vigente', color: 'green' }}
 *     fields={[
 *       { label: 'Tipo', value: 'Universidad' },
 *       { label: 'Vence', value: '15 dic 2025' },
 *       { label: 'Responsable', value: 'Dr. García' },
 *     ]}
 *     onPress={() => navigate(`/convenios/${id}`)}
 *     actions={[
 *       { label: 'Editar', icon: '✏️', onClick: handleEdit },
 *       { label: 'Eliminar', icon: '🗑️', onClick: handleDelete, danger: true },
 *     ]}
 *   />
 */

type BadgeColor = 'green' | 'orange' | 'red' | 'gray' | 'blue' | 'gold';

interface CardField {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}

interface CardAction {
  label: string;
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}

interface MobileCardProps {
  title: string;
  badge?: { label: string; color: BadgeColor };
  fields?: CardField[];
  onPress?: () => void;
  actions?: CardAction[];
  /** Texto secundario debajo del título */
  subtitle?: string;
}

const BADGE_COLORS: Record<BadgeColor, { bg: string; color: string }> = {
  green:  { bg: '#DCFCE7', color: '#166534' },
  orange: { bg: '#FEF3C7', color: '#92400E' },
  red:    { bg: '#FEE2E2', color: '#991B1B' },
  gray:   { bg: '#F1F5F9', color: '#475569' },
  blue:   { bg: '#DBEAFE', color: '#1D4ED8' },
  gold:   { bg: '#FEF9C3', color: '#854D0E' },
};

const S = {
  card: (pressable: boolean): React.CSSProperties => ({
    background: '#fff',
    borderRadius: '14px',
    padding: '14px 16px',
    marginBottom: '10px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    border: '1px solid #E2EAF4',
    cursor: pressable ? 'pointer' : 'default',
    WebkitTapHighlightColor: 'transparent',
    transition: 'box-shadow 0.15s',
    overflow: 'hidden',
    position: 'relative' as const,
  }),
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0B1F4B',
    flex: 1,
    lineHeight: 1.3,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  subtitle: {
    fontSize: '12px',
    color: '#8BA4C0',
    marginBottom: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  badge: (color: BadgeColor): React.CSSProperties => ({
    ...BADGE_COLORS[color],
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '20px',
    flexShrink: 0,
    whiteSpace: 'nowrap' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    letterSpacing: '0.02em',
  }),
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 12px',
    marginTop: '4px',
  },
  field: (fullWidth?: boolean): React.CSSProperties => ({
    gridColumn: fullWidth ? '1 / -1' : undefined,
  }),
  fieldLabel: {
    fontSize: '10px',
    color: '#8BA4C0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    fontWeight: 600,
    marginBottom: '1px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  fieldValue: {
    fontSize: '13px',
    color: '#1A3773',
    fontWeight: 500,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  divider: {
    height: '1px',
    background: '#F0F6FC',
    margin: '12px -16px',
  },
  actionsRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  actionBtn: (danger?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${danger ? '#FCA5A5' : '#D6E4F2'}`,
    background: danger ? '#FEF2F2' : '#F0F6FC',
    color: danger ? '#DC2626' : '#1A3773',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
  chevron: {
    position: 'absolute' as const,
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#D6E4F2',
    fontSize: '18px',
    pointerEvents: 'none' as const,
  },
};

export function MobileCard({
  title,
  badge,
  fields = [],
  onPress,
  actions = [],
  subtitle,
}: MobileCardProps) {
  return (
    <div
      style={S.card(!!onPress)}
      onClick={onPress}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
    >
      <div style={S.topRow}>
        <span style={S.title}>{title}</span>
        {badge && (
          <span style={S.badge(badge.color)}>{badge.label}</span>
        )}
      </div>

      {subtitle && <p style={S.subtitle}>{subtitle}</p>}

      {fields.length > 0 && (
        <div style={S.fieldsGrid}>
          {fields.map((f, i) => (
            <div key={i} style={S.field(f.fullWidth)}>
              <div style={S.fieldLabel}>{f.label}</div>
              <div style={S.fieldValue}>{f.value || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <>
          <div style={S.divider} />
          <div style={S.actionsRow}>
            {actions.map((a, i) => (
              <button
                key={i}
                style={S.actionBtn(a.danger)}
                onClick={(e) => { e.stopPropagation(); a.onClick(e); }}
                aria-label={a.label}
              >
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {onPress && !actions.length && (
        <span style={S.chevron} aria-hidden>›</span>
      )}
    </div>
  );
}