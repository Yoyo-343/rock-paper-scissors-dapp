import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { useAccount } from '@starknet-react/core';
import { useRockPaperScissorsContract } from '../hooks/useRockPaperScissorsContract';

// Components
import FloatingSymbols from '../components/FloatingSymbols';
import Footer from '../components/Footer';
import GameQueue from '../components/game/GameQueue';
import WaitingForOpponent from '../components/game/WaitingForOpponent';
import MoveSelection from '../components/game/MoveSelection';
import RoundResult from '../components/game/RoundResult';
import GameComplete from '../components/game/GameComplete';
import CountdownTimer from '../components/game/CountdownTimer';

// Types
import { Move } from '../hooks/useRockPaperScissorsContract';

const Game = () => {
  const navigate = useNavigate();
  const { account, address, isConnected } = useAccount();
  
  const {
    gameStatus,
    playerMove,
    opponentMove,
    playerWins,
    opponentWins,
    currentRound,
    gameWinner,
    lastRoundWinner,
    opponentName,
    error,
    joinQueue,
    submitMove,
    forfeitGame,
    moveTimeoutStart,
  } = useRockPaperScissorsContract();

  // Enhanced session validation
  const hasValidSession = useMemo(() => {
    return !!(account && address && isConnected);
  }, [account, address, isConnected]);

  // Handle move selection
  const handleMoveSelect = (move: Move) => {
    submitMove(move);
  };

  // Handle game completion
  const handleGameComplete = () => {
    forfeitGame();
    navigate('/');
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/');
  };

  // Enhanced session validation - redirect to homepage if no valid session
  useEffect(() => {
    if (!hasValidSession) {
      console.log('❌ No valid Cartridge session detected, redirecting to homepage...');
      navigate('/', { replace: true });
      return;
    }
    
    console.log('✅ Valid Cartridge session detected in Game component:', {
      account: !!account,
      address: !!address,
      isConnected
    });
  }, [hasValidSession, navigate, account, address, isConnected]);

  // Auto-join queue when session is valid and game is idle
  useEffect(() => {
    if (hasValidSession && gameStatus === 'idle' && !error) {
      console.log('🎮 Valid session and idle state - auto-joining queue...');
      const timer = setTimeout(() => {
        joinQueue();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasValidSession, gameStatus, joinQueue, error]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <FloatingSymbols />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">

          {/* Show error if any contract calls fail */}
          {error && (
            <div className="text-center mb-8">
              <div className="inline-flex flex-col items-center gap-4 px-6 py-4 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 max-w-md mx-auto">
                <span className="text-sm font-medium">Error: {error}</span>
                <div className="flex gap-2">
                  {hasValidSession ? (
                    <button
                      onClick={() => joinQueue()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium"
                    >
                      Try Again
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/', { replace: true })}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium"
                    >
                      Create Session
                    </button>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded font-medium"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="cyber-button-secondary px-4 py-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </button>
          </div>

          {/* Game Status Display */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyber-gold" />
                <span className="text-cyber-gold font-semibold">You: {playerWins}</span>
              </div>
              <div className="text-2xl font-bold text-cyber-orange">Round {currentRound}</div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyber-purple" />
                <span className="text-cyber-purple font-semibold">Opponent: {opponentWins}</span>
              </div>
            </div>
          </div>

          {/* Game State Components */}
          {gameStatus === 'queue' && (
            <GameQueue />
          )}

          {gameStatus === 'waiting_for_opponent' && (
            <WaitingForOpponent playerMove={playerMove || 'rock'} />
          )}

          {gameStatus === 'selecting_move' && (
            <div className="space-y-6">
              <div className="text-center">
                <CountdownTimer 
                  startTime={moveTimeoutStart} 
                  timeoutSeconds={30}
                  onTimeout={() => forfeitGame()}
                />
              </div>
              <MoveSelection onMoveSelect={handleMoveSelect} />
            </div>
          )}

          {gameStatus === 'round_result' && (
            <RoundResult 
              playerMove={playerMove!}
              opponentMove={opponentMove!}
              roundWinner={lastRoundWinner === 'draw' ? 'tie' : lastRoundWinner!}
              playerWins={playerWins}
              opponentWins={opponentWins}
              currentRound={currentRound}
              opponentName={opponentName}
              onContinue={() => {
                // The contract hook will automatically transition to the next round
              }}
            />
          )}

          {gameStatus === 'game_complete' && (
            <GameComplete 
              winner={gameWinner === 'draw' ? 'player' : gameWinner!}
              playerScore={playerWins}
              opponentScore={opponentWins}
              onComplete={handleGameComplete}
            />
          )}

          {/* Fallback for unknown states */}
          {gameStatus === 'idle' && (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="w-16 h-16 border-4 border-cyber-blue/30 border-t-cyber-blue rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-cyber-blue mb-2">
                  {hasValidSession ? 'Joining Matchmaking...' : 'Validating Session...'}
                </h2>
                <p className="text-muted-foreground">
                  {hasValidSession ? 'Connecting to the game queue...' : 'Checking Cartridge Controller session...'}
                </p>
                {hasValidSession && (
                  <p className="text-xs text-cyber-blue/70 mt-2">
                    Session: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Handle unexpected states */}
          {!['idle', 'queue', 'waiting_for_opponent', 'selecting_move', 'waiting_for_reveal', 'round_result', 'game_complete'].includes(gameStatus) && (
            <div className="text-center">
              <div className="inline-flex flex-col items-center gap-4 px-6 py-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400 max-w-md mx-auto">
                <span className="text-sm font-medium">Unknown game state: {gameStatus}</span>
                <button 
                  onClick={() => {
                    joinQueue();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium"
                >
                  Restart Game
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Game; 