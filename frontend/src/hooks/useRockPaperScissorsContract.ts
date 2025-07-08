import { useState, useEffect, useCallback, useMemo } from 'react';
import { Contract, RpcProvider, CallData, shortString, uint256 } from 'starknet';
import { useAccount, useConnect } from '@starknet-react/core';
import { ControllerConnector } from '@cartridge/connector';

// Game types
export type Move = 'rock' | 'paper' | 'scissors';
export type Winner = 'player' | 'opponent' | 'draw';
export type GameStatus = 'idle' | 'queue' | 'waiting_for_opponent' | 'selecting_move' | 'waiting_for_reveal' | 'round_result' | 'game_complete';

// Contract configuration
const CONTRACT_ADDRESS = "0x0638e6d45d476e71044f8e8d7119f6158748bf5bd56018e2f9275c96499c52b9";
const PROVIDER_URL = "https://starknet-sepolia.public.blastapi.io/rpc/v0_7";

// Move timeout in seconds (2 minutes)
export const MOVE_TIMEOUT_SECONDS = 120;

// Real ABI for the Rock Paper Scissors contract
const ABI = [
  {
    "name": "join_queue",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "commit_move",
    "type": "function",
    "inputs": [
      {"name": "game_id", "type": "core::integer::u256"},
      {"name": "round", "type": "core::integer::u8"},
      {"name": "move_hash", "type": "core::felt252"}
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "reveal_move",
    "type": "function",
    "inputs": [
      {"name": "game_id", "type": "core::integer::u256"},
      {"name": "round", "type": "core::integer::u8"},
      {"name": "move", "type": "core::integer::u8"},
      {"name": "salt", "type": "core::felt252"}
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "claim_prize",
    "type": "function",
    "inputs": [
      {"name": "game_id", "type": "core::integer::u256"}
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "get_game_info",
    "type": "function",
    "inputs": [
      {"name": "game_id", "type": "core::integer::u256"}
    ],
    "outputs": [
      {"type": "(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress, core::integer::u8, core::integer::u8, core::integer::u8, core::integer::u64, core::integer::u256, core::starknet::contract_address::ContractAddress)"}
    ],
    "state_mutability": "view"
  },
  {
    "name": "is_player_in_game",
    "type": "function",
    "inputs": [
      {"name": "player", "type": "core::starknet::contract_address::ContractAddress"}
    ],
    "outputs": [
      {"type": "core::bool"}
    ],
    "state_mutability": "view"
  },
  {
    "name": "get_queue_length",
    "type": "function",
    "inputs": [],
    "outputs": [
      {"type": "core::integer::u32"}
    ],
    "state_mutability": "view"
  },
  {
    "name": "get_total_games_played",
    "type": "function",
    "inputs": [],
    "outputs": [
      {"type": "core::integer::u256"}
    ],
    "state_mutability": "view"
  }
];

// Move encoding for contract calls
const MOVE_ENCODING = {
  'rock': 1,
  'paper': 2,
  'scissors': 3
} as const;

const MOVE_DECODING = {
  1: 'rock',
  2: 'paper',
  3: 'scissors'
} as const;

export const useRockPaperScissorsContract = () => {
  // Get connectors to access Cartridge Controller directly
  const { connectors } = useConnect();
  const { address } = useAccount(); // Still use this for address
  
  // Find the Cartridge Controller - use stable approach to avoid initialization issues
  const cartridgeConnector = useMemo(() => {
    const connector = connectors.find(connector => connector instanceof ControllerConnector);
    return connector;
  }, [connectors]);
  
  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [queueLength, setQueueLength] = useState<number>(0);
  const [playerMove, setPlayerMove] = useState<Move | null>(null);
  const [opponentAddress, setOpponentAddress] = useState<string>('');
  const [opponentName, setOpponentName] = useState<string>('');
  const [opponentMove, setOpponentMove] = useState<Move | null>(null);
  const [moveTimeoutStart, setMoveTimeoutStart] = useState<number>(0);
  const [playerWins, setPlayerWins] = useState<number>(0);
  const [opponentWins, setOpponentWins] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [lastRoundWinner, setLastRoundWinner] = useState<Winner | null>(null);
  const [gameWinner, setGameWinner] = useState<Winner | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMoveHash, setPendingMoveHash] = useState<string | null>(null);
  const [pendingSalt, setPendingSalt] = useState<string | null>(null);

  // Create read-only provider for queries (memoized to prevent re-renders)
  const readProvider = useMemo(() => new RpcProvider({ nodeUrl: PROVIDER_URL }), []);
  const readContract = useMemo(() => new Contract(ABI, CONTRACT_ADDRESS, readProvider), [readProvider]);

  // Helper function to get account from Cartridge Controller with proper connection validation
  const getCartridgeAccount = useCallback(async () => {
    if (!cartridgeConnector) {
      throw new Error('Cartridge Controller not found');
    }
    
    // Try to get the account, with retry logic if it fails
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const account = await cartridgeConnector.account(readProvider);
        return account;
      } catch (accountError) {
        lastError = accountError;
        
        // If not the last attempt, try to reconnect
        if (attempt < 3) {
          try {
            await cartridgeConnector.connect();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (connectError) {
            // Continue to next attempt
          }
        }
      }
    }
    
    // If all attempts failed, throw the last error
    const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error';
    throw new Error(`Failed to access Cartridge Controller: ${errorMessage}. Please refresh the page and try again.`);
  }, [cartridgeConnector, readProvider]);

  // Helper function to generate move hash
  const generateMoveHash = (move: Move, salt: string) => {
    // This is a simplified hash - in production, use proper Poseidon hashing
    const moveNum = MOVE_ENCODING[move];
    // Generate a simple hash by combining move and salt
    return `0x${moveNum.toString(16)}${salt}`;
  };

  // Helper function to generate random salt
  const generateSalt = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Fetch queue length
  const fetchQueueLength = useCallback(async () => {
    try {
      const result = await readContract.get_queue_length();
      setQueueLength(Number(result));
    } catch (error) {
      console.error('Failed to fetch queue length:', error);
      setQueueLength(0);
    }
  }, [readContract]);

  // Check if player is in game
  const checkPlayerInGame = useCallback(async () => {
    if (!address) return false;
    
    try {
      const result = await readContract.is_player_in_game(address);
      return result;
    } catch (error) {
      console.error('Failed to check if player is in game:', error);
      return false;
    }
  }, [address, readContract]);

  // Fetch game info
  const fetchGameInfo = useCallback(async (gameId: string) => {
    try {
      const result = await readContract.get_game_info(gameId);
      // result is tuple: (player1, player2, player1_wins, player2_wins, current_round, last_activity, prize_pool, winner)
      const [player1, player2, player1Wins, player2Wins, round, lastActivity, prizePool, winner] = result;
      
      return {
        player1: player1.toString(),
        player2: player2.toString(),
        player1Wins: Number(player1Wins),
        player2Wins: Number(player2Wins),
        currentRound: Number(round),
        lastActivity: Number(lastActivity),
        prizePool: prizePool.toString(),
        winner: winner.toString()
      };
    } catch (error) {
      console.error('Failed to fetch game info:', error);
      return null;
    }
  }, [readContract]);

  // Polling for game state updates - simplified to reduce re-renders
  useEffect(() => {
    if (!address || gameStatus === 'idle') return;

    const pollGameState = async () => {
      try {
        // Only poll if we have an active game
        if (currentGameId) {
          const gameInfo = await fetchGameInfo(currentGameId);
          if (gameInfo) {
            const isPlayer1 = gameInfo.player1.toLowerCase() === address.toLowerCase();
            const playerWins = isPlayer1 ? gameInfo.player1Wins : gameInfo.player2Wins;
            const opponentWins = isPlayer1 ? gameInfo.player2Wins : gameInfo.player1Wins;
            
            setPlayerWins(playerWins);
            setOpponentWins(opponentWins);
            setCurrentRound(gameInfo.currentRound);
            
            // Set opponent info
            const opponentAddr = isPlayer1 ? gameInfo.player2 : gameInfo.player1;
            setOpponentAddress(opponentAddr);
            setOpponentName(`Player ${opponentAddr.slice(0, 6)}...${opponentAddr.slice(-4)}`);
            
            // Update game status
            if (gameInfo.winner !== '0x0') {
              setGameStatus('game_complete');
              setGameWinner(gameInfo.winner.toLowerCase() === address.toLowerCase() ? 'player' : 'opponent');
            }
          }
        }
      } catch (error) {
        console.error('Error polling game state:', error);
      }
    };

    // Only poll every 5 seconds to reduce load
    const interval = setInterval(pollGameState, 5000);
    return () => clearInterval(interval);
  }, [address, currentGameId, gameStatus, fetchGameInfo]);

  // Initial queue length fetch - once on mount
  useEffect(() => {
    fetchQueueLength();
  }, [fetchQueueLength]);

  const joinQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user has an address (session) first
      if (!address) {
        throw new Error('No active Cartridge Controller session. Please return to homepage and create a session first.');
      }
      
      // Get account directly from Cartridge Controller
      const account = await getCartridgeAccount();
      
      // Real contract call to join queue
      const result = await account.execute({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'join_queue',
        calldata: []
      });
      
      // Wait for transaction to be accepted
      await readProvider.waitForTransaction(result.transaction_hash);
      
      setGameStatus('queue');
      
      // Start polling for game start
      const pollForGame = async () => {
        const inGame = await checkPlayerInGame();
        if (inGame) {
          // Player found a game - need to get game ID
          // For now, we'll use a placeholder game ID
          setCurrentGameId('1'); // This would need to be fetched from contract events
          setGameStatus('selecting_move');
          setMoveTimeoutStart(Date.now());
        } else {
          // Still in queue, continue polling
          setTimeout(pollForGame, 2000);
        }
      };
      
      setTimeout(pollForGame, 2000);
      
    } catch (error: unknown) {
      console.error('❌ Failed to join queue:', error);
      // More helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('account') || errorMessage.includes('Cartridge')) {
        setError('Cartridge Controller session issue - please refresh and try again');
      } else {
        setError(errorMessage || 'Failed to join queue');
      }
    } finally {
      setIsLoading(false);
    }
  }, [getCartridgeAccount, checkPlayerInGame, readProvider]);

  const submitMove = useCallback(async (move: Move) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🎯 Submitting move:', move);
      
      // Get account directly from Cartridge Controller
      const account = await getCartridgeAccount();
      
      if (!currentGameId) {
        throw new Error('No active game');
      }
      
      // Generate salt and hash for commit-reveal
      const salt = generateSalt();
      const moveHash = generateMoveHash(move, salt);
      
      // Store for reveal phase
      setPendingMoveHash(moveHash);
      setPendingSalt(salt);
      setPlayerMove(move);
      
      // Real contract call to commit move
      const result = await account.execute({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'commit_move',
        calldata: CallData.compile([currentGameId, currentRound, moveHash])
      });
      
      console.log('Move commit transaction:', result.transaction_hash);
      
      // Wait for transaction
      await readProvider.waitForTransaction(result.transaction_hash);
      
      setGameStatus('waiting_for_reveal');
      console.log('✅ Move committed successfully');
      
      // Auto-reveal after a short delay (in real game, this would be triggered by game state)
      setTimeout(async () => {
        try {
          const revealResult = await account.execute({
            contractAddress: CONTRACT_ADDRESS,
            entrypoint: 'reveal_move',
            calldata: CallData.compile([currentGameId, currentRound, MOVE_ENCODING[move], salt])
          });
          
          console.log('Move reveal transaction:', revealResult.transaction_hash);
          await readProvider.waitForTransaction(revealResult.transaction_hash);
          
          console.log('✅ Move revealed successfully');
          setGameStatus('waiting_for_opponent');
          
        } catch (revealError) {
          console.error('❌ Failed to reveal move:', revealError);
          setError('Failed to reveal move');
        }
      }, 2000);
      
    } catch (error: unknown) {
      console.error('❌ Failed to submit move:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage || 'Failed to submit move');
    } finally {
      setIsLoading(false);
    }
  }, [getCartridgeAccount, currentGameId, currentRound, readProvider]);

  const forfeitGame = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🏳️ Forfeiting game...');
      
      // Reset game state immediately (no contract call needed for forfeit)
      setGameStatus('idle');
      setCurrentGameId(null);
      setPlayerMove(null);
      setOpponentMove(null);
      setOpponentAddress('');
      setOpponentName('');
      setPlayerWins(0);
      setOpponentWins(0);
      setCurrentRound(1);
      setLastRoundWinner(null);
      setGameWinner(null);
      setPendingMoveHash(null);
      setPendingSalt(null);
      
      console.log('✅ Game forfeited locally');
      
    } catch (error: unknown) {
      console.error('❌ Failed to forfeit game:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage || 'Failed to forfeit game');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const claimPrize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🏆 Claiming prize...');
      
      // Get account directly from Cartridge Controller
      const account = await getCartridgeAccount();
      
      if (!currentGameId) {
        throw new Error('No active game');
      }
      
      // Real contract call to claim prize
      const result = await account.execute({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'claim_prize',
        calldata: CallData.compile([currentGameId])
      });
      
      console.log('Prize claim transaction:', result.transaction_hash);
      
      // Wait for transaction
      await readProvider.waitForTransaction(result.transaction_hash);
      
      console.log('✅ Prize claimed successfully');
      
    } catch (error: unknown) {
      console.error('❌ Failed to claim prize:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage || 'Failed to claim prize');
    } finally {
      setIsLoading(false);
    }
  }, [getCartridgeAccount, currentGameId, readProvider]);

  return {
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
    gameWinner,
    isLoading,
    error,
    joinQueue,
    submitMove,
    forfeitGame,
    claimPrize
  };
}; 