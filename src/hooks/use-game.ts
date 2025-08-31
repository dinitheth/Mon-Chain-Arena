'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ARENA_SIZE, INITIAL_PLAYER_HEALTH, MAX_ROUNDS } from '@/lib/constants';
import type { Bot, Player, GameState, Victory, HealthPack, ProtectionShield } from '@/types/game';
import { generateBotStrategy } from '@/ai/flows/ai-bot-opponent-tool';
import { recordVictory as recordVictoryOnChain } from '@/lib/blockchain';
import { usePlayer } from '@/contexts/player-context';
import { useToast } from './use-toast';

const TICK_RATE = 200; // ms per game tick
const HEALTH_PACK_ROUNDS = [4, 5];
const HEALTH_PACK_AMOUNT = 50;
const PROTECTION_SHIELD_ROUNDS = [4, 5];
const PROTECTION_DURATION = 3000; // 3 seconds

export function useGame() {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState<Player>({
    x: Math.floor(ARENA_SIZE / 2),
    y: ARENA_SIZE - 2,
    health: INITIAL_PLAYER_HEALTH,
    maxHealth: INITIAL_PLAYER_HEALTH,
    kills: 0,
    deaths: 0,
    isProtected: false,
  });
  const [bots, setBots] = useState<Bot[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [lastVictory, setLastVictory] = useState<Victory | null>(null);
  const [healthPack, setHealthPack] = useState<HealthPack | null>(null);
  const [protectionShield, setProtectionShield] = useState<ProtectionShield | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [protectionTimeLeft, setProtectionTimeLeft] = useState(0);

  const { playerName, walletAddress, isGuest } = usePlayer();
  const { toast } = useToast();
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const protectionTimeoutRef = useRef<NodeJS.Timeout>();
  const nextStrategyRef = useRef<string | null>(null);

  const performanceHistory = useRef<string[]>([]);

  const addToLog = useCallback((message: string) => {
    setLog((prev) => [message, ...prev.slice(0, 4)]);
  }, []);
  
  const prepareNextStrategy = useCallback(async (currentRound: number) => {
    if (currentRound >= MAX_ROUNDS) {
      nextStrategyRef.current = null;
      return;
    }
    try {
      const aiResponse = await generateBotStrategy({
        playerPerformance:
          performanceHistory.current.join(' ') || 'No prior performance.',
        roundNumber: currentRound + 1,
      });
      nextStrategyRef.current = aiResponse.strategy;
      console.log(`AI strategy for round ${currentRound + 1} is ready.`);
    } catch (error) {
      console.error('AI strategy generation failed:', error);
      nextStrategyRef.current = 'Default: Move towards player and attack.';
    }
  }, []);

  const createBots = useCallback(
    (count: number, currentRound: number, strategy: string) => {
      if (currentRound === 1) {
         // For the first round, fetch strategy immediately
        generateBotStrategy({
          playerPerformance: 'No prior performance.',
          roundNumber: 1,
        }).then(aiResponse => {
           const firstRoundStrategy = aiResponse.strategy;
           const newBots: Bot[] = [];
            for (let i = 0; i < count; i++) {
              newBots.push({
                id: `bot-${currentRound}-${i}`,
                x: Math.floor(Math.random() * ARENA_SIZE),
                y: Math.floor(Math.random() * 3),
                health: 20 + currentRound * 10,
                maxHealth: 20 + currentRound * 10,
                strategy: firstRoundStrategy,
                attackCooldown: 0,
              });
            }
            setBots(newBots);
            addToLog(`AI: ${firstRoundStrategy.substring(0, 30)}...`);
            setGameState('PLAYING');
        }).catch(error => {
            console.error('AI strategy generation failed:', error);
            const defaultStrategy = 'Default: Move towards player and attack.';
            const newBots: Bot[] = [];
            for (let i = 0; i < count; i++) {
              newBots.push({
                id: `bot-${currentRound}-${i}`,
                x: Math.floor(Math.random() * ARENA_SIZE),
                y: Math.floor(Math.random() * 3),
                health: 20 + currentRound * 10,
                maxHealth: 20 + currentRound * 10,
                strategy: defaultStrategy,
                attackCooldown: 0,
              });
            }
            setBots(newBots);
            addToLog('AI failed. Using default strategy.');
            setGameState('PLAYING');
        });
      } else {
        const newBots: Bot[] = [];
        for (let i = 0; i < count; i++) {
          newBots.push({
            id: `bot-${currentRound}-${i}`,
            x: Math.floor(Math.random() * ARENA_SIZE),
            y: Math.floor(Math.random() * 3),
            health: 20 + currentRound * 10,
            maxHealth: 20 + currentRound * 10,
            strategy: strategy,
            attackCooldown: 0,
          });
        }
        setBots(newBots);
        addToLog(`AI: ${strategy.substring(0, 30)}...`);
        setGameState('PLAYING');
      }

      // Start preparing strategy for the *next* round
      prepareNextStrategy(currentRound);
    },
    [addToLog, prepareNextStrategy]
  );

  const startGame = useCallback(() => {
    setPlayer({
      x: Math.floor(ARENA_SIZE / 2),
      y: ARENA_SIZE - 2,
      health: INITIAL_PLAYER_HEALTH,
      maxHealth: INITIAL_PLAYER_HEALTH,
      kills: 0,
      deaths: 0,
      isProtected: false,
    });
    setRound(1);
    setScore(0);
    setLog([]);
    setHealthPack(null);
    setProtectionShield(null);
    setProtectionTimeLeft(0);
    if (protectionTimeoutRef.current) clearTimeout(protectionTimeoutRef.current);
    performanceHistory.current = [];
    setIsPaused(false);
    setGameState('LOADING');
    createBots(1, 1, ''); // Strategy will be fetched inside createBots for round 1
  }, [createBots]);

  const nextRound = useCallback(async () => {
    const next = round + 1;
    const botCount = Math.min(next + (next > 3 ? 1 : 0), 5); // Increase bots in round 4 and 5
    setPlayer((p) => ({ ...p, health: INITIAL_PLAYER_HEALTH, isProtected: false }));
    setProtectionTimeLeft(0);
    if (protectionTimeoutRef.current) clearTimeout(protectionTimeoutRef.current);

    setRound(next);
    setGameState('LOADING');
    setIsPaused(false);

    if (HEALTH_PACK_ROUNDS.includes(next)) {
      setHealthPack({
        id: `hp-round-${next}`,
        x: Math.floor(Math.random() * ARENA_SIZE),
        y: Math.floor(Math.random() * (ARENA_SIZE - 5)) + 2, // Avoid top/bottom rows
      });
      addToLog('A health pack has appeared!');
    } else {
      setHealthPack(null);
    }

    if (PROTECTION_SHIELD_ROUNDS.includes(next)) {
      setProtectionShield({
        id: `shield-round-${next}`,
        x: Math.floor(Math.random() * ARENA_SIZE),
        y: Math.floor(Math.random() * (ARENA_SIZE - 5)) + 2,
      });
      addToLog('A protection shield has appeared!');
    } else {
      setProtectionShield(null);
    }
    
    const strategy = nextStrategyRef.current || 'Default: Move towards player and attack.';
    if (!nextStrategyRef.current) {
      addToLog('AI failed. Using default strategy.');
    }
    createBots(botCount, next, strategy);
  }, [round, createBots, addToLog]);

  const movePlayer = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (isPaused) return;
      setPlayer((p) => {
        let { x, y } = p;
        if (direction === 'up') y = Math.max(0, y - 1);
        if (direction === 'down') y = Math.min(ARENA_SIZE - 1, y + 1);
        if (direction === 'left') x = Math.max(0, x - 1);
        if (direction === 'right') x = Math.min(ARENA_SIZE - 1, x + 1);
        
        let newPlayerState = { ...p, x, y };

        // Check for health pack pickup
        if (healthPack && x === healthPack.x && y === healthPack.y) {
          const newHealth = Math.min(p.maxHealth, p.health + HEALTH_PACK_AMOUNT);
          addToLog(`You recovered ${newHealth - p.health} health!`);
          setHealthPack(null);
          newPlayerState.health = newHealth;
        }

        // Check for protection shield pickup
        if (protectionShield && x === protectionShield.x && y === protectionShield.y) {
          addToLog('Protection shield activated! You are invincible for 3 seconds.');
          setProtectionShield(null);
          newPlayerState.isProtected = true;
          setProtectionTimeLeft(PROTECTION_DURATION);

          if (protectionTimeoutRef.current) clearTimeout(protectionTimeoutRef.current);
          protectionTimeoutRef.current = setTimeout(() => {
            setPlayer(currentPlayer => ({...currentPlayer, isProtected: false}));
            setProtectionTimeLeft(0);
            addToLog('Protection shield worn off.');
          }, PROTECTION_DURATION);
        }

        return newPlayerState;
      });
    },
    [healthPack, protectionShield, addToLog, isPaused]
  );

  const playerAttack = useCallback(() => {
    if (isPaused) return;
    let didHit = false;
    let killedBot = false;
    setBots((currentBots) => {
      const newBots = [...currentBots];
      for (let i = 0; i < newBots.length; i++) {
        const bot = newBots[i];
        if (
          Math.abs(bot.x - player.x) <= 1 &&
          Math.abs(bot.y - player.y) <= 1
        ) {
          bot.health -= 10;
          didHit = true;
          if (bot.health <= 0) {
            killedBot = true;
            addToLog(`Player eliminated Bot ${bot.id.slice(-1)}!`);
            setScore((s) => s + 100 * round);
            setPlayer((p) => ({ ...p, kills: p.kills + 1 }));
          }
        }
      }
      return newBots.filter((b) => b.health > 0);
    });

    if (didHit && !killedBot) {
        // toast({ title: "Hit!", description: "You damaged a bot." });
    }
    if (killedBot) {
        toast({
        title: 'Bot Eliminated!',
        description: 'You earned 100 points.',
        });
    }
  }, [player.x, player.y, round, addToLog, toast, isPaused]);

  const gameTick = useCallback(() => {
    if (gameState !== 'PLAYING' || isPaused) return;

    if (protectionTimeLeft > 0) {
      setProtectionTimeLeft(prev => Math.max(0, prev - TICK_RATE));
    }
  
    setBots(currentBots =>
      currentBots.map(bot => {
        let { x, y, attackCooldown } = bot;
        const inAttackRange = Math.abs(x - player.x) <= 1 && Math.abs(y - player.y) <= 1;

        // Phase 1: Attack (only if in range and not on cooldown)
        if (inAttackRange && attackCooldown <= 0) {
           if (!player.isProtected) {
            const damage = 5 * round;
            setPlayer(p => ({ ...p, health: Math.max(0, p.health - damage) }));
            addToLog(`Bot ${bot.id.slice(-1)} hit you for ${damage}!`);
          } else {
            addToLog(`Bot ${bot.id.slice(-1)}'s attack was blocked!`);
          }
          attackCooldown = 2000; // Reset cooldown after attacking
        } else {
            // Phase 2: Movement (only if not in attack range)
            if (!inAttackRange) {
              const dx = player.x - x;
              const dy = player.y - y;
      
              if (bot.strategy.includes('aggressive') || Math.random() > 0.3) {
                if (Math.abs(dx) > Math.abs(dy)) {
                  x += Math.sign(dx);
                } else {
                  y += Math.sign(dy);
                }
              }
            }
        }
        
        // Phase 3: Cooldown Tick
        if (attackCooldown > 0) {
          attackCooldown -= TICK_RATE;
        }
  
        // Clamp position
        x = Math.max(0, Math.min(ARENA_SIZE - 1, x));
        y = Math.max(0, Math.min(ARENA_SIZE - 1, y));
  
        return { ...bot, x, y, attackCooldown };
      })
    );
  }, [gameState, player.x, player.y, player.isProtected, round, addToLog, isPaused, protectionTimeLeft]);

  const recordVictory = useCallback(async () => {
    if (isGuest) {
      toast({
        title: "Guest Victory!",
        description: "Log in to save your score to the on-chain leaderboard.",
      });
      return;
    }
    if (playerName && walletAddress) {
      try {
        await recordVictoryOnChain(walletAddress, playerName, player.kills, player.deaths);
        toast({
          title: "Victory Recorded!",
          description: "Your victory has been recorded on the on-chain leaderboard.",
        });
      } catch (error: any) {
        console.error('Failed to record victory on-chain:', error);
        if (error.code === 4001 || (error.message && error.message.includes('User rejected request'))) {
           toast({
            variant: "destructive",
            title: "Transaction Canceled",
            description: "You canceled the request to record your victory.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "On-chain Record Failed",
            description: "There was an error recording your victory. Please try again.",
          });
        }
      }
    }
  }, [playerName, walletAddress, player.kills, player.deaths, toast, isGuest]);

  // Game state transitions
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    if (player.health <= 0) {
      setPlayer((p) => ({ ...p, deaths: p.deaths + 1 }));
      setLastVictory({ kills: player.kills, deaths: player.deaths + 1 });
      setGameState('GAME_OVER_LOSE');
      performanceHistory.current.push('Player was defeated.');
    } else if (bots.length === 0) {
      if (round === MAX_ROUNDS) {
        setLastVictory({ kills: player.kills, deaths: player.deaths });
        setGameState('GAME_OVER_WIN');
        recordVictory();
        performanceHistory.current.push('Player won the game.');
      } else {
        setGameState('ROUND_OVER');
        performanceHistory.current.push(
          `Player cleared round ${round} with ${player.health} remaining.`
        );
      }
    }
  }, [
    gameState,
    player.health,
    bots.length,
    round,
    recordVictory,
    player.kills,
    player.deaths,
  ]);
  
  // Game loop
  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused) {
      gameLoopRef.current = setInterval(gameTick, TICK_RATE);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (protectionTimeoutRef.current) clearTimeout(protectionTimeoutRef.current);
    };
  }, [gameState, gameTick, isPaused]);


  return {
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
    togglePause: () => setIsPaused(p => !p),
    protectionTimeLeft,
  };
}
