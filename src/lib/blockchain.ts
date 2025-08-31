'use server';

import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import type { PlayerRecord } from "@/types/game";
import { contractAbi } from './contract-abi';

const CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const MONAD_RPC_URL = 'https://testnet.monad.xyz';
const LEADERBOARD_API_URL = 'https://monad-games-id-site.vercel.app/api/leaderboard';

async function getContract() {
  const provider = new JsonRpcProvider(MONAD_RPC_URL);
  
  let privateKey = process.env.ADMIN_PRIVATE_KEY;

  if (!privateKey) {
    console.error('ADMIN_PRIVATE_KEY is not set in environment variables.');
    throw new Error('Server configuration error: ADMIN_PRIVATE_KEY is missing.');
  }

  if (!privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`;
  }
  
  try {
    const adminWallet = new Wallet(privateKey, provider);
    const contract = new Contract(CONTRACT_ADDRESS, contractAbi, adminWallet);
    return contract;
  } catch (error) {
    console.error('Failed to create wallet or contract instance:', error);
    throw new Error('Server configuration error: Could not initialize wallet.');
  }
}

export async function getLeaderboard(): Promise<PlayerRecord[]> {
  try {
    // Revalidate leaderboard data every 60 seconds
    const response = await fetch(LEADERBOARD_API_URL, { next: { revalidate: 60 } });
    if (!response.ok) {
      console.error('Failed to fetch leaderboard:', response.status, response.statusText);
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
  console.log(`Attempting to record victory for ${name} (${address}) with ${kills} kills and ${deaths} deaths.`);
  
  try {
    const contract = await getContract();
    console.log('Contract and wallet initialized. Sending transaction...');
    
    const tx = await contract.updatePlayerData(address, kills, deaths);
    console.log(`Transaction sent. Waiting for confirmation... Hash: ${tx.hash}`);
    
    await tx.wait();
    console.log('Victory recorded on-chain!', tx.hash);
  } catch (error) {
      console.error('Full error details on server:', error);
      // Re-throw a generic error to the client to avoid leaking details.
      throw new Error('Failed to record victory on-chain. Please check server logs for details.');
  }
}
