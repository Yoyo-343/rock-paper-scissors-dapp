import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, Shield, Trophy, Play, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { ControllerConnector } from '@cartridge/connector';
import { useRockPaperScissorsContract } from '../hooks/useRockPaperScissorsContract';
import GameCard from '../components/GameCard';
import StatCard from '../components/StatCard';
import Footer from '../components/Footer';
import FloatingSymbols from '../components/FloatingSymbols';
import { Button } from '../components/ui/button';

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use standard starknet-react hooks
  const { account, address, status } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Use proper Cartridge Controller detection
  const controllerConnector = useMemo(
    () => ControllerConnector.fromConnectors(connectors),
    [connectors],
  );
  
  const { queueLength } = useRockPaperScissorsContract();
  const [strkPrice, setStrkPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [entryFeeStrk, setEntryFeeStrk] = useState<string>("0");

  // Derived state - use simple account check
  const isConnected = !!account;
  const isLoading = status === 'connecting' || status === 'reconnecting';

  // Auto-navigate when account becomes available with detailed debugging
  useEffect(() => {
    console.log('🔍 Navigation useEffect triggered:', {
      account: !!account,
      address: account?.address,
      status,
      isConnected,
      timestamp: new Date().toISOString()
    });
    
    if (account && account.address) {
      console.log('🎯 Account with address detected! Starting navigation...');
      console.log('📊 Full account details:', {
        account: account,
        address: account.address,
        hasAccount: !!account
      });
      
      // Small delay to ensure account is fully ready, then navigate
      const navigationTimer = setTimeout(() => {
        console.log('🚀 Executing navigation to /game');
        navigate('/game');
      }, 1000); // Increased delay to 1 second for better debugging
      
      return () => {
        console.log('🧹 Cleaning up navigation timer');
        clearTimeout(navigationTimer);
      };
    } else if (account) {
      console.log('⚠️ Account exists but no address:', {
        account: !!account,
        address: account?.address
      });
    } else {
      console.log('❌ No account detected');
    }
  }, [account, account?.address, status, navigate]);

  // Debug: Watch for all state changes
  useEffect(() => {
    console.log('🔄 State change detected:', {
      account: !!account,
      address: account?.address,
      status,
      isConnected,
      isConnecting: status === 'connecting',
      isReconnecting: status === 'reconnecting',
      timestamp: new Date().toISOString()
    });
  }, [account, status, isConnected]);

  // Load STRK price on mount
  useEffect(() => {
    const fetchStrkPrice = async () => {
      try {
        setIsLoadingPrice(true);
        const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=STRK');
        const data = await response.json();
        const strkPriceUsd = parseFloat(data.data.rates.USD);
        setStrkPrice(strkPriceUsd);
        
        // Calculate entry fee in STRK (assuming $1 entry fee)
        const entryFeeInStrk = (1 / strkPriceUsd).toFixed(4);
        setEntryFeeStrk(entryFeeInStrk);
      } catch (error) {
        console.error('Failed to fetch STRK price:', error);
        setStrkPrice(null);
        setEntryFeeStrk("0");
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchStrkPrice();
  }, []);

  // Clean connection handler using proper Cartridge Controller detection with debugging
  const handlePlayClick = useCallback(async () => {
    console.log('🎮 Play Now clicked! Current state:', {
      account: !!account,
      address: account?.address,
      status,
      controllerConnector: !!controllerConnector,
      connectorReady: controllerConnector?.ready
    });
    
    // If already connected, proceed directly to game
    if (account) {
      console.log('✅ Already has account, navigating directly to game');
      navigate('/game');
      return;
    }

    // Otherwise popup controller
    console.log('🔗 Opening Cartridge Controller popup...');
    try {
      const result = await connect({ connector: controllerConnector });
      console.log('🎯 Connect result:', result);
    } catch (error) {
      console.error('❌ Connect failed:', error);
    }
  }, [account, controllerConnector, connect, navigate, status]);

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Disconnecting...');
      await disconnect();
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error: unknown) {
      console.error('❌ Failed to disconnect:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect. Please refresh the page.",
        variant: "destructive",
      });
    }
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

      {/* Session Status */}
      {isConnected && address && (
        <div className="text-center mb-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Session Active: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
            </span>
            <button
              onClick={handleDisconnect}
              className="ml-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
      


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
              description={isLoadingPrice ? "Loading..." : `${entryFeeStrk} STRK`}
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
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handlePlayClick}
                size="lg"
                className="bg-gradient-to-r from-cyber-orange to-cyber-red hover:from-cyber-orange/80 hover:to-cyber-red/80 text-white font-bold px-12 py-6 text-xl shadow-lg transition-all duration-300 transform hover:scale-105 neon-text"
                disabled={!controllerConnector}
              >
                {account ? (
                  <>
                    <Play className="mr-3 h-6 w-6" />
                    Enter Game
                  </>
                ) : (
                  <>
                    <Play className="mr-3 h-6 w-6" />
                    Play Now
                  </>
                )}
              </Button>
              
              {/* Show refresh button if controller is not ready */}
              {controllerConnector && !controllerConnector.ready && (
                <Button
                  onClick={() => window.location.reload()}
                  size="lg"
                  variant="outline"
                  className="px-6 py-4 text-lg"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Refresh
                </Button>
              )}

            </div>
          </div>
        </div>

        {/* Statistics Row */}
        <div className="flex justify-center w-full mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
            <StatCard title="Games Played" value={queueLength.toString()} />
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
