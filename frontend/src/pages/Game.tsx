import React, { useEffect, useMemo, useState } from 'react';
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
import PhaseIndicator from '../components/game/PhaseIndicator';

// Types
import { Move } from '../hooks/useRockPaperScissorsContract';

const Game = () => {
  const navigate = useNavigate();
  const { account, address, isConnected, status } = useAccount();
  
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

  // Track how long we've been waiting for session
  const [waitTime, setWaitTime] = useState(0);

  // Simplified session check - just account existence
  const hasSession = !!account;

  // Determine current phase based on session and game state
  const getCurrentPhase = (): 1 | 2 | 3 => {
    if (!hasSession) return 1; // Checking Cartridge Controller session
    if (gameStatus === 'idle' || gameStatus === 'queue') return 2; // Finding an opponent
    return 3; // Launching game
  };

  const currentPhase = getCurrentPhase();

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

  // Track wait time and only redirect after 10 seconds of no session
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Much more patient session validation - wait 10 seconds before giving up
  useEffect(() => {
    if (!hasSession && waitTime >= 10) {
      console.log('❌ No session after 10 seconds, redirecting to homepage');
      navigate('/', { replace: true });
    }
  }, [hasSession, waitTime, navigate]);

  // Auto-join queue when session exists and game is idle
  useEffect(() => {
    if (hasSession && gameStatus === 'idle' && !error) {
      console.log('🎮 Session exists and idle state - auto-joining queue...');
      const timer = setTimeout(() => {
        joinQueue();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasSession, gameStatus, joinQueue, error]);

  // Debug logging for session state changes
  useEffect(() => {
    console.log('🔍 Game component session state:', {
      account: !!account,
      address: !!address,
      isConnected,
      status,
      hasSession,
      waitTime,
      gameStatus,
      currentPhase
    });
  }, [account, address, isConnected, status, hasSession, waitTime, gameStatus, currentPhase]);

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
                  {hasSession ? (
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

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-center mb-4">
              <div className="inline-flex flex-col items-center gap-1 px-4 py-2 bg-gray-800/50 border border-gray-600/40 rounded text-xs text-gray-400">
                <div>Game Status: {gameStatus} | Phase: {currentPhase} | Wait: {waitTime}s</div>
                <div>Account: {account ? '✅' : '❌'} | Address: {address ? '✅' : '❌'}</div>
                <div>Connected: {isConnected.toString()} | Status: {status}</div>
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

          {/* Show Phase Indicator for setup phases */}
          {(gameStatus === 'idle' || gameStatus === 'queue') && (
            <div className="text-center mb-8">
              <PhaseIndicator currentPhase={currentPhase} />
              
              {/* Emergency exit option after 10 seconds */}
              {!hasSession && waitTime >= 10 && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/', { replace: true })}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium"
                  >
                    Return to Homepage
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Game Status Display - only show when in active game */}
          {!['idle', 'queue'].includes(gameStatus) && (
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
          )}

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