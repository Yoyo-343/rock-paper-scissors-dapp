import React from 'react';
import { Move } from '../../pages/Game';

interface MoveSelectionProps {
  onMoveSelect: (move: Move) => void;
}

const MoveSelection: React.FC<MoveSelectionProps> = ({ onMoveSelect }) => {
  const moves = [
    { name: 'rock', icon: '✊', label: 'ROCK' },
    { name: 'paper', icon: '✋', label: 'PAPER' },
    { name: 'scissors', icon: '✌️', label: 'SCISSORS' }
  ];

  return (
    <div className="text-center animate-fade-in-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-cyber-orange neon-text mb-2">Choose Your Move</h2>
        <p className="text-muted-foreground">Select Rock, Paper, or Scissors</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {moves.map((move) => (
          <button
            key={move.name}
            onClick={() => onMoveSelect(move.name as Move)}
            className="cyber-card p-8 hover:scale-105 transition-all duration-300 group"
          >
            <div className="text-6xl mb-4">{move.icon}</div>
            <div className="text-xl font-bold text-white group-hover:text-cyber-orange transition-colors">
              {move.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MoveSelection; 