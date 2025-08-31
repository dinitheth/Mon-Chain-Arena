'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/hooks/use-game';
import { ARENA_SIZE, TILE_SIZE, MAX_ROUNDS } from '@/lib/constants';
import type { HealthPack, ProtectionShield } from '@/types/game';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Heart, Shield, Skull, Swords, Bot, Loader, HeartPulse, Play, Pause, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const Player = ({ x, y, isProtected }: { x: number; y: number; isProtected?: boolean }) => (
  <motion.div
    animate={{ x: x * TILE_SIZE, y: y * TILE_SIZE }}
    transition={{ duration: 0.1, ease: 'linear' }}
    className="absolute"
    style={{ width: TILE_SIZE, height: TILE_SIZE }}
  >
    <div className={cn(
        "w-full h-full rounded-md bg-accent flex items-center justify-center relative overflow-hidden",
        isProtected && "shadow-[0_0_15px_3px] shadow-sky-400"
    )}>
      <span className="text-background text-lg font-bold">P</span>
      {isProtected && (
          <motion.div 
            className="absolute inset-0 border-2 border-sky-400 rounded-md"
            initial={{ scale: 1.1, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ repeat: Infinity, repeatType: "mirror", duration: 0.5}}
          />
      )}
    </div>
  </motion.div>
);

const BotComponent = ({ x, y, health, maxHealth }: { x: number; y: number; health: number; maxHealth: number }) => (
  <motion.div
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1, x: x * TILE_SIZE, y: y * TILE_SIZE }}
    exit={{ scale: 0.5, opacity: 0 }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
    className="absolute flex flex-col items-center"
    style={{ width: TILE_SIZE, height: TILE_SIZE }}
  >
    <div className="w-full h-full rounded-md bg-primary flex items-center justify-center">
      <Bot className="text-primary-foreground" />
    </div>
    <Progress value={(health/maxHealth) * 100} className="h-1 w-3/4 mt-1" />
  </motion.div>
);

const HealthPackComponent = ({ pack }: { pack: HealthPack }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, rotate: -180 }}
    animate={{ scale: 1, opacity: 1, rotate: 0, x: pack.x * TILE_SIZE, y: pack.y * TILE_SIZE }}
    exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    className="absolute flex items-center justify-center"
    style={{ width: TILE_SIZE, height: TILE_SIZE }}
  >
    <div className="w-3/4 h-3/4 rounded-md bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
        <HeartPulse className="h-6 w-6 text-green-500 animate-pulse" />
    </div>
  </motion.div>
);

const ProtectionShieldComponent = ({ shield }: { shield: ProtectionShield }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: -100 }}
    animate={{ scale: 1, opacity: 1, y: shield.y * TILE_SIZE, x: shield.x * TILE_SIZE }}
    exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
    transition={{ type: 'spring', stiffness: 150, damping: 15 }}
    className="absolute flex items-center justify-center"
    style={{ width: TILE_SIZE, height: TILE_SIZE }}
  >
    <div className="w-3/4 h-3/4 rounded-full bg-sky-500/20 border-2 border-sky-500 flex items-center justify-center">
      <ShieldCheck className="h-6 w-6 text-sky-400 animate-pulse" />
    </div>
  </motion.div>
);


const GameLog = ({ log }: { log: string[] }) => (
  <Card className="absolute bottom-4 left-4 w-64 h-40 bg-background/80 backdrop-blur-sm">
    <CardHeader className="p-2">
      <CardTitle className="text-sm">Combat Log</CardTitle>
    </CardHeader>
    <CardContent className="p-2 text-xs font-code overflow-y-auto h-24">
      {log.map((entry, i) => (
        <p key={i} className="animate-in fade-in-0 slide-in-from-bottom-2">{entry}</p>
      ))}
    </CardContent>
  </Card>
);

const Sparkle = ({ size, x, y, delay }: { size: number, x: number, y: number, delay: number }) => (
  <motion.div
    className="absolute"
    style={{ top: y, left: x }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
    transition={{ duration: 0.7, delay, ease: 'easeInOut' }}
  >
    <Sparkles style={{ width: size, height: size }} className="text-yellow-400" />
  </motion.div>
);

const VictoryAnimation = ({ children }: { children: React.ReactNode }) => {
    const sparkles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 20 + 10,
    x: Math.random() * 100 + '%',
    y: Math.random() * 100 + '%',
    delay: Math.random() * 1,
  }));

  return (
    <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 10 }}
    >
      {children}
      {sparkles.map((sparkle) => (
        <Sparkle key={sparkle.id} {...sparkle} />
      ))}
    </motion.div>
  );
};


export function Arena() {
  const {
    gameState,
    player,
    bots,
    round,
    score,
    log,
    healthPack,
    protectionShield,
    isPaused,
    startGame,
    movePlayer,
    playerAttack,
    nextRound,
    lastVictory,
    togglePause,
    protectionTimeLeft,
  } = useGame();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;

      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          movePlayer('up');
          break;
        case 's':
        case 'ArrowDown':
          movePlayer('down');
          break;
        case 'a':
        case 'ArrowLeft':
          movePlayer('left');
          break;
        case 'd':
        case 'ArrowRight':
          movePlayer('right');
          break;
        case ' ':
          e.preventDefault();
          playerAttack();
          break;
      }
    },
    [gameState, movePlayer, playerAttack]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const arenaWidth = ARENA_SIZE * TILE_SIZE;
  const isPlaying = gameState === 'PLAYING';

  return (
    <div className="flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-4xl flex justify-between items-center mb-4 text-foreground">
        <div className="flex items-center gap-4">
          {isPlaying && (
            <>
              <div className="flex items-center gap-2">
                <Heart className="text-red-500" />
                <Progress value={(player.health / player.maxHealth) * 100} className="w-32 h-3 [&>div]:bg-red-500" />
                <span className="font-bold">{player.health}</span>
              </div>
               {player.isProtected && protectionTimeLeft > 0 && (
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <ShieldCheck className="animate-pulse" />
                  <span>{(protectionTimeLeft / 1000).toFixed(1)}s</span>
                </div>
              )}
              <div className="flex items-center gap-2 font-headline">
                <Shield className="text-accent" />
                <span>Score: {score}</span>
              </div>
            </>
          )}
        </div>
        <div className="font-headline text-2xl font-bold">
           {gameState !== 'IDLE' && `Round ${round}/${MAX_ROUNDS}`}
        </div>
         <div className="flex items-center gap-4">
           {isPlaying && (
            <Button onClick={togglePause} variant="outline" size="icon">
              {isPaused ? <Play /> : <Pause />}
            </Button>
          )}
        </div>
      </div>
      <div
        className="relative bg-card rounded-lg shadow-lg border-2 border-primary/50"
        style={{ width: arenaWidth, height: arenaWidth }}
      >
        <div
          className="grid absolute inset-0"
          style={{ gridTemplateColumns: `repeat(${ARENA_SIZE}, 1fr)` }}
        >
          {[...Array(ARENA_SIZE * ARENA_SIZE)].map((_, i) => (
            <div key={i} className="border border-foreground/10" />
          ))}
        </div>
        <AnimatePresence>
          {isPlaying && <Player key="player" x={player.x} y={player.y} isProtected={player.isProtected} />}
          {isPlaying &&
            bots.map((bot) => <BotComponent key={bot.id} {...bot} />)}
          {isPlaying && healthPack && <HealthPackComponent key={healthPack.id} pack={healthPack} />}
          {isPlaying && protectionShield && <ProtectionShieldComponent key={protectionShield.id} shield={protectionShield} />}
        </AnimatePresence>

        <AnimatePresence>
          {(gameState === 'ROUND_OVER' || gameState === 'GAME_OVER_WIN' || gameState === 'GAME_OVER_LOSE' || isPaused) && (
            <motion.div
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 flex items-center justify-center"
            >
              {gameState === 'GAME_OVER_WIN' ? (
                <VictoryAnimation>
                  <Card className="w-96 text-center">
                    <CardHeader>
                      <CardTitle className="text-3xl font-headline">Victory!</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>You have defeated all bots! Your victory is recorded on-chain.</p>
                      {lastVictory && (
                        <div className="mt-4 text-left space-y-2">
                          <h3 className="font-bold">Final Stats:</h3>
                          <p className="flex items-center gap-2 font-bold text-green-500"><Swords /> Kills: {lastVictory.kills}</p>
                          <p className="flex items-center gap-2 font-bold text-red-500"><Skull /> Deaths: {lastVictory.deaths}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <Button onClick={startGame}>Play Again</Button>
                    </CardFooter>
                  </Card>
                </VictoryAnimation>
              ) : (
                <Card className="w-96 text-center">
                  <CardHeader>
                    <CardTitle className="text-3xl font-headline">
                      {isPaused && 'Paused'}
                      {gameState === 'ROUND_OVER' && `Round ${round} Cleared!`}
                      {gameState === 'GAME_OVER_LOSE' && 'Game Over'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPaused && <p>The game is paused. Take a break!</p>}
                    {gameState === 'GAME_OVER_LOSE' && <p>You have been defeated. Try again!</p>}
                    {gameState === 'GAME_OVER_LOSE' && lastVictory && (
                       <div className="mt-4 text-left space-y-2">
                         <h3 className="font-bold">Final Stats:</h3>
                         <p className="flex items-center gap-2 font-bold text-green-500"><Swords /> Kills: {lastVictory.kills}</p>
                         <p className="flex items-center gap-2 font-bold text-red-500"><Skull /> Deaths: {lastVictory.deaths}</p>
                       </div>
                     )}
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    {isPaused && <Button onClick={togglePause}>Resume Game</Button>}
                    {gameState === 'ROUND_OVER' && <Button onClick={nextRound} className="bg-accent hover:bg-accent/90 text-accent-foreground">Next Round</Button>}
                    {gameState === 'GAME_OVER_LOSE' && <Button onClick={startGame}>Play Again</Button>}
                  </CardFooter>
                </Card>
              )}
            </motion.div>
          )}
           {gameState === 'IDLE' && (
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/80 flex items-center justify-center"
            >
              <Card className="w-96 text-center">
                <CardHeader>
                  <CardTitle className="text-4xl font-headline">Chain Arena</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Defeat bots in {MAX_ROUNDS} rounds to get on the leaderboard.</p>
                  <div className="mt-4 text-left space-y-2">
                      <p><span className="font-bold font-code">WASD/Arrows</span>: Move</p>
                      <p><span className="font-bold font-code">Spacebar</span>: Attack</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button onClick={startGame} className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6">Start Game</Button>
                </CardFooter>
              </Card>
            </motion.div>
           )}
           {gameState === 'LOADING' && (
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/80 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4 text-lg">
                <Loader className="animate-spin h-8 w-8" />
                <p>Starting Round {round}...</p>
              </div>
            </motion.div>
           )}
        </AnimatePresence>
      </div>
      {isPlaying && <GameLog log={log} />}
    </div>
  );
}
