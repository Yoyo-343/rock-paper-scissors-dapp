
import React, { useState, useEffect } from 'react';
import { Zap, Shield, Trophy } from 'lucide-react';
import GameCard from '../components/GameCard';
import PlayButton from '../components/PlayButton';
import StatCard from '../components/StatCard';
import Footer from '../components/Footer';
import FloatingSymbols from '../components/FloatingSymbols';

const Index = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Mock ETH price fetching
  useEffect(() => {
    const fetchEthPrice = async () => {
      setIsLoadingPrice(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Mock ETH price around $2062 (0.000485 ETH ≈ $1.00)
      setEthPrice(2062.34);
      setIsLoadingPrice(false);
    };

    fetchEthPrice();
  }, []);

  const calculateEthAmount = (): string => {
    if (!ethPrice) return '0.000485 ETH';
    return `${(1 / ethPrice).toFixed(6)} ETH`;
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Floating background symbols */}
      <FloatingSymbols />
      
      {/* Header */}
      <header className="text-center py-12 px-4 relative z-10 mb-8">
        <div className="flex justify-center">
          <h1 className="text-8xl font-bold text-cyber-orange neon-text animate-neon-flicker mb-4">
            ROCK PAPER SCISSORS
          </h1>
        </div>
        <div className="flex justify-center">
          <div className="w-80 h-1 bg-gradient-to-r from-transparent via-cyber-orange to-transparent" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4">
        {/* Three Cards Row */}
        <div className="flex justify-center w-full mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl">
            <GameCard
              icon={<Zap className="w-8 h-8 text-cyber-orange" />}
              title="Entry Fee"
              subtitle=""
              value="$1"
              description={isLoadingPrice ? "Loading..." : calculateEthAmount()}
              isLoading={isLoadingPrice}
              gradient="from-cyber-orange/20 to-cyber-red/20"
            />
            
            <GameCard
              icon={<Shield className="w-8 h-8 text-cyber-gold" />}
              title="Game Rules"
              subtitle=""
              value="First to 3 Wins"
              description="No Round Limit"
              gradient="from-cyber-gold/20 to-cyber-amber/20"
            />
            
            <GameCard
              icon={<Trophy className="w-8 h-8 text-cyber-copper" />}
              title="Prize Distribution"
              subtitle=""
              value="75% Winner"
              description="25% Treasury"
              gradient="from-cyber-copper/20 to-cyber-warm/20"
            />
          </div>
        </div>

        {/* Play Now Button */}
        <div className="flex justify-center mb-12">
          <div className="px-16">
            <PlayButton onClick={() => console.log('Navigate to game...')} />
          </div>
        </div>

        {/* Statistics Row */}
        <div className="flex justify-center w-full mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
            <StatCard title="Games Played" value="1,247" />
            <StatCard title="Total Prize Won" value="$3,891" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
