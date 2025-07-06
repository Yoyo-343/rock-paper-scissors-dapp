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
  
  // Find controller connector directly to avoid initialization issues with fromConnectors
  const controllerConnector = useMemo(() => {
    const connector = connectors.find(connector => connector instanceof ControllerConnector);
    console.log('🎮 Found controller connector:', {
      connector: !!connector,
      connectorId: connector?.id,
      connectorName: connector?.name,
      totalConnectors: connectors.length
    });
    return connector;
  }, [connectors]);
  
  const { queueLength } = useRockPaperScissorsContract();
  const [isConnecting, setIsConnecting] = useState(false);
  const [strkPrice, setStrkPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [entryFeeStrk, setEntryFeeStrk] = useState<string>("0");

  // Derived state - use simple account check
  const isConnected = !!account;
  const isLoading = status === 'connecting' || status === 'reconnecting';

  // Single console log to avoid spam
  console.log('🔍 Wallet state:', { 
    status, 
    address: address?.slice(0, 10) + '...', 
    isConnected, 
    isLoading,
    hasControllerConnector: !!controllerConnector
  });

  // Auto-navigate when connected during connection flow
  useEffect(() => {
    console.log('🔍 Connection state changed:', {
      isConnecting,
      account: !!account,
      address: account?.address,
      isConnected,
      timestamp: new Date().toISOString()
    });

    if (isConnecting && account) {
      console.log('🎯 Connected! Navigating to game...');
      setIsConnecting(false);
      navigate('/game');
    }
  }, [account, isConnecting, navigate, isConnected]);

  // Add timeout fallback for connection detection
  useEffect(() => {
    if (!isConnecting) return;

    console.log('🕐 Setting up connection detection with polling...');
    
    // Poll for connection every 500ms for up to 30 seconds
    let pollCount = 0;
    const maxPolls = 60; // 30 seconds at 500ms intervals
    
    const pollForConnection = () => {
      pollCount++;
      console.log(`🔄 Polling for connection (${pollCount}/${maxPolls})...`, {
        account: !!account,
        address: account?.address,
        isConnected
      });

      // If we detect account, navigate immediately
      if (account) {
        console.log('🎯 Account detected during polling! Navigating...');
        setIsConnecting(false);
        navigate('/game');
        return;
      }

      // If we've reached max polls, show timeout options
      if (pollCount >= maxPolls) {
        console.log('⏰ Connection detection timeout reached');
        setIsConnecting(false);
        
        toast({
          title: "Connection Detection Timeout",
          description: "If you created a session successfully, you can proceed manually or refresh the page.",
        });

        // Show manual navigation options after a short delay
        setTimeout(() => {
          const proceed = window.confirm(
            "Did you successfully create a session in Cartridge Controller?\n\n" +
            "Click OK to proceed to the game, or Cancel to refresh the page."
          );
          
          if (proceed) {
            console.log('🎯 User confirmed connection, navigating to game...');
            navigate('/game');
          } else {
            console.log('🔄 User chose to refresh page...');
            window.location.reload();
          }
        }, 1000);
        
        return;
      }

      // Continue polling
      setTimeout(pollForConnection, 500);
    };

    // Start polling after a short delay
    const pollTimeout = setTimeout(pollForConnection, 500);

    return () => {
      console.log('🧹 Cleaning up connection polling');
      clearTimeout(pollTimeout);
    };
  }, [isConnecting, navigate, toast, account, isConnected]);

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

  const handlePlayClick = useCallback(async () => {
    // If currently connecting, cancel the connection
    if (isConnecting) {
      console.log('🚫 User canceled connection');
      setIsConnecting(false);
      
      // Force disconnect to clean up any stuck state
      try {
        await disconnect();
        console.log('🔌 Forced disconnect to clean up stuck state');
      } catch (error) {
        console.log('⚠️ Force disconnect failed (may not be connected):', error);
      }
      
      toast({
        title: "Connection Canceled",
        description: "Connection attempt canceled by user",
      });
      return;
    }

    // If already connected, proceed directly to game
    if (account) {
      console.log('🎯 Already connected, entering game...');
      navigate('/game');
      return;
    }

    // Otherwise connect
    if (controllerConnector) {
      console.log('🎮 Connecting to Cartridge Controller...');
      console.log('🔍 Connector details:', {
        id: controllerConnector.id,
        name: controllerConnector.name,
        available: controllerConnector.available,
        ready: controllerConnector.ready
      });
      
      // Check if controller is still initializing
      if (!controllerConnector.ready) {
        console.log('⏳ Controller not ready yet, waiting...');
        toast({
          title: "Controller Initializing",
          description: "Please wait for the controller to finish initializing and try again.",
        });
        return;
      }
      
      setIsConnecting(true);
      
      // Add a shorter timeout to prevent hanging
      const connectTimeout = setTimeout(() => {
        console.log('⏰ Connection timeout - resetting state');
        setIsConnecting(false);
        toast({
          title: "Connection Timeout",
          description: "Controller initialization timed out. Please refresh the page and try again.",
          variant: "destructive",
        });
      }, 10000); // 10 second timeout instead of 15
      
      try {
        console.log('🔗 Calling connect with controller...');
        console.log('🔍 Pre-connect state:', {
          account: !!account,
          address: account?.address,
          isConnected,
          connectorReady: controllerConnector.ready,
          connectorAvailable: controllerConnector.available
        });
        
        // Try connecting with additional error context
        const result = await connect({ connector: controllerConnector });
        console.log('✅ Connect call completed, result:', result);
        console.log('🔍 Post-connect state:', {
          account: !!account,
          address: account?.address,
          isConnected,
          connectCallCompleted: true
        });
        
        // Clear timeout since connection succeeded
        clearTimeout(connectTimeout);
        
        // If account is already available, navigate immediately
        if (account) {
          console.log('🎯 Account available immediately, navigating...');
          setIsConnecting(false);
          navigate('/game');
        } else {
          console.log('⏳ Account not immediately available, waiting for polling...');
        }
        // Otherwise useEffect will handle navigation when account becomes available
        
      } catch (error) {
        console.error('❌ Connection failed:', error);
        clearTimeout(connectTimeout);
        setIsConnecting(false);
        
        // More specific error handling
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('🔍 Error details:', { 
          errorMessage, 
          errorType: typeof error, 
          error: error,
          stack: error instanceof Error ? error.stack : undefined
        });
        
        toast({
          title: "Connection Error", 
          description: `Failed to connect: ${errorMessage}. Try refreshing the page.`,
          variant: "destructive",
        });
      }
    } else {
      console.error('❌ No controller connector found');
      console.log('🔍 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
      toast({
        title: "Connection Error",
        description: "Cartridge Controller not available. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [account, controllerConnector, connect, navigate, toast, isConnecting, disconnect, connectors]);

  const handleDisconnect = async () => {
    try {
      console.log('🔌 Disconnecting...');
      await disconnect();
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error: any) {
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

      {/* Connection Status */}
      {isConnected && address && (
        <div className="text-center mb-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                disabled={isConnecting || !controllerConnector?.ready}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : account ? (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Enter Game
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
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
