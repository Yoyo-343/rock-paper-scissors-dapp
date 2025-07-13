import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { useDojo } from '../providers/DojoProvider';
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
  
  // Use the new Dojo context for enhanced session management
  const { account, address, isConnected, sessionValid, error: dojoError } = useDojo();
  
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

  // Track session validation state
  const [waitTime, setWaitTime] = useState(0);
  const [hasAttemptedSessionValidation, setHasAttemptedSessionValidation] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Enhanced session validation with Dojo integration
  const hasValidSession = useMemo(() => {
    const isSessionValid = !!(account && address && isConnected && sessionValid);
    
    // Create debug info
    const debug = `Account: ${!!account}, Address: ${!!address}, Connected: ${isConnected}, DojoSession: ${sessionValid}`;
    setDebugInfo(debug);
    
    // Mark that we've attempted validation
    if (!hasAttemptedSessionValidation) {
      setHasAttemptedSessionValidation(true);
      console.log('🔍 First Dojo session validation attempt:', debug);
    }
    
    if (isSessionValid) {
      console.log('✅ Valid Dojo session confirmed:', debug);
    }
    
    return isSessionValid;
  }, [account, address, isConnected, sessionValid, hasAttemptedSessionValidation]);

  // Determine current phase for PhaseIndicator - Enhanced for Dojo
  const getCurrentPhase = (): 1 | 2 | 3 => {
    if (!hasValidSession) return 1; // Checking Dojo session
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

  // Track wait time for session validation
  useEffect(() => {
    if (!hasValidSession) {
      const interval = setInterval(() => {
        setWaitTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset wait time when session is valid
      setWaitTime(0);
    }
  }, [hasValidSession]);

  // More patient session validation - wait 15 seconds before giving up
  useEffect(() => {
    if (!hasValidSession && waitTime >= 15) {
      console.log('❌ No valid Dojo session after 15 seconds, redirecting to homepage');
      console.log('Final debug info:', debugInfo);
      
      navigate('/', { 
        replace: true,
        state: { 
          error: 'Dojo session validation timeout',
          debugInfo: debugInfo 
        }
      });
    }
  }, [hasValidSession, waitTime, navigate, debugInfo]);

  // Auto-join queue when session is valid and game is idle
  useEffect(() => {
    if (hasValidSession && gameStatus === 'idle' && !error && hasAttemptedSessionValidation) {
      console.log('🎮 Valid Dojo session and idle state - auto-joining queue...');
      const timer = setTimeout(() => {
        joinQueue();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasValidSession, gameStatus, joinQueue, error, hasAttemptedSessionValidation]);

  // Debug logging for session state changes
  useEffect(() => {
    console.log('🔍 Dojo session state update:', {
      hasValidSession,
      waitTime,
      gameStatus,
      debugInfo,
      currentPhase,
      dojoError
    });
  }, [hasValidSession, waitTime, gameStatus, debugInfo, currentPhase, dojoError]);

  // Early return for session validation phase - Enhanced for Dojo
  if (!hasValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white overflow-hidden relative">
        <FloatingSymbols />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-purple-500/20">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </button>
          
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400" />
            <span className="text-xl font-bold">Rock Paper Scissors</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-cyber-orange neon-text animate-neon-flicker">
              Connecting to Dojo World
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Please wait while we establish your Dojo session...
            </p>
          </div>

          {/* Enhanced Phase Indicator for Dojo */}
          <div className="mb-8">
            <PhaseIndicator currentPhase={currentPhase} />
            <div className="text-center mt-4">
              <div className="text-sm text-gray-400">
                {currentPhase === 1 && "🔍 Validating Dojo session..."}
                {currentPhase === 2 && "🎯 Searching for opponent..."}
                {currentPhase === 3 && "🚀 Launching game..."}
              </div>
            </div>
          </div>

          {/* Enhanced Debug information */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Dojo Connection Status</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <div>⏱️ Wait time: {waitTime}s / 15s</div>
              <div>📊 {debugInfo}</div>
              <div>🎯 Current phase: {currentPhase}</div>
              {dojoError && <div className="text-red-400">❌ Dojo Error: {dojoError}</div>}
            </div>
          </div>

          {/* Emergency fallback */}
          {waitTime > 10 && (
            <div className="text-center">
              <p className="text-yellow-400 mb-4">
                Dojo connection taking longer than expected...
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Return to Homepage
              </button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    );
  }

  // Main game content (when Dojo session is valid)
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

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-center mb-4">
              <div className="inline-flex flex-col items-center gap-1 px-4 py-2 bg-gray-800/50 border border-gray-600/40 rounded text-xs text-gray-400">
                <div>Game Status: {gameStatus} | Phase: {currentPhase} | Wait: {waitTime}s</div>
                <div>Account: {account ? '✅' : '❌'} | Address: {address ? '✅' : '❌'}</div>
                <div>Connected: {isConnected.toString()} | Session: {sessionValid.toString()}</div>
                <div>Session Tried: {hasAttemptedSessionValidation.toString()}</div>
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
              
              {/* Emergency exit option after 15 seconds */}
              {!hasValidSession && waitTime >= 15 && (
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