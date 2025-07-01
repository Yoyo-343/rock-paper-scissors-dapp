import React from 'react';
import { Trophy, Home, Coins } from 'lucide-react';

interface GameCompleteProps {
  winner: 'player' | 'opponent';
  playerScore: number;
  opponentScore: number;
  onComplete: () => void;
  entryFeeStrk?: string;
}

const GameComplete: React.FC<GameCompleteProps> = ({
  winner,
  playerScore,
  opponentScore,
  onComplete,
  entryFeeStrk = "2.0000"
}) => {
  const isWinner = winner === 'player';
  // Calculate prize: 75% of 2 players' entry fees (1.5 STRK if entry is 1 STRK each)
  const totalEntryFees = parseFloat(entryFeeStrk) * 2;
  const prizeStrk = (totalEntryFees * 0.75).toFixed(4);
  const prizeAmount = isWinner ? `${prizeStrk} STRK` : '0 STRK';

  return (
    <div className="text-center animate-fade-in-up">
      <div className="cyber-card p-8 max-w-lg mx-auto">
        <div className="mb-6">
          {isWinner ? (
            <Trophy className="w-16 h-16 text-cyber-gold mx-auto mb-4" />
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="text-4xl">😞</div>
            </div>
          )}
          
          <h2 className={`text-3xl font-bold mb-2 neon-text ${
            isWinner ? 'text-cyber-gold' : 'text-red-400'
          }`}>
            {isWinner ? 'Victory!' : 'Defeat!'}
          </h2>
          
          <p className="text-muted-foreground mb-4">
            Final Score: {playerScore} - {opponentScore}
          </p>
        </div>
        
        {isWinner && (
          <div className="bg-cyber-gold/10 border border-cyber-gold/30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-cyber-gold" />
              <span className="text-cyber-gold font-semibold">Prize Won!</span>
            </div>
            <div className="text-2xl font-bold text-cyber-gold">{prizeAmount}</div>
            <div className="text-sm text-muted-foreground">
              (75% of entry fees)
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {isWinner && (
            <button className="cyber-button w-full py-3">
              <Coins className="w-5 h-5 mr-2" />
              Claim Prize
            </button>
          )}
          
          <button
            onClick={onComplete}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-muted/20 border border-muted/40 rounded-lg text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameComplete; 