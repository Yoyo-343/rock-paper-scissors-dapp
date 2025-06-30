
import React from 'react';
import { Play } from 'lucide-react';

interface PlayButtonProps {
  onClick: () => void;
}

const PlayButton: React.FC<PlayButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="cyber-button text-xl px-40 py-5 group relative overflow-hidden"
    >
      <div className="flex items-center gap-3 relative z-10">
        <Play className="w-6 h-6" />
        <span>PLAY NOW</span>
      </div>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 via-cyber-purple/20 to-cyber-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-lg animate-glow-pulse" />
    </button>
  );
};

export default PlayButton;
