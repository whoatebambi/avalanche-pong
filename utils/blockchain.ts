import { ethers } from 'ethers';

export interface ScoreRecord {
  winner: string;
  loser: string;
  score: string;
  duration: number;
  txHash: string;
  timestamp: number;
  submitterAddress: string;
}

// Contract ABI for event querying
const CONTRACT_ABI = [
  'event ScoreRecorded(address indexed submitterAddress, string winner, string loser, string score, uint256 duration, uint256 timestamp)',
];

/**
 * Get the Avalanche Subnets Explorer URL for a transaction hash
 */
export function getAvalancheExplorerUrl(hash: string): string {
  // Using official Avalanche Subnets Explorer for Fuji testnet
  return `https://subnets-test.avax.network/c-chain/tx/${hash}`;
}

/**
 * Fetch the latest block number from Avalanche Fuji
 */
export async function getLatestBlock(): Promise<number> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    return blockNumber;
  } catch (error) {
    console.error('Error fetching latest block:', error);
    throw error;
  }
}

/**
 * Fetch the last 10 ScoreRecorded events from the contract
 */
export async function fetchScoreHistory(): Promise<ScoreRecord[]> {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const rpcUrl = process.env.NEXT_PUBLIC_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';

    if (!contractAddress) {
      console.error('NEXT_PUBLIC_CONTRACT_ADDRESS not set');
      return [];
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

    // Get the latest block number
    const latestBlock = await provider.getBlockNumber();
    
    // Query events from the last 2000 blocks (RPC limit is 2048 blocks)
    // At ~1.6 seconds per block, this covers approximately 53 minutes of transactions
    // This is optimal for serverless functions: fast, single query, within limits
    const fromBlock = Math.max(0, latestBlock - 2000);

    // Query ScoreRecorded events
    const filter = contract.filters.ScoreRecorded();
    const events = await contract.queryFilter(filter, fromBlock, latestBlock);

    // Parse events and sort by block number (newest first)
    const records: ScoreRecord[] = events
      .map((event) => {
        // Check if event has args (EventLog type)
        if (!('args' in event) || !event.args) return null;

        return {
          submitterAddress: event.args[0] as string,
          winner: event.args[1] as string,
          loser: event.args[2] as string,
          score: event.args[3] as string,
          duration: Number(event.args[4]),
          timestamp: Number(event.args[5]),
          txHash: event.transactionHash,
        };
      })
      .filter((record): record is ScoreRecord => record !== null)
      .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp, newest first
      .slice(0, 10); // Get last 10

    return records;
  } catch (error) {
    console.error('Error fetching score history:', error);
    return [];
  }
}

/**
 * Submit a score to the blockchain via the API endpoint
 */
export async function submitScore(
  winner: string,
  loser: string,
  score: string,
  duration: number
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const endpoint = apiUrl ? `${apiUrl}/api/submit-score` : '/api/submit-score';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        winner,
        loser,
        score,
        duration,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit score',
      };
    }

    return {
      success: true,
      txHash: data.txHash,
    };
  } catch (error: any) {
    console.error('Error submitting score:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}
