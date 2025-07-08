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
  
  const { account, address, status, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  const controllerConnector = useMemo(
    () => ControllerConnector.fromConnectors(connectors),
    [connectors],
  );
  
  const { queueLength } = useRockPaperScissorsContract();
  const [strkPrice, setStrkPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [entryFeeStrk, setEntryFeeStrk] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);

  // Simplified session check - just account existence
  const hasSession = !!account;

  // IMMEDIATE navigation after connection attempt
  useEffect(() => {
    if (shouldNavigate) {
      console.log('🚀 IMMEDIATE NAVIGATION TRIGGERED');
      setShouldNavigate(false);
      setIsConnecting(false);
      navigate('/game');
    }
  }, [shouldNavigate, navigate]);

  // Watch for any account state change during connection
  useEffect(() => {
    if (isConnecting && account) {
      console.log('✅ Account detected during connection, navigating immediately');
      setShouldNavigate(true);
    }
  }, [isConnecting, account]);

  // Load STRK price on mount
  useEffect(() => {
    const fetchStrkPrice = async () => {
      try {
        setIsLoadingPrice(true);
        const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=STRK');
        const data = await response.json();
        const strkPriceUsd = parseFloat(data.data.rates.USD);
        setStrkPrice(strkPriceUsd);
        
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

  const handlePlayClick = useCallback(async () => {
    // If already has session, go directly
    if (hasSession) {
      console.log('🎯 Session exists, navigating immediately');
      navigate('/game');
      return;
    }

    if (!controllerConnector) {
      toast({
        title: "Controller Not Available",
        description: "Cartridge Controller not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    console.log('🎮 Starting connection...');
    setIsConnecting(true);

    try {
      // Call connect and navigate IMMEDIATELY on success
      const result = await connect({ connector: controllerConnector });
      console.log('✅ Connect completed, result:', result);
      
      // Navigate immediately - don't wait for state updates
      console.log('🚀 Navigating immediately after connect success');
      setIsConnecting(false);
      navigate('/game');
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setIsConnecting(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${errorMessage}`,
        variant: "destructive",
      });
    }

    // AGGRESSIVE FALLBACK - navigate after 2 seconds regardless
    setTimeout(() => {
      if (isConnecting) {
        console.log('⚡ AGGRESSIVE FALLBACK - navigating after 2 seconds');
        setIsConnecting(false);
        navigate('/game');
      }
    }, 2000);

  }, [hasSession, controllerConnector, connect, navigate, toast, isConnecting]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Simple manual navigation
  const handleManualNavigation = () => {
    console.log('🎯 Manual navigation clicked');
    navigate('/game');
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
      {hasSession && (
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

      {/* Connection Status */}
      {isConnecting && (
        <div className="text-center mb-8 px-4">
          <div className="inline-flex flex-col items-center gap-4 px-6 py-4 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Creating session...
              </span>
            </div>
            <div className="text-xs text-gray-300 text-center">
              <p>If the modal disappears but you don't navigate:</p>
              <Button
                onClick={handleManualNavigation}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-1 text-xs"
              >
                Click here to continue →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-center mb-4 px-4">
          <div className="inline-flex flex-col items-center gap-1 px-4 py-2 bg-gray-800/50 border border-gray-600/40 rounded text-xs text-gray-400">
            <div>Status: {status} | Connected: {isConnected.toString()}</div>
            <div>Account: {account ? '✅' : '❌'} | Address: {address ? '✅' : '❌'}</div>
            <div>Connecting: {isConnecting.toString()}</div>
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
                disabled={isConnecting || !controllerConnector}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Creating Session...
                  </>
                ) : hasSession ? (
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
