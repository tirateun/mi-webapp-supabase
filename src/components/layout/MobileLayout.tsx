/**
 * MobileLayout.tsx
 * Ruta final en tu proyecto: src/components/layout/MobileLayout.tsx
 *
 * Wrapper inteligente: en desktop renderiza el layout actual sin cambios,
 * en móvil activa MobileHeader + contenido scrolleable + BottomNav.
 *
 * Imports relativos ajustados a la estructura real:
 *   src/
 *     hooks/useIsMobile.ts           ← ../../hooks/useIsMobile
 *     components/layout/BottomNav    ← ./BottomNav
 *     components/layout/MobileHeader ← ./MobileHeader
 */

import { useIsMobile } from '../../hooks/useIsMobile';
import { BottomNav }     from './BottomNav';
import { MobileHeader }  from './MobileHeader';

type UserRole = 'admin' | 'interno' | 'consulta';

interface MobileLayoutProps {
  children: React.ReactNode;

  // Datos del usuario
  role: UserRole;

  // Cabecera
  pageTitle: string;
  pageSubtitle?: string;
  showBack?: boolean;
  isHome?: boolean;

  // Chatbot
  onChatbot?: () => void;

  // Badge de alertas en Convenios
  alertCount?: number;

  /**
   * Si se proporciona, se usa como layout en desktop.
   * Si no, se renderiza `children` directamente en ambas vistas.
   */
  desktopLayout?: React.ReactNode;
}

const S = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100dvh',          // dvh respeta la barra del navegador en móvil
    background: '#F0F6FC',
    overflowX: 'hidden' as const,
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    // paddingBottom = altura BottomNav (≈ 64px) + safe area home bar iPhone
    paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
    WebkitOverflowScrolling: 'touch' as const,
  },
};

export function MobileLayout({
  children,
  role,
  pageTitle,
  pageSubtitle,
  showBack = false,
  isHome = false,
  onChatbot,
  alertCount = 0,
  desktopLayout,
}: MobileLayoutProps) {
  const isMobile = useIsMobile(); // breakpoint 768px por defecto

  // ── Desktop: sin cambios ──────────────────────────────────────
  if (!isMobile) {
    return <>{desktopLayout ?? children}</>;
  }

  // ── Móvil: layout completo ────────────────────────────────────
  return (
    <div style={S.root}>
      <MobileHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        showBack={showBack}
        role={role}
        onChatbot={onChatbot}
        isHome={isHome}
      />

      <main style={S.content} id="main-content">
        {children}
      </main>

      <BottomNav role={role} alertCount={alertCount} />
    </div>
  );
}