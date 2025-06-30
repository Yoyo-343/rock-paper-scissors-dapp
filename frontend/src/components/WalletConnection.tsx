
import React from 'react';
import { Wallet, Check } from 'lucide-react';

interface WalletConnectionProps {
  isConnected: boolean;
  walletAddress: string;
  onConnect: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({
  isConnected,
  walletAddress,
  onConnect
}) => {
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-4">
      {isConnected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">
            Connected: {formatAddress(walletAddress)}
          </span>
        </div>
      )}
      
      <button
        onClick={onConnect}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
          isConnected
            ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
            : 'bg-cyber-orange/20 border border-cyber-orange/40 text-cyber-orange hover:bg-cyber-orange/30 hover:shadow-[0_0_20px_rgba(255,107,53,0.3)]'
        }`}
      >
        <Wallet className="w-4 h-4" />
        {isConnected ? 'Disconnect' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default WalletConnection;
