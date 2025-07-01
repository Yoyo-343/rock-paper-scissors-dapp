import React from 'react';

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
    <div className="text-center animate-fade-in-up">
      <div className="cyber-card p-8 max-w-2xl mx-auto">
        {/* Round number */}
        <div className="mb-6">
          <p className="text-cyber-blue text-lg">Round {currentRound}</p>
        </div>

        {/* Moves display */}
        <div className="flex justify-around items-center mb-8">
          {/* Player move */}
          <div className="text-center">
            <div className="text-6xl mb-2">{getMoveIcon(playerMove)}</div>
            <p className="text-cyber-gold font-bold">Your Move</p>
            <p className="text-white capitalize">{playerMove}</p>
          </div>

          {/* VS */}
          <div className="text-cyber-orange text-4xl font-bold">VS</div>

          {/* Opponent move */}
          <div className="text-center">
            <div className="text-6xl mb-2">{getMoveIcon(opponentMove)}</div>
            <p className="text-cyber-gold font-bold">{opponentName}</p>
            <p className="text-white capitalize">{opponentMove}</p>
          </div>
        </div>

        {/* Round result */}
        <div className="mb-6">
          <h2 className={`text-3xl font-bold ${getResultColor()} mb-4`}>
            {getResultMessage()}
          </h2>
        </div>

        {/* Current score */}
        <div className="mb-8">
          <div className="flex justify-center gap-8 text-xl">
            <div className="text-center">
              <p className="text-cyber-blue">You</p>
              <p className="text-cyber-green text-3xl font-bold">{playerWins}</p>
            </div>
            <div className="text-cyber-orange text-2xl">-</div>
            <div className="text-center">
              <p className="text-cyber-blue">{opponentName}</p>
              <p className="text-cyber-red text-3xl font-bold">{opponentWins}</p>
            </div>
          </div>
          <p className="text-cyber-amber text-sm mt-2">First to 3 wins!</p>
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="cyber-button text-xl px-8 py-4 bg-cyber-blue/20 border-cyber-blue text-cyber-blue hover:bg-cyber-blue/30"
        >
          {playerWins >= 3 || opponentWins >= 3 ? 'View Final Result' : 'Next Round'}
        </button>
      </div>
    </div>
  );
};

export default RoundResult; 