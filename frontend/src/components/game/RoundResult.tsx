import React, { useEffect, useState } from 'react';

interface RoundResultProps {
  playerMove: string;
  opponentMove: string;
  roundWinner: 'player' | 'opponent' | 'tie';
  playerWins: number;
  opponentWins: number;
  currentRound: number;
  opponentName: string;
  onContinue: () => void;
}

const RoundResult: React.FC<RoundResultProps> = ({
  playerMove,
  opponentMove,
  roundWinner,
  playerWins,
  opponentWins,
  currentRound,
  opponentName,
  onContinue
}) => {
  const [countdown, setCountdown] = useState(5);

  // Auto-advance after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onContinue]);

  const getMoveIcon = (move: string) => {
    const icons = {
      rock: '✊',
      paper: '✋',
      scissors: '✌️'
    };
    return icons[move as keyof typeof icons] || '❓';
  };

  const getResultMessage = () => {
    if (roundWinner === 'tie') return 'Round Tied!';
    if (roundWinner === 'player') return 'You Won This Round!';
    return `${opponentName} Won This Round!`;
  };

  const getResultColor = () => {
    if (roundWinner === 'tie') return 'text-cyber-amber';
    if (roundWinner === 'player') return 'text-cyber-green';
    return 'text-cyber-red';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="cyber-card p-8 w-full max-w-3xl mx-auto">
        {/* Round number */}
        <div className="text-center mb-8">
          <p className="text-cyber-blue text-2xl font-bold">Round {currentRound}</p>
        </div>

        {/* Moves display - perfectly centered */}
        <div className="flex items-center justify-center gap-16 mb-12">
          {/* Player move */}
          <div className="flex flex-col items-center">
            <div className="text-8xl mb-4">{getMoveIcon(playerMove)}</div>
            <p className="text-cyber-gold font-bold text-xl mb-2">Your Move</p>
            <p className="text-white text-lg capitalize">{playerMove}</p>
          </div>

          {/* VS - perfectly centered */}
          <div className="flex flex-col items-center">
            <div className="text-cyber-orange text-5xl font-bold">VS</div>
          </div>

          {/* Opponent move */}
          <div className="flex flex-col items-center">
            <div className="text-8xl mb-4">{getMoveIcon(opponentMove)}</div>
            <p className="text-cyber-gold font-bold text-xl mb-2">{opponentName}</p>
            <p className="text-white text-lg capitalize">{opponentMove}</p>
          </div>
        </div>

        {/* Round result - centered */}
        <div className="text-center mb-8">
          <h2 className={`text-4xl font-bold ${getResultColor()} mb-6`}>
            {getResultMessage()}
          </h2>
        </div>

        {/* Current score - perfectly centered */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-12 text-2xl">
            <div className="flex flex-col items-center">
              <p className="text-cyber-blue text-lg mb-2">You</p>
              <p className="text-cyber-green text-4xl font-bold">{playerWins}</p>
            </div>
            <div className="text-cyber-orange text-3xl font-bold">-</div>
            <div className="flex flex-col items-center">
              <p className="text-cyber-blue text-lg mb-2">{opponentName}</p>
              <p className="text-cyber-red text-4xl font-bold">{opponentWins}</p>
            </div>
          </div>
          <p className="text-cyber-amber text-lg mt-4">First to 3 wins!</p>
        </div>

        {/* Auto-advance info - centered */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <p className="text-cyber-blue text-lg">
              {playerWins >= 3 || opponentWins >= 3 ? 'Showing final result...' : 'Next round starting in...'}
            </p>
            <div className="text-cyber-orange text-3xl font-bold">{countdown}</div>
            <button
              onClick={onContinue}
              className="cyber-button text-lg px-6 py-3 bg-cyber-blue/20 border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30 transition-all"
            >
              {playerWins >= 3 || opponentWins >= 3 ? 'View Final Result' : 'Skip Wait'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundResult; 