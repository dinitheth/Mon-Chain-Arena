'use client';

import { usePrivy } from '@privy-io/react-auth';
import { PlayerNameModal } from './player-name-modal';
import { usePlayer } from '@/contexts/player-context';
import { Arena } from './arena';
import { LoginPrompt } from './login-prompt';
import { Skeleton } from './ui/skeleton';

export function GameClient() {
  const { ready, authenticated } = usePrivy();
  const { isGuest, isPlayerNameSet } = usePlayer();

  if (!ready) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center h-full">
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  if (isGuest) {
    return <Arena />;
  }

  if (!authenticated) {
    return <LoginPrompt />;
  }

  if (!isPlayerNameSet) {
    return <PlayerNameModal />;
  }
  
  return <Arena />;
}
