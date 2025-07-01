import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRockPaperScissorsContract, Move, GameStatus } from '../hooks/useRockPaperScissorsContract';
import GameQueue from '../components/game/GameQueue';
import MoveSelection from '../components/game/MoveSelection';
import WaitingForOpponent from '../components/game/WaitingForOpponent';
import RoundResult from '../components/game/RoundResult';
import GameComplete from '../components/game/GameComplete';
import CountdownTimer from '../components/game/CountdownTimer';
import FloatingSymbols from '../components/FloatingSymbols';

const Game = () => {
  const navigate = useNavigate();
  const {
    gameStatus,
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
    joinQueue,
    commitMove,
    claimPrize,
    resetGame,
    continueToNextRound,
    MOVE_TIMEOUT_SECONDS
  } = useRockPaperScissorsContract();

  // Handle move selection
  const handleMoveSelect = (move: Move) => {
    commitMove(move);
  };

  // Handle game completion
  const handleGameComplete = () => {
    resetGame();
    navigate('/');
  };

  // Handle claiming prize and starting new game
  const handleClaimAndNewGame = async () => {
    await claimPrize();
    navigate('/');
  };

  // Handle timeout when opponent doesn't move in time
  const handleMoveTimeout = () => {
    console.log('⏰ Opponent move timeout');
    // In a real implementation, this would trigger a win condition for the player
  };

  // Auto-join queue when component mounts
  React.useEffect(() => {
    // Since user reached this page by clicking "Play Now", wallet should be connected
    // Add a small delay to allow connection state to stabilize after page navigation
    const timer = setTimeout(() => {
      if (gameStatus === 'idle') {
        console.log('🎮 Auto-joining matchmaking queue...');
        joinQueue();
      }
    }, 500); // Small delay to ensure connection state is ready

    return () => clearTimeout(timer);
  }, [gameStatus, joinQueue]);

  // Backup: If connection is detected and still in idle state, join queue
  React.useEffect(() => {
    if (isConnected && gameStatus === 'idle') {
      console.log('🔗 Connection confirmed, ensuring queue join...');
      joinQueue();
    }
  }, [isConnected, gameStatus, joinQueue]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <FloatingSymbols />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">

          {/* Show error if exists */}
          {error && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400">
                <span className="text-sm font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Queue state - looking for opponent */}
          {(gameStatus === 'idle' || gameStatus === 'in_queue') && (
            <GameQueue />
          )}
          
          {/* Matched - time to commit move */}
          {gameStatus === 'committing' && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-cyber-orange mb-4">Round {currentRound}</h2>
                {opponentName && (
                  <p className="text-cyber-blue text-lg mb-4">
                    You are playing against <span className="text-cyber-gold font-bold">{opponentName}</span>
                  </p>
                )}
                <div className="text-cyber-amber mb-4">
                  <p>Score: <span className="text-cyber-green font-bold">{playerWins}</span> - <span className="text-cyber-red font-bold">{opponentWins}</span></p>
                  <p className="text-sm">First to 3 wins!</p>
                </div>
              </div>
              
              {/* Countdown timer for move */}
              {moveTimeoutStart > 0 && (
                <div className="mb-6 max-w-xs mx-auto">
                  <CountdownTimer
                    startTime={moveTimeoutStart}
                    timeoutSeconds={MOVE_TIMEOUT_SECONDS}
                    onTimeout={handleMoveTimeout}
                    label="Time to make your move"
                  />
                </div>
              )}
              
              <MoveSelection onMoveSelect={handleMoveSelect} />
            </div>
          )}
          
          {/* Revealing phase */}
          {gameStatus === 'revealing' && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-cyber-orange mb-4">Round {currentRound}</h2>
                {opponentName && (
                  <p className="text-cyber-blue text-lg">
                    Waiting for <span className="text-cyber-gold font-bold">{opponentName}</span> to reveal their move...
                  </p>
                )}
              </div>
              {playerMove && <WaitingForOpponent playerMove={playerMove} />}
            </div>
          )}

          {/* Round result */}
          {gameStatus === 'round_result' && playerMove && opponentMove && lastRoundWinner && (
            <div className="fixed inset-0 z-50">
              <RoundResult
                playerMove={playerMove}
                opponentMove={opponentMove}
                roundWinner={lastRoundWinner}
                playerWins={playerWins}
                opponentWins={opponentWins}
                currentRound={currentRound}
                opponentName={opponentName}
                onContinue={continueToNextRound}
              />
            </div>
          )}
          
          {/* Game completed */}
          {gameStatus === 'completed' && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-cyber-green mb-4">Game Complete!</h2>
                <div className="mb-4">
                  <p className="text-cyber-blue text-lg">Final Score:</p>
                  <p className="text-2xl font-bold">
                    <span className="text-cyber-green">{playerWins}</span> - <span className="text-cyber-red">{opponentWins}</span>
                  </p>
                </div>
                {playerWins >= 3 ? (
                  <>
                    <p className="text-cyber-green text-xl mb-2">🎉 You Won the Game! 🎉</p>
                    <p className="text-cyber-gold">You can now claim your prize!</p>
                  </>
                ) : (
                  <>
                    <p className="text-cyber-red text-xl mb-2">😔 You Lost the Game</p>
                    <p className="text-cyber-blue">Better luck next time!</p>
                  </>
                )}
              </div>
              <div className="space-y-4">
                {playerWins >= 3 && (
                  <button
                    onClick={handleClaimAndNewGame}
                    disabled={isLoading}
                    className="cyber-button text-xl px-8 py-4 bg-cyber-green/20 border-cyber-green text-cyber-green hover:bg-cyber-green/30"
                  >
                    {isLoading ? 'Claiming Prize...' : 'Claim Prize & Play Again'}
                  </button>
                )}
                <button
                  onClick={handleGameComplete}
                  className="cyber-button text-lg px-6 py-3 ml-4"
                >
                  {playerWins >= 3 ? 'Exit Game' : 'Play Again'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Game; 