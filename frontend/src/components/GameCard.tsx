
import React from 'react';

interface GameCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  description: string;
  isLoading?: boolean;
  gradient: string;
}

const GameCard: React.FC<GameCardProps> = ({
  icon,
  title,
  subtitle,
  value,
  description,
  isLoading = false,
  gradient
}) => {
  return (
    <div className="cyber-card p-4 max-w-[280px] w-full mx-auto animate-fade-in-up">
      {/* Gradient overlay */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-20`} />
      
      <div className="relative z-10">
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white/10 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="loading-spinner" />
              <span className="text-xl font-bold text-cyber-orange">Loading...</span>
            </div>
          ) : (
            <div className="text-xl font-bold text-cyber-orange neon-text">
              {value}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-muted-foreground text-sm">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="loading-spinner opacity-60" />
              <span>Fetching price...</span>
            </div>
          ) : (
            description
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
