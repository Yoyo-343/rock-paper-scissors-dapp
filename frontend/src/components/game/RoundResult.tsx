import React from 'react';
import { Move } from '../../pages/Game';

interface RoundResultProps {
  playerMove: Move;
  opponentMove: Move;
  winner: 'player' | 'opponent' | 'tie';
  onNextRound: () => void;
}

const RoundResult: React.FC<RoundResultProps> = ({
  playerMove,
  opponentMove,
  winner,
  onNextRound
}) => {
  const getMoveIcon = (move: Move) => {
    const icons = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️'
    };
    return icons[move];
  };

  const getResultText = () => {
    if (winner === 'tie') return 'It\'s a Tie!';
    if (winner === 'player') return 'You Win!';
    return 'You Lose!';
  };

  const getResultColor = () => {
    if (winner === 'tie') return 'text-cyber-amber';
    if (winner === 'player') return 'text-green-400';
    return 'text-red-400';
  };

  return (
    <div className="text-center animate-fade-in-up">
      <div className="cyber-card p-8 max-w-2xl mx-auto">
        <h2 className={`text-3xl font-bold mb-6 neon-text ${getResultColor()}`}>
          {getResultText()}
        </h2>
        
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="text-5xl mb-2">{getMoveIcon(playerMove)}</div>
            <div className="text-lg font-semibold text-cyber-orange">You</div>
            <div className="text-sm text-muted-foreground capitalize">{playerMove}</div>
          </div>
          
          <div className="text-center">
            <div className="text-5xl mb-2">{getMoveIcon(opponentMove)}</div>
            <div className="text-lg font-semibold text-cyber-red">Opponent</div>
            <div className="text-sm text-muted-foreground capitalize">{opponentMove}</div>
          </div>
        </div>
        
        <button
          onClick={onNextRound}
          className="cyber-button px-8 py-3"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default RoundResult; 