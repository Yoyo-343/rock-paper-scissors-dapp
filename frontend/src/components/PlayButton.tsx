import React from 'react';
import { Play, Wallet } from 'lucide-react';

interface PlayButtonProps {
  onClick: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
}

const PlayButton: React.FC<PlayButtonProps> = ({ 
  onClick, 
  isConnected = false, 
  isConnecting = false 
}) => {
  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>INITIALIZING CONTROLLER...</span>
          <span className="text-sm opacity-75">(Click to cancel)</span>
        </>
      );
    }
    
    if (isConnected) {
      return (
        <>
          <Play className="w-6 h-6" />
          <span>ENTER ARENA</span>
        </>
      );
    }
    
    return (
      <>
        <Wallet className="w-6 h-6" />
        <span>PLAY NOW</span>
      </>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={false}
      className="cyber-button text-xl px-40 py-5 group relative overflow-hidden"
    >
      <div className="flex items-center gap-3 relative z-10">
        {getButtonContent()}
      </div>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyber-blue/20 via-cyber-purple/20 to-cyber-orange/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Pulse effect */}
      <div className="absolute inset-0 rounded-lg animate-glow-pulse" />
    </button>
  );
};

export default PlayButton;
