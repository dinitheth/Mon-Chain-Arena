'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogIn, Play } from 'lucide-react';
import { usePlayer } from '@/contexts/player-context';

export function LoginPrompt() {
  const { login } = usePrivy();
  const { setAsGuest } = usePlayer();

  return (
    <div className="container mx-auto flex h-[calc(100vh-57px)] items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Welcome to Chain Arena</CardTitle>
          <CardDescription>
            Log in with your Monad Games ID to join the battle and climb the on-chain leaderboard, or play as a guest.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button size="lg" onClick={login} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <LogIn className="mr-2 h-5 w-5" />
            Login & Play
          </Button>
          <Button size="lg" variant="outline" onClick={setAsGuest} className="w-full">
            <Play className="mr-2 h-5 w-5" />
            Play as Guest
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
