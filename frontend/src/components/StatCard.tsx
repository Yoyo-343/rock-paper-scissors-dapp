
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="cyber-card p-4 text-center">
      <div className="relative z-10">
        <div className="text-lg font-bold text-cyber-orange neon-text mb-1">
          {value}
        </div>
        <div className="text-sm text-muted-foreground">
          {title}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
