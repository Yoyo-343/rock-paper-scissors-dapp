import { useState, useEffect } from 'react';
import { useAccount } from '@starknet-react/core';

const RPS_CONTRACT_ADDRESS = "0x0638e6d45d476e71044f8e8d7119f6158748bf5bd56018e2f9275c96499c52b9";

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
    // More lenient connection check - user should be connected if they reached this page
    if (!account && !address) {
      console.log('Connection status:', { account: !!account, address: !!address, status });
      setError('Connection issue detected. Please refresh the page and try again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🎮 Joining matchmaking queue...');
      
      // Simulate joining queue and matching with opponent
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGameStatus('in_queue');
      console.log('✅ Successfully joined queue');
      
      // Simulate finding opponent after 3 seconds
      setTimeout(() => {
        setGameStatus('committing');
        setCurrentGameId(Date.now().toString());
        console.log('🎯 Opponent found! Time to commit your move');
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Failed to join queue:', err);
      setError(err.message || 'Failed to join queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitMove = async (move: Move) => {
    if (!account && !address) {
      console.log('Connection status:', { account: !!account, address: !!address, status });
      setError('Connection issue detected. Please refresh the page and try again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🎯 Committing move:', move);
      
      const nonce = generateNonce();
      const commitment = generateCommitment(move, nonce);
      
      setPlayerMove(move);
      setPlayerNonce(nonce);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Move committed successfully, commitment:', commitment);
      setGameStatus('revealing');
      
      // Auto-proceed to reveal after 2 seconds
      setTimeout(() => {
        handleRevealMove();
      }, 2000);
      
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
      console.log('🔍 Revealing move:', playerMove);
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Move revealed successfully');
      setGameStatus('completed');
      
      // Show result and allow prize claim
      setTimeout(() => {
        console.log('🏆 Game completed! You can claim your prize');
      }, 1000);
      
    } catch (err: any) {
      console.error('❌ Failed to reveal move:', err);
      setError(err.message || 'Failed to reveal move');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimPrize = async () => {
    if (!account && !address) {
      console.log('Connection status:', { account: !!account, address: !!address, status });
      setError('Connection issue detected. Please refresh the page and try again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🏆 Claiming prize...');
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Prize claimed successfully');
      
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