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
      <div className="cyber-card p-12 w-[800px] h-[700px] mx-auto relative flex flex-col">
        {/* Round number - absolutely centered */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <p className="text-cyber-blue text-2xl font-bold">Round {currentRound}</p>
        </div>

        {/* Main content - centered vertically in remaining space */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Moves display - perfectly centered */}
          <div className="flex items-center justify-center gap-20 mb-16">
            {/* Player move */}
            <div className="flex flex-col items-center w-32">
              <div className="text-8xl mb-4">{getMoveIcon(playerMove)}</div>
              <p className="text-cyber-gold font-bold text-xl mb-2 text-center">Your Move</p>
              <p className="text-white text-lg capitalize text-center">{playerMove}</p>
            </div>

            {/* VS - perfectly centered */}
            <div className="flex flex-col items-center">
              <div className="text-cyber-orange text-5xl font-bold">VS</div>
            </div>

            {/* Opponent move */}
            <div className="flex flex-col items-center w-32">
              <div className="text-8xl mb-4">{getMoveIcon(opponentMove)}</div>
              <p className="text-cyber-gold font-bold text-xl mb-2 text-center">{opponentName}</p>
              <p className="text-white text-lg capitalize text-center">{opponentMove}</p>
            </div>
          </div>

          {/* Round result - centered */}
          <div className="text-center mb-12">
            <h2 className={`text-4xl font-bold ${getResultColor()}`}>
              {getResultMessage()}
            </h2>
          </div>

          {/* Current score - perfectly centered and aligned */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-16">
              <div className="flex flex-col items-center w-32">
                <p className="text-cyber-blue text-xl font-medium mb-3">You</p>
                <p className="text-cyber-green text-5xl font-bold">{playerWins}</p>
              </div>
              <div className="text-cyber-orange text-4xl font-bold">-</div>
              <div className="flex flex-col items-center w-32">
                <p className="text-cyber-blue text-xl font-medium mb-3">{opponentName}</p>
                <p className="text-cyber-red text-5xl font-bold">{opponentWins}</p>
              </div>
            </div>
            <p className="text-cyber-amber text-lg mt-6 font-medium">First to 3 wins!</p>
          </div>
        </div>

        {/* Auto-advance info - centered at bottom */}
        <div className="text-center pb-4">
          <div className="inline-flex flex-col items-center gap-4">
            <p className="text-cyber-blue text-xl font-medium">
              {playerWins >= 3 || opponentWins >= 3 ? 'Showing final result...' : 'Next round starting in...'}
            </p>
            <div className="text-cyber-orange text-4xl font-bold">{countdown}</div>
            <button
              onClick={onContinue}
              className="cyber-button text-lg px-8 py-3 bg-cyber-blue/20 border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30 transition-all font-medium"
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