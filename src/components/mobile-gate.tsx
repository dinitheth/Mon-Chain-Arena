'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePrompt } from './mobile-prompt';

export function MobileGate({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobilePrompt />;
  }

  return <>{children}</>;
}
