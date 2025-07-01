import React, { useState, useEffect } from 'react';
import { Zap, Shield, Trophy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useConnect, useAccount, useDisconnect } from '@starknet-react/core';
import { useRockPaperScissorsContract } from '../hooks/useRockPaperScissorsContract';
import GameCard from '../components/GameCard';
import PlayButton from '../components/PlayButton';
import StatCard from '../components/StatCard';
import Footer from '../components/Footer';
import FloatingSymbols from '../components/FloatingSymbols';

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { connect, connectors } = useConnect();
  const { account, address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { queueLength } = useRockPaperScissorsContract();
  const [isConnecting, setIsConnecting] = useState(false);
  const [strkPrice, setStrkPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [entryFeeStrk, setEntryFeeStrk] = useState<string>("0");

  // Fetch real STRK price from Pragma oracle
  useEffect(() => {
    const fetchStrkPrice = async () => {
      try {
        // First try Pragma oracle API for STRK price
        const pragmaResponse = await fetch('https://api.pragma.build/node/v1/data/STRK/USD?interval=1min&routing=true');
        const pragmaData = await pragmaResponse.json();
        
        if (pragmaData && pragmaData.price) {
          const price = parseFloat(pragmaData.price);
          setStrkPrice(price);
          // Calculate STRK needed for $1 USD
          const strkFor1USD = (1 / price).toFixed(4);
          setEntryFeeStrk(strkFor1USD);
        } else {
          throw new Error('Pragma API failed');
        }
      } catch (error) {
        console.error('Failed to fetch STRK price from Pragma:', error);
        try {
          // Fallback to CoinGecko for STRK price
          const cgResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd');
          const cgData = await cgResponse.json();
          const price = cgData.starknet.usd;
          setStrkPrice(price);
          // Calculate STRK needed for $1 USD
          const strkFor1USD = (1 / price).toFixed(4);
          setEntryFeeStrk(strkFor1USD);
        } catch (fallbackError) {
          console.error('Failed to fetch STRK price from fallback:', fallbackError);
          setStrkPrice(0.5); // Fallback price ~$0.50
          setEntryFeeStrk("2.0000"); // 2 STRK for $1
        }
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchStrkPrice();
    const interval = setInterval(fetchStrkPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debug connection state changes
  useEffect(() => {
    console.log('🔍 Connection state changed:', {
      isConnected,
      address,
      account,
      isConnecting
    });
  }, [isConnected, address, account, isConnecting]);

  // Navigate to game page after successful Cartridge Controller connection
  useEffect(() => {
    if (isConnected && address) {
      console.log('🎯 Connection detected, navigating to game arena with address:', address);
      setIsConnecting(false);
      navigate('/game');
    }
  }, [isConnected, address, navigate]);

  const handlePlayClick = async () => {
    // If already connecting, allow user to cancel
    if (isConnecting) {
      console.log('🚫 User cancelled connection');
      setIsConnecting(false);
      return;
    }
    
    if (!isConnected) {
      setIsConnecting(true);
      
      // Add safety timeout to prevent infinite loading
      const safetyTimeout = setTimeout(() => {
        console.error('🚨 Safety timeout triggered - resetting connection state');
        setIsConnecting(false);
      }, 45000); // 45 seconds max
      
      try {
        console.log('🎮 Opening Cartridge Controller...');
        console.log('📋 Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })));
        
        // Get the Cartridge connector - try multiple possible IDs
        let cartridgeConnector = connectors.find(c => c.id === 'controller');
        if (!cartridgeConnector) {
          cartridgeConnector = connectors.find(c => c.id === 'cartridge');
        }
        if (!cartridgeConnector) {
          cartridgeConnector = connectors.find(c => c.name?.toLowerCase().includes('cartridge'));
        }
        if (!cartridgeConnector) {
          cartridgeConnector = connectors[0]; // fallback to first connector
        }
        
        if (!cartridgeConnector) {
          throw new Error('No connectors available');
        }
        
        console.log('🔗 Using connector:', { id: cartridgeConnector.id, name: cartridgeConnector.name });
        console.log('🔗 Attempting to connect...');
        
        // Add connection timeout
        const connectionPromise = connect({ connector: cartridgeConnector });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        );
        
        const result = await Promise.race([connectionPromise, timeoutPromise]);
        console.log('🔗 Connect result:', result);
        
        console.log('✅ Cartridge Controller connected successfully!');
        console.log('🔑 Session policies activated for Rock Paper Scissors');
        
        clearTimeout(safetyTimeout);
        
        // Since connection succeeded, navigate to game immediately
        console.log('🎯 Connection succeeded, navigating to game page...');
        setIsConnecting(false);
        navigate('/game');
        
      } catch (error) {
        clearTimeout(safetyTimeout);
        console.error('❌ Cartridge Controller connection failed:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
        setIsConnecting(false);
        
        // Show user-friendly error message
        if (error.message === 'Connection timeout') {
          console.error('Connection timed out. Please try again.');
        } else if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
          console.log('User cancelled connection');
        } else {
          console.error('Failed to connect wallet. Please try again.');
        }
      }
    } else {
      // Already connected, proceed to game
      console.log('🎯 Entering game arena with address:', address);
      navigate('/game');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    console.log('🔌 Cartridge Controller disconnected');
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
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
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
            <PlayButton 
              onClick={handlePlayClick} 
              isConnected={isConnected}
              isConnecting={isConnecting}
            />
          </div>
        </div>

        {/* Statistics Row */}
                  <div className="flex justify-center w-full mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
              <StatCard title="Players in Queue" value={queueLength.toString()} />
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
