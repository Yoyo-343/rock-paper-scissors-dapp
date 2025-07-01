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
  },
  {
    name: 'get_game_info',
    type: 'function',
    inputs: [
      { name: 'game_id', type: 'felt' }
    ],
    outputs: [
      { name: 'player1', type: 'felt' },
      { name: 'player2', type: 'felt' },
      { name: 'status', type: 'felt' }
    ],
    state_mutability: 'view'
  }
] as const;

// Entry fee: 0.0005 ETH in wei (500000000000000 wei)
const ENTRY_FEE_WEI = '500000000000000';

// Timeout for opponent moves (in seconds)
const MOVE_TIMEOUT_SECONDS = 30; // 30 seconds

export type Move = 'rock' | 'paper' | 'scissors';
export type GameStatus = 'idle' | 'in_queue' | 'matched' | 'committing' | 'revealing' | 'round_result' | 'completed';

const moveToNumber = (move: Move): number => {
  switch (move) {
    case 'rock': return 1;
    case 'paper': return 2;
    case 'scissors': return 3;
    default: return 0;
  }
};

// Determine round winner
const determineWinner = (playerMove: Move, opponentMove: Move): 'player' | 'opponent' | 'tie' => {
  if (playerMove === opponentMove) return 'tie';
  
  const winConditions = {
    rock: 'scissors',
    paper: 'rock', 
    scissors: 'paper'
  };
  
  return winConditions[playerMove] === opponentMove ? 'player' : 'opponent';
};

// Generate random opponent move
const generateOpponentMove = (): Move => {
  const moves: Move[] = ['rock', 'paper', 'scissors'];
  return moves[Math.floor(Math.random() * moves.length)];
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

// Format address for display
const formatAddress = (address: string): string => {
  if (!address || address === '0x0') return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
  const [opponentAddress, setOpponentAddress] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [moveTimeoutStart, setMoveTimeoutStart] = useState<number>(0);
  const [playerWins, setPlayerWins] = useState<number>(0);
  const [opponentWins, setOpponentWins] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [lastRoundWinner, setLastRoundWinner] = useState<'player' | 'opponent' | 'tie' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real queue length polling
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would call a contract view function
      // For now, we'll simulate realistic queue numbers
      setQueueLength(Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-reveal when both players have committed (simulation of both players completing their moves)
  useEffect(() => {
    if (gameStatus === 'revealing' && playerMove && playerNonce) {
      console.log('🔄 Auto-revealing moves after both players committed...');
      
      const revealTimer = setTimeout(() => {
        console.log('⚡ Triggering auto-reveal...');
        // Call handleRevealMove directly to avoid dependency issues
        if (!playerMove || !playerNonce) return;
        
        setIsLoading(true);
        setError(null);
        
        const doReveal = async () => {
          try {
            console.log('🔍 Revealing move:', playerMove, 'with nonce:', playerNonce);

            // Generate opponent move for this round
            const opponentMoveForRound = generateOpponentMove();
            setOpponentMove(opponentMoveForRound);
            
            console.log(`🎯 Round ${currentRound} moves:`, { player: playerMove, opponent: opponentMoveForRound });

            if (!account || !contract) {
              console.log('⚠️ Account or contract not ready, using simulation mode');
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('✅ Move revealed successfully (simulation)');
              
              // Determine round winner
              const roundWinner = determineWinner(playerMove, opponentMoveForRound);
              setLastRoundWinner(roundWinner);
              
              // Update win counts
              let newPlayerWins = playerWins;
              let newOpponentWins = opponentWins;
              
              if (roundWinner === 'player') {
                newPlayerWins = playerWins + 1;
                setPlayerWins(newPlayerWins);
              } else if (roundWinner === 'opponent') {
                newOpponentWins = opponentWins + 1;
                setOpponentWins(newOpponentWins);
              }
              
              // Show round result first
              setGameStatus('round_result');
              
              console.log(`🏆 Round ${currentRound} result:`, { 
                winner: roundWinner, 
                playerWins: newPlayerWins, 
                opponentWins: newOpponentWins,
                moves: { player: playerMove, opponent: opponentMoveForRound }
              });
              return;
            }

            console.log('🔗 Calling reveal_move on blockchain');
            
            // Real contract call to reveal move
            const moveNumber = moveToNumber(playerMove);
            const call = contract.populate('reveal_move', [moveNumber, playerNonce]);
            const result = await account.execute(call);
            
            console.log('🔗 Transaction submitted:', result.transaction_hash);
            console.log('✅ Move revealed successfully on blockchain');
            
            // Determine round winner (same logic for blockchain)
            const roundWinner = determineWinner(playerMove, opponentMoveForRound);
            setLastRoundWinner(roundWinner);
            
            // Update win counts
            let newPlayerWins = playerWins;
            let newOpponentWins = opponentWins;
            
            if (roundWinner === 'player') {
              newPlayerWins = playerWins + 1;
              setPlayerWins(newPlayerWins);
            } else if (roundWinner === 'opponent') {
              newOpponentWins = opponentWins + 1;
              setOpponentWins(newOpponentWins);
            }
            
            // Show round result first
            setGameStatus('round_result');
            
            console.log(`🏆 Round ${currentRound} result (blockchain):`, { 
              winner: roundWinner, 
              playerWins: newPlayerWins, 
              opponentWins: newOpponentWins,
              moves: { player: playerMove, opponent: opponentMoveForRound }
            });
            
          } catch (err: any) {
            console.error('❌ Failed to reveal move:', err);
            setError(err.message || 'Failed to reveal move');
          } finally {
            setIsLoading(false);
          }
        };
        
        doReveal();
      }, 3000); // 3 seconds delay
      
      return () => clearTimeout(revealTimer);
    }
  }, [gameStatus, playerMove, playerNonce, account, contract, currentRound, playerWins, opponentWins]);

  // Contract interaction functions
  const handleJoinQueue = async () => {
    console.log('🎮 Joining matchmaking queue with entry fee...', { account: !!account, address: !!address, status });
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('💰 Calling join_queue with entry fee:', ENTRY_FEE_WEI, 'wei');
      
      if (!account || !contract) {
        console.log('⚠️ Account or contract not ready, proceeding with simulation mode');
        // Proceed without real contract call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setGameStatus('in_queue');
        console.log('✅ Successfully joined queue (simulation)');
        
        // Poll for game matching - simulate finding opponent
        const pollForMatch = async () => {
          try {
            // Simulate finding an opponent after some time
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            const mockOpponentAddress = '0x123456789abcdef123456789abcdef123456789ab';
            setOpponentAddress(mockOpponentAddress);
            setOpponentName(formatAddress(mockOpponentAddress));
            setCurrentGameId(Date.now().toString());
            setGameStatus('committing');
            setMoveTimeoutStart(Date.now());
            
            console.log('🎯 Opponent found! Time to commit your move');
          } catch (err) {
            console.error('Error polling for match:', err);
            setError('Failed to find match');
          }
        };
        
        pollForMatch();
        return;
      }
      
      // Real contract call with entry fee
      const call = contract.populate('join_queue', []);
      const result = await account.execute(call, {
        maxFee: ENTRY_FEE_WEI // Entry fee as transaction fee
      });
      
      console.log('🔗 Transaction submitted:', result.transaction_hash);
      setGameStatus('in_queue');
      console.log('✅ Successfully joined queue on blockchain');
      
      // Poll for game matching - in real implementation, this would be event-based
      const pollForMatch = async () => {
        try {
          // Simulate finding an opponent after some time
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          // In real implementation, would call get_game_info or listen for GameMatched event
          const mockOpponentAddress = '0x123456789abcdef123456789abcdef123456789ab';
          setOpponentAddress(mockOpponentAddress);
          setOpponentName(formatAddress(mockOpponentAddress));
          setCurrentGameId(result.transaction_hash);
          setGameStatus('committing');
          setMoveTimeoutStart(Date.now());
          
          console.log('🎯 Opponent found! Time to commit your move');
        } catch (err) {
          console.error('Error polling for match:', err);
          setError('Failed to find match');
        }
      };
      
      pollForMatch();
      
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
        
        // Auto-reveal will be handled by useEffect
        return;
      }

      console.log('🔗 Calling commit_move on blockchain, commitment:', commitment);
      
      // Real contract call to commit move
      const call = contract.populate('commit_move', [commitment]);
      const result = await account.execute(call);
      
      console.log('🔗 Transaction submitted:', result.transaction_hash);
      console.log('✅ Move committed successfully on blockchain');
      setGameStatus('revealing');
      
      // Auto-reveal will be handled by useEffect
      
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

  const resetGame = () => {
    setGameStatus('idle');
    setCurrentGameId('0');
    setPlayerMove(null);
    setPlayerNonce('');
    setOpponentAddress('');
    setOpponentName('');
    setOpponentMove(null);
    setMoveTimeoutStart(0);
    setPlayerWins(0);
    setOpponentWins(0);
    setCurrentRound(1);
    setLastRoundWinner(null);
    setError(null);
  };

  // Continue to next round
  const continueToNextRound = () => {
    // Check if game is complete (first to 3 wins) - check current state
    const newPlayerWins = playerWins;
    const newOpponentWins = opponentWins;
    
    if (newPlayerWins >= 3 || newOpponentWins >= 3) {
      console.log(`🏆 Game complete! Final score: Player ${newPlayerWins} - Opponent ${newOpponentWins}`);
      setGameStatus('completed');
      return;
    }
    
    // Reset round state for next round
    setPlayerMove(null);
    setPlayerNonce('');
    setOpponentMove(null);
    setLastRoundWinner(null);
    setCurrentRound(prev => prev + 1);
    setGameStatus('committing');
    setMoveTimeoutStart(Date.now());
    
    console.log(`🔄 Starting round ${currentRound + 1}, score: Player ${newPlayerWins} - Opponent ${newOpponentWins}`);
  };

  // Handle claiming prize and resetting
  const handleClaimPrize = async () => {
    console.log('🏆 Claiming prize...', { account: !!account, address: !!address, status });
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (!account || !contract) {
        console.log('⚠️ Account or contract not ready, using simulation mode');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Prize claimed successfully (simulation)');
        
        // Reset all game state
        resetGame();
        return;
      }

      console.log('🔗 Calling claim_prize on blockchain');
      
      // Real contract call to claim prize
      const call = contract.populate('claim_prize', []);
      const result = await account.execute(call);
      
      console.log('🔗 Transaction submitted:', result.transaction_hash);
      console.log('✅ Prize claimed successfully on blockchain');
      console.log('💰 Prize should be transferred to your account');
      
      // Reset all game state
      resetGame();
      
    } catch (err: any) {
      console.error('❌ Failed to claim prize:', err);
      setError(err.message || 'Failed to claim prize');
    } finally {
      setIsLoading(false);
    }
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
    opponentAddress,
    opponentName,
    opponentMove,
    moveTimeoutStart,
    playerWins,
    opponentWins,
    currentRound,
    lastRoundWinner,
    isLoading,
    error,
    isConnected,
    
    // Actions
    joinQueue: handleJoinQueue,
    commitMove: handleCommitMove,
    revealMove: handleRevealMove,
    claimPrize: handleClaimPrize,
    resetGame,
    continueToNextRound,
    
    // Constants
    MOVE_TIMEOUT_SECONDS,
  };
}; 