export interface Position {
  x: number;
  y: number;
}

export interface Player extends Position {
  health: number;
  maxHealth: number;
  kills: number;
  deaths: number;
  isProtected?: boolean;
}

export interface Bot extends Position {
  id: string;
  health: number;
  maxHealth: number;
  strategy: string;
  attackCooldown: number;
}

export interface HealthPack extends Position {
  id: string;
}

export interface ProtectionShield extends Position {
  id: string;
}

export type GameState = 'IDLE' | 'LOADING' | 'PLAYING' | 'ROUND_OVER' | 'GAME_OVER_WIN' | 'GAME_OVER_LOSE';

export interface PlayerRecord {
  address: string;
  name: string;
  kills: number;
  deaths: number;
}

export interface Victory {
  kills: number;
  deaths: number;
}
