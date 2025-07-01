import React from 'react';
import { Users, Clock } from 'lucide-react';

const GameQueue: React.FC = () => {
  return (
    <div className="text-center animate-fade-in-up">
      <div className="cyber-card p-8 max-w-md mx-auto">
        <div className="mb-6">
          <Users className="w-16 h-16 text-cyber-orange mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Finding Opponent</h2>
          <p className="text-muted-foreground">Searching for another player...</p>
        </div>
        
        <div className="flex items-center justify-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-cyber-orange" />
          <span className="text-cyber-orange font-medium">Estimated wait: 30s</span>
        </div>
        
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-cyber-orange rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-cyber-orange rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-cyber-orange rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default GameQueue; 