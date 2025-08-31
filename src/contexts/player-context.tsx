'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy, type CrossAppAccountWithMetadata } from '@privy-io/react-auth';

interface PlayerContextType {
  playerName: string | null;
  isPlayerNameSet: boolean;
  walletAddress: string | null;
  refreshPlayerData: () => void;
  isGuest: boolean;
  setAsGuest: () => void;
  resetGuest: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [isPlayerNameSet, setIsPlayerNameSet] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const { user, ready, authenticated } = usePrivy();

  const fetchPlayerData = useCallback(async () => {
    if (!ready || !authenticated || !user) {
      setPlayerNameState(null);
      setIsPlayerNameSet(false);
      setWalletAddress(null);
      return;
    }

    const crossAppAccount = user.linkedAccounts.find(
      (account) =>
        account.type === 'cross_app' &&
        account.providerApp.id === 'cmd8euall0037le0my79qpz42'
    ) as CrossAppAccountWithMetadata | undefined;

    const monadWalletAddress = crossAppAccount?.embeddedWallets?.[0]?.address;

    if (monadWalletAddress) {
      setWalletAddress(monadWalletAddress);
      try {
        const res = await fetch(
          `https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${monadWalletAddress}`
        );

        if (!res.ok) {
          console.error('API request to check-wallet failed:', res.statusText);
          setPlayerNameState(null);
          setIsPlayerNameSet(false);
          return;
        }

        const data = await res.json();
        if (data.hasUsername && data.user?.username) {
          setPlayerNameState(data.user.username);
          setIsPlayerNameSet(true);
        } else {
          setPlayerNameState(null);
          setIsPlayerNameSet(false);
        }
      } catch (error) {
        console.error("Error fetching player data from check-wallet API:", error);
        setPlayerNameState(null);
        setIsPlayerNameSet(false);
      }
    } else {
      setPlayerNameState(null);
      setIsPlayerNameSet(false);
      setWalletAddress(null);
    }
  }, [user, ready, authenticated]);

  useEffect(() => {
    if (!isGuest) {
      fetchPlayerData();
    }
  }, [fetchPlayerData, isGuest]);
  
  const setAsGuest = () => {
    setIsGuest(true);
  }
  
  const resetGuest = () => {
    setIsGuest(false);
  }

  const value = { playerName, isPlayerNameSet, walletAddress, refreshPlayerData: fetchPlayerData, isGuest, setAsGuest, resetGuest };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
