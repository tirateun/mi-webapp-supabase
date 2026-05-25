import { useState, useEffect } from 'react';

/**
 * Detecta si el viewport es móvil según el breakpoint indicado (default 768px).
 * Se actualiza reactivamente al redimensionar.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Detecta si el dispositivo es táctil.
 * Útil para ajustar tamaños de tap targets.
 */
export function useIsTouch(): boolean {
  return typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
}

/**
 * Obtiene las safe areas del dispositivo (notch, home bar en iPhone).
 * Requiere que el CSS tenga: padding: env(safe-area-inset-*)
 */
export function useSafeArea() {
  const getEnvValue = (name: string): number => {
    if (typeof window === 'undefined') return 0;
    const el = document.createElement('div');
    el.style.paddingBottom = `env(${name})`;
    document.body.appendChild(el);
    const val = parseInt(getComputedStyle(el).paddingBottom || '0', 10);
    document.body.removeChild(el);
    return isNaN(val) ? 0 : val;
  };

  const [safeArea] = useState(() => ({
    top:    getEnvValue('safe-area-inset-top'),
    right:  getEnvValue('safe-area-inset-right'),
    bottom: getEnvValue('safe-area-inset-bottom'),
    left:   getEnvValue('safe-area-inset-left'),
  }));

  return safeArea;
}