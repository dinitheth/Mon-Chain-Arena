'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import Link from 'next/link';
import { usePlayer } from '@/contexts/player-context';
import { usePrivy } from '@privy-io/react-auth';
import { LogOut } from 'lucide-react';

export function PlayerNameModal() {
  const { refreshPlayerData } = usePlayer();
  const { logout } = usePrivy();
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Username</DialogTitle>
          <DialogDescription>
            You need a Monad Games ID username to play. Please visit the Monad
            Games ID site to create one. Once done, click refresh.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button asChild>
            <Link
              href="https://monad-games-id-site.vercel.app/"
              target="_blank"
            >
              Create Username
            </Link>
          </Button>
          <Button variant="outline" onClick={refreshPlayerData}>Refresh</Button>
           <Button variant="ghost" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
