'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { Swords, LogIn, LogOut, Crown, User } from 'lucide-react';
import { usePlayer } from '@/contexts/player-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';


export function Header() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { playerName, walletAddress, isGuest, resetGuest } = usePlayer();
  
  const handleLogin = () => {
    if (isGuest) {
      resetGuest();
    }
    login();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Chain Arena</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm ml-6">
           <Link href="/leaderboard" className="flex items-center gap-1 transition-colors hover:text-accent focus-visible:text-accent">
            <Crown className="h-4 w-4" />
            Leaderboard
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />
          {ready &&
            (authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-primary text-primary-foreground">
                        {playerName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{playerName}</p>
                      {walletAddress && <p className="text-xs leading-none text-muted-foreground font-code">
                        {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                      </p>}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleLogin}>
                 {isGuest ? (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login to Save Score
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
            ))}
             {isGuest && (
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4"/>
                    <span>Guest</span>
                 </div>
            )}
        </div>
      </div>
    </header>
  );
}
