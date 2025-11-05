import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

interface ScoreRequest {
  winner: string;
  loser: string;
  score: string;
  duration: number;
}

export async function POST(req: NextRequest) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body: ScoreRequest = await req.json();
    const { winner, loser, score, duration } = body;

    // Validate required fields
    if (!winner || !loser || !score || duration === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['winner', 'loser', 'score', 'duration'],
        },
        { status: 400, headers }
      );
    }

    // Validate duration is a number
    if (typeof duration !== 'number' || duration < 0) {
      return NextResponse.json(
        {
          error: 'Duration must be a positive number',
        },
        { status: 400, headers }
      );
    }

    // Get environment variables
    const privateKey = process.env.SERVER_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const rpcUrl = process.env.NEXT_PUBLIC_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';

    if (!privateKey) {
      console.error('SERVER_PRIVATE_KEY not set');
      return NextResponse.json(
        {
          error: 'Server configuration error',
        },
        { status: 500, headers }
      );
    }

    if (!contractAddress) {
      console.error('NEXT_PUBLIC_CONTRACT_ADDRESS not set');
      return NextResponse.json(
        {
          error: 'Contract address not configured',
        },
        { status: 500, headers }
      );
    }

    // Initialize wallet and provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Contract ABI (minimal - only the function we need)
    const contractABI = [
      'function recordScore(string memory _winner, string memory _loser, string memory _score, uint256 _duration) public',
    ];

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // Call the contract function
    const tx = await contract.recordScore(winner, loser, score, duration);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Return transaction hash
    return NextResponse.json(
      {
        success: true,
        txHash: receipt.hash,
      },
      { headers }
    );
  } catch (error: any) {
    console.error('Error submitting score:', error);

    // Handle specific error types
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        {
          error: 'Insufficient funds for transaction',
        },
        { status: 400, headers }
      );
    }

    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'Network error. Please try again later.',
        },
        { status: 503, headers }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to submit score',
        message: error.message || 'Unknown error',
      },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
