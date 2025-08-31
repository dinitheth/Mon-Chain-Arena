'use server';

import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import type { PlayerRecord } from "@/types/game";
import { contractAbi } from './contract-abi';

const CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const MONAD_RPC_URL = 'https://testnet.monad.xyz';
const LEADERBOARD_API_URL = 'https://monad-games-id-site.vercel.app/api/leaderboard';

async function getContract() {
  const provider = new JsonRpcProvider(MONAD_RPC_URL);
  
  if (!process.env.ADMIN_PRIVATE_KEY) {
    throw new Error('ADMIN_PRIVATE_KEY is not set in the environment variables.');
  }
  const adminWallet = new Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  
  const contract = new Contract(CONTRACT_ADDRESS, contractAbi, adminWallet);
  return contract;
}

export async function getLeaderboard(): Promise<PlayerRecord[]> {
  try {
    const response = await fetch(LEADERBOARD_API_URL);
    if (!response.ok) {
      console.error('Failed to fetch leaderboard:', response.statusText);
      return [];
    }
    const data = await response.json();
    // Sort leaderboard by kills descending
    const sortedLeaderboard = data.leaderboard.sort((a: any, b: any) => b.score - a.score);
    
    return sortedLeaderboard.map((player: any) => ({
        address: player.walletAddress,
        name: player.username,
        kills: player.score,
        deaths: player.transactions
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export async function recordVictory(address: string, name: string, kills: number, deaths: number): Promise<void> {
  console.log('Recording victory on mock blockchain...');
  console.log({ address, name, kills, deaths });
  
  try {
    const contract = await getContract();
    // We send `deaths` as the transactionAmount, assuming 1 death = 1 transaction for this game session
    const tx = await contract.updatePlayerData(address, kills, deaths);
    await tx.wait();
    console.log('Victory recorded on-chain!', tx.hash);
  } catch (error) {
      console.error('Failed to record victory on-chain:', error);
      // We are throwing the error so the client can handle it.
      throw error;
  }
}
