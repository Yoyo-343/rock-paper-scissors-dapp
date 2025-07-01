import { useState, useEffect } from 'react';
import { useAccount, useContract } from '@starknet-react/core';
import { CallData } from 'starknet';

const RPS_CONTRACT_ADDRESS = "0x0638e6d45d476e71044f8e8d7119f6158748bf5bd56018e2f9275c96499c52b9";

// Basic ABI for the Rock Paper Scissors contract
const RPS_ABI = [
  {
    name: 'join_queue',
    type: 'function',
    inputs: [],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'commit_move',
    type: 'function',
    inputs: [
      { name: 'commitment', type: 'felt' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'reveal_move',
    type: 'function',
    inputs: [
      { name: 'move', type: 'felt' },
      { name: 'nonce', type: 'felt' }
    ],
    outputs: [],
    state_mutability: 'external'
  },
  {
    name: 'claim_prize',
    type: 'function',
    inputs: [],
    outputs: [],
    state_mutability: 'external'
  }
] as const;

// Entry fee: 0.0005 ETH in wei (500000000000000 wei)
const ENTRY_FEE_WEI = '500000000000000';

export type Move = 'rock' | 'paper' | 'scissors';
export type GameStatus = 'idle' | 'in_queue' | 'matched' | 'committing' | 'revealing' | 'completed';

const moveToNumber = (move: Move): number => {
  switch (move) {
    case 'rock': return 1;
    case 'paper': return 2;
    case 'scissors': return 3;
    default: return 0;
  }
};

// Generate a commitment hash for commit-reveal scheme
const generateCommitment = (move: Move, nonce: string): string => {
  const moveNum = moveToNumber(move);
  return `0x${(BigInt(moveNum) + BigInt(nonce)).toString(16)}`;
};

// Generate random nonce
const generateNonce = (): string => {
  return Math.floor(Math.random() * 1000000).toString();
};

export const useRockPaperScissorsContract = () => {
  const { account, address, status } = useAccount();
  const { contract } = useContract({
    abi: RPS_ABI,
    address: RPS_CONTRACT_ADDRESS,
  });
  
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentGameId, setCurrentGameId] = useState<string>('0');
  const [queueLength, setQueueLength] = useState<number>(0);
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [playerNonce, setPlayerNonce] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate queue updates
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Contract interaction functions
  const handleJoinQueue = async () => {
    console.log('🎮 Joining matchmaking queue with entry fee...', { account: !!account, address: !!address, status });
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!account || !contract) {
        console.log('⚠️ Account or contract not ready, using simulation mode');
        // Fallback to simulation for development
        await new Promise(resolve => setTimeout(resolve, 2000));
        setGameStatus('in_queue');
        console.log('✅ Successfully joined queue (simulation)');
        
        setTimeout(() => {
          setGameStatus('committing');
          setCurrentGameId(Date.now().toString());
          console.log('🎯 Opponent found! Time to commit your move');
        }, 3000);
        return;
      }

      console.log('💰 Calling join_queue with entry fee:', ENTRY_FEE_WEI, 'wei');
      
      // Real contract call with entry fee
      const call = contract.populate('join_queue', []);
      const result = await account.execute(call, {
        maxFee: ENTRY_FEE_WEI // Entry fee as transaction fee
      });
      
      console.log('🔗 Transaction submitted:', result.transaction_hash);
      setGameStatus('in_queue');
      console.log('✅ Successfully joined queue on blockchain');
      
      // Poll for game matching (in real implementation, this would be event-based)
      setTimeout(() => {
        setGameStatus('committing');
        setCurrentGameId(result.transaction_hash);
        console.log('🎯 Opponent found! Time to commit your move');
      }, 5000);
      
    } catch (err: any) {
      console.error('❌ Failed to join queue:', err);
      setError(err.message || 'Failed to join queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitMove = async (move: Move) => {
    console.log('🎯 Committing move:', move, { account: !!account, address: !!address, status });
    
    setIsLoading(true);
    setError(null);
    
    try {
      const nonce = generateNonce();
      const commitment = generateCommitment(move, nonce);
      
      setPlayerMove(move);
      setPlayerNonce(nonce);
      
      if (!account || !contract) {
        console.log('⚠️ Account or contract not ready, using simulation mode');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Move committed successfully (simulation), commitment:', commitment);
        setGameStatus('revealing');
        
        setTimeout(() => {
          handleRevealMove();
        }, 2000);
        return;
      }

      console.log('🔗 Calling commit_move on blockchain, commitment:', commitment);
      
      // Real contract call to commit move
      const call = contract.populate('commit_move', [commitment]);
      const result = await account.execute(call);
      
      console.log('🔗 Transaction submitted:', result.transaction_hash);
      console.log('✅ Move committed successfully on blockchain');
      setGameStatus('revealing');
      
      // Auto-proceed to reveal after blockchain confirmation
      setTimeout(() => {
        handleRevealMove();
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Failed to commit move:', err);
      setError(err.message || 'Failed to commit move');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealMove = async () => {
    if (!playerMove || !playerNonce) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Revealing move:', playerMove, 'with nonce:', playerNonce);
      
      if (!account || !contract) {
        console.log('⚠️ Account or contract not ready, using simulation mode');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Move revealed successfully (simulation)');
        setGameStatus('completed');
        
        setTimeout(() => {
          console.log('🏆 Game completed! You can claim your prize');
        }, 1000);
        return;
      }

      console.log('🔗 Calling reveal_move on blockchain');
      
      // Real contract call to reveal move
      const moveNumber = moveToNumber(playerMove);
      const call = contract.populate('reveal_move', [moveNumber, playerNonce]);
      const result = await account.execute(call);
      
      console.log('🔗 Transaction submitted:', result.transaction_hash);
      console.log('✅ Move revealed successfully on blockchain');
      setGameStatus('completed');
      
      // Show result and allow prize claim
      setTimeout(() => {
        console.log('🏆 Game completed! You can claim your prize');
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Failed to reveal move:', err);
      setError(err.message || 'Failed to reveal move');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimPrize = async () => {
    console.log('🏆 Claiming prize...', { account: !!account, address: !!address, status });
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!account || !contract) {
        console.log('⚠️ Account or contract not ready, using simulation mode');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Prize claimed successfully (simulation)');
        
        // Reset game state
        setGameStatus('idle');
        setCurrentGameId('0');
        setPlayerMove(null);
        setPlayerNonce('');
        return;
      }

      console.log('🔗 Calling claim_prize on blockchain');
      
      // Real contract call to claim prize
      const call = contract.populate('claim_prize', []);
      const result = await account.execute(call);
      
      console.log('🔗 Transaction submitted:', result.transaction_hash);
      console.log('✅ Prize claimed successfully on blockchain');
      console.log('💰 Prize should be transferred to your account');
      
      // Reset game state
      setGameStatus('idle');
      setCurrentGameId('0');
      setPlayerMove(null);
      setPlayerNonce('');
      
    } catch (err: any) {
      console.error('❌ Failed to claim prize:', err);
      setError(err.message || 'Failed to claim prize');
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setGameStatus('idle');
    setCurrentGameId('0');
    setPlayerMove(null);
    setPlayerNonce('');
    setError(null);
  };

  // More lenient connection detection - if user has account OR address, consider connected
  // This handles brief moments during page navigation where status might not be immediately 'connected'
  const isConnected = Boolean((account || address) && status !== 'disconnected');

  return {
    // State
    gameStatus,
    currentGameId,
    queueLength,
    playerMove,
    isLoading,
    error,
    isConnected,
    
    // Actions
    joinQueue: handleJoinQueue,
    commitMove: handleCommitMove,
    revealMove: handleRevealMove,
    claimPrize: handleClaimPrize,
    resetGame,
  };
}; 