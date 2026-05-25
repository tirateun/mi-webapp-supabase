import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BottomNav }    from './BottomNav';
import { MobileHeader } from './MobileHeader';

type UserRole = 'admin' | 'interno' | 'consulta';

interface MobileLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  pageTitle: string;
  pageSubtitle?: string;
  /** Función que se llama al tocar ← en el header. Si no se pasa, muestra el logo. */
  onBack?: () => void;
  isHome?: boolean;
  onChatbot?: () => void;
  alertCount?: number;
  desktopLayout?: React.ReactNode;
}

const S = {
  root: {
    display: 'flex', flexDirection: 'column' as const,
    minHeight: '100dvh', background: '#F0F6FC', overflowX: 'hidden' as const,
  },
  content: {
    flex: 1, overflowY: 'auto' as const, overflowX: 'hidden' as const,
    paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
    WebkitOverflowScrolling: 'touch' as const,
  },
};

export function MobileLayout({
  children, role, pageTitle, pageSubtitle,
  onBack, isHome = false, onChatbot, alertCount = 0, desktopLayout,
}: MobileLayoutProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return <>{desktopLayout ?? children}</>;

  return (
    <div style={S.root}>
      <MobileHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        onBack={onBack}
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