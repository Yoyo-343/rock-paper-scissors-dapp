import React from 'react';

interface GameScoreProps {
  playerScore: number;
  opponentScore: number;
}

const GameScore: React.FC<GameScoreProps> = ({ playerScore, opponentScore }) => {
  return (
    <div className="text-center mb-8">
      <div className="cyber-card p-4 max-w-md mx-auto">
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyber-orange">{playerScore}</div>
            <div className="text-sm text-muted-foreground">You</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-white">First to 3</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-cyber-red">{opponentScore}</div>
            <div className="text-sm text-muted-foreground">Opponent</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScore; 