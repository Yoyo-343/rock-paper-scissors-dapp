import React, { useEffect } from 'react';
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
  const { account, address } = useAccount();
  
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

  // Session validation - redirect to homepage if no account
  useEffect(() => {
    if (!account) {
      console.log('❌ No Cartridge session detected, redirecting to homepage...');
      navigate('/', { replace: true });
      return;
    }
    
    console.log('✅ Cartridge session detected:', {
      account: !!account,
      address: account?.address,
    });
  }, [account, navigate]);

  // Enhanced auto-join logic - only join if account exists
  useEffect(() => {
    if (account && gameStatus === 'idle' && !error) {
      console.log('🎮 Account available, auto-joining queue...');
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        console.log('🎮 Attempting to join matchmaking queue...');
        joinQueue();
      }, 1500); // Slightly longer delay for stability
      
      return () => clearTimeout(timer);
    }
  }, [account, gameStatus, joinQueue, error]);

  // Debug logging
  useEffect(() => {
    console.log('🎮 Game state debug:', {
      gameStatus,
      playerWins,
      opponentWins,
      currentRound,
      error,
      playerMove,
      opponentMove
    });
  }, [gameStatus, playerWins, opponentWins, currentRound, error, playerMove, opponentMove]);

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
                  {account ? (
                    <button
                      onClick={() => {
                        console.log('🔄 Manual retry - attempting to join queue...');
                        joinQueue();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium"
                    >
                      Try Again
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        console.log('🏠 No session - redirecting to homepage...');
                        navigate('/', { replace: true });
                      }}
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

          {/* Debug info - remove in production */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800/50 border border-gray-600/40 rounded text-xs text-gray-400">
              <span>Debug: Status = {gameStatus}</span>
            </div>
          </div>

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
                  onTimeout={() => {
                    console.log('⏰ Move selection timeout');
                    forfeitGame();
                  }}
                />
              </div>
              <MoveSelection onMoveSelect={handleMoveSelect} />
            </div>
          )}

          {gameStatus === 'waiting_for_reveal' && (
            <div className="text-center">
              <div className="animate-pulse">
                <Zap className="w-16 h-16 text-cyber-orange mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-cyber-orange mb-2">Waiting for opponent...</h2>
                <p className="text-muted-foreground">Your move: <span className="text-cyber-orange font-semibold capitalize">{playerMove}</span></p>
              </div>
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
                console.log('📈 Continuing to next round...');
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
                  {account ? 'Joining Matchmaking...' : 'Checking Session...'}
                </h2>
                <p className="text-muted-foreground">
                  {account ? 'Connecting to the game queue...' : 'Validating Cartridge Controller session...'}
                </p>
                {account && (
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
              <div className="inline-flex flex-col items-center gap-4 px-6 py-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400">
                <h3 className="text-lg font-semibold">Unknown Game State</h3>
                <p className="text-sm">Status: {gameStatus}</p>
                <button 
                  onClick={() => {
                    console.log('🔄 Attempting to rejoin queue...');
                    joinQueue();
                  }}
                  className="cyber-button text-sm px-4 py-2"
                >
                  Try to Join Queue
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