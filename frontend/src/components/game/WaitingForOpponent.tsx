import React from 'react';
import { Move } from '../../pages/Game';

interface WaitingForOpponentProps {
  playerMove: Move;
}

const WaitingForOpponent: React.FC<WaitingForOpponentProps> = ({ playerMove }) => {
  const getMoveIcon = (move: Move) => {
    const icons = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️'
    };
    return icons[move];
  };

  return (
    <div className="text-center animate-fade-in-up">
      <div className="cyber-card p-8 max-w-md mx-auto">
        <div className="mb-6">
          <div className="text-6xl mb-4">{getMoveIcon(playerMove)}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Move Selected!</h2>
          <p className="text-muted-foreground">Waiting for opponent to choose...</p>
        </div>
        
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-cyber-orange rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-cyber-orange rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-cyber-orange rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default WaitingForOpponent; 