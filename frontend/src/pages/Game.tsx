import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRockPaperScissorsContract, Move, GameStatus } from '../hooks/useRockPaperScissorsContract';
import GameQueue from '../components/game/GameQueue';
import MoveSelection from '../components/game/MoveSelection';
import WaitingForOpponent from '../components/game/WaitingForOpponent';
import GameComplete from '../components/game/GameComplete';
import FloatingSymbols from '../components/FloatingSymbols';

const Game = () => {
  const navigate = useNavigate();
  const {
    gameStatus,
    queueLength,
    playerMove,
    isLoading,
    error,
    isConnected,
    joinQueue,
    commitMove,
    claimPrize,
    resetGame
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

  // Auto-join queue when component mounts and wallet is connected
  React.useEffect(() => {
    // Wait for connection to be established before joining
    if (isConnected && gameStatus === 'idle') {
      console.log('🔗 Wallet connected, joining queue...');
      joinQueue();
    }
  }, [isConnected, gameStatus, joinQueue]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <FloatingSymbols />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {/* Show connection status */}
          {!isConnected && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-amber/20 border border-cyber-amber/40 rounded-lg text-cyber-amber">
                <span className="text-sm font-medium">⚠️ Establishing connection...</span>
              </div>
            </div>
          )}

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
                <h2 className="text-4xl font-bold text-cyber-orange mb-4">Opponent Found!</h2>
                <p className="text-cyber-blue">Choose your move and commit it to the blockchain</p>
              </div>
                             <MoveSelection onMoveSelect={handleMoveSelect} />
            </div>
          )}
          
          {/* Revealing phase */}
          {gameStatus === 'revealing' && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-cyber-orange mb-4">Move Committed!</h2>
                <p className="text-cyber-blue">Your move: <span className="text-cyber-gold font-bold">{playerMove}</span></p>
                <p className="text-cyber-amber">Revealing move automatically...</p>
              </div>
              {playerMove && <WaitingForOpponent playerMove={playerMove} />}
            </div>
          )}
          
          {/* Game completed */}
          {gameStatus === 'completed' && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-cyber-green mb-4">Game Complete!</h2>
                <p className="text-cyber-blue">Your move was revealed successfully</p>
                <p className="text-cyber-gold">You can now claim your prize!</p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={handleClaimAndNewGame}
                  disabled={isLoading}
                  className="cyber-button text-xl px-8 py-4 bg-cyber-green/20 border-cyber-green text-cyber-green hover:bg-cyber-green/30"
                >
                  {isLoading ? 'Claiming Prize...' : 'Claim Prize & Play Again'}
                </button>
                <button
                  onClick={handleGameComplete}
                  className="cyber-button text-lg px-6 py-3 ml-4"
                >
                  Exit Game
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