'use client';

import { ThemeProvider } from 'next-themes';
import { PrivyProvider } from '@privy-io/react-auth';
import { PlayerProvider } from '@/contexts/player-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethodsAndOrder: {
            primary: ['email', 'google', 'privy:cmd8euall0037le0my79qpz42'],
          },
          appearance: {
            theme: 'dark',
            accentColor: '#39FF14',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
        }}
      >
        <PlayerProvider>{children}</PlayerProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
}
