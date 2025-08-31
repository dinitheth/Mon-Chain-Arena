'use server';

import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import type { PlayerRecord } from "@/types/game";
import { contractAbi } from './contract-abi';

const CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz/';
const LEADERBOARD_API_URL = 'https://monad-games-id-site.vercel.app/api/leaderboard?gameId=246&sortBy=scores';

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
    const response = await fetch(LEADERBOARD_API_URL, { next: { revalidate: 60 } });

    if (!response.ok) {
      console.error('Failed to fetch leaderboard:', response.status, response.statusText);
      return [];
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Expected JSON but received non-JSON response from leaderboard API:', textResponse);
      throw new Error('Invalid response format from leaderboard API.');
    }
    
    const responseData = await response.json();

    const leaderboardData = responseData.data;

    if (!Array.isArray(leaderboardData)) {
      console.error("Leaderboard data is not an array as expected. Received:", responseData);
      return [];
    }
    
    return leaderboardData.slice(0, 10).map((player: any) => ({
        address: player.walletAddress,
        name: player.username,
        kills: player.score,
        gamesPlayed: player.transactions || 0 // The API doesn't provide this, so we default to 0
    }));
  } catch (error) {
    console.error('Error fetching or processing leaderboard:', error);
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
  } catch (error: any) {
    console.error('An error occurred while recording victory on-chain. Full error details:', error);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
        console.error('Admin wallet has insufficient funds to send the transaction.');
        throw new Error('Server wallet out of funds. Please contact support.');
    }
    
    throw new Error('Failed to record victory on-chain. Please check server logs for details.');
  }
}
