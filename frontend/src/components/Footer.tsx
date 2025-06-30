
import React from 'react';
import { ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  const contractAddress = "0x742d35Cc6634C0532925a3b8D438Cc3d28D3f4f1";

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
            <button className="text-cyber-orange hover:text-cyber-orange/80 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
