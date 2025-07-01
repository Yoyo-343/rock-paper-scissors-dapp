import React from 'react';
import { ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const contractAddress = "0x0638e6d45d476e71044f8e8d7119f6158748bf5bd56018e2f9275c96499c52b9";
  
  const handleVoyagerClick = () => {
    const voyagerUrl = `https://sepolia.voyager.online/contract/${contractAddress}#transactions`;
    window.open(voyagerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-cyber-dark/90 backdrop-blur-sm border-t border-cyber-orange/20 py-4 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Powered by Starknet, Pragma and Cartridge
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Contract:</span>
            <code className="bg-cyber-orange/10 px-2 py-1 rounded text-cyber-orange font-mono">
              {contractAddress}
            </code>
            <button 
              onClick={handleVoyagerClick}
              className="text-cyber-orange hover:text-cyber-orange/80 transition-colors"
              title="View on Voyager"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
