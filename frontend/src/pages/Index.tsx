import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, Shield, Trophy, Play, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useDojo } from '../providers/DojoProvider';
import { useRockPaperScissorsContract } from '../hooks/useRockPaperScissorsContract';
import GameCard from '../components/GameCard';
import StatCard from '../components/StatCard';
import Footer from '../components/Footer';
import FloatingSymbols from '../components/FloatingSymbols';
import { Button } from '../components/ui/button';

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use the new Dojo context for enhanced wallet connection
  const { account, address, isConnected, connect, disconnect, isConnecting, error: dojoError, sessionValid } = useDojo();
  
  const { queueLength } = useRockPaperScissorsContract();
  const [strkPrice, setStrkPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [entryFeeStrk, setEntryFeeStrk] = useState<string>("0");
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Enhanced session validation with Dojo integration
  const hasValidSession = useMemo(() => {
    const isSessionValid = !!(account && address && isConnected && sessionValid);
    
    if (isSessionValid) {
      console.log('✅ Valid Dojo session detected:', {
        account: !!account,
        address: !!address,
        isConnected,
        sessionValid
      });
    }
    
    return isSessionValid;
  }, [account, address, isConnected, sessionValid]);

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

  // Enhanced connection handler with Dojo integration
  const handlePlayClick = useCallback(async () => {
    // If already have valid session, go directly to game
    if (hasValidSession) {
      console.log('🎮 Already have valid Dojo session, navigating to game');
      navigate('/game');
      return;
    }

    setConnectionAttempts(prev => prev + 1);
    
    try {
      console.log('🔌 Attempting Dojo connection...');
      await connect();
      
      console.log('✅ Dojo connect call completed, navigating to game');
      
      // Navigate immediately - Game component will handle session validation
      navigate('/game');
      
    } catch (error) {
      console.error('❌ Dojo connection failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Connection Failed",
        description: `Failed to connect via Dojo: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
      
      // Reset connection attempts if it was a user rejection
      if (errorMessage.includes('rejected') || errorMessage.includes('denied')) {
        setConnectionAttempts(0);
      }
    }
  }, [hasValidSession, connect, navigate, toast]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from the game.",
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect properly. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Debug connection state with Dojo integration
  useEffect(() => {
    console.log('🔍 Dojo connection state:', {
      hasValidSession,
      account: !!account,
      address: !!address,
      isConnected,
      sessionValid,
      isConnecting,
      connectionAttempts,
      dojoError
    });
  }, [hasValidSession, account, address, isConnected, sessionValid, isConnecting, connectionAttempts, dojoError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white overflow-hidden relative">
      <FloatingSymbols />
      
      {/* Hero Section */}
      <div className="relative z-10 text-center pt-20 pb-16 px-4">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 text-cyber-orange neon-text animate-neon-flicker">
          Rock Paper Scissors
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          The ultimate decentralized Rock Paper Scissors experience on Starknet
        </p>
        
        {/* Session Status */}
        {hasValidSession && (
          <div className="text-center mb-8 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Connected to Dojo World</span>
            </div>
          </div>
        )}

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4 text-sm">
              <div>Session Valid: {hasValidSession.toString()} | Connecting: {isConnecting.toString()}</div>
              <div>Account: {account ? '✅' : '❌'} | Address: {address ? '✅' : '❌'}</div>
              <div>Connected: {isConnected.toString()} | Dojo Session: {sessionValid.toString()}</div>
              {dojoError && <div className="text-red-400">Error: {dojoError}</div>}
            </div>
          </div>
        )}
        
        {/* Main Play Button */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            {hasValidSession ? (
              <Button 
                onClick={handlePlayClick}
                className="bg-gradient-to-r from-cyber-orange to-orange-600 hover:from-orange-600 hover:to-cyber-orange text-black font-bold text-xl px-16 py-6 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyber-orange/50"
              >
                <Play className="mr-3 h-6 w-6" />
                Enter Game World
              </Button>
            ) : (
              <Button 
                onClick={handlePlayClick}
                disabled={isConnecting}
                className="bg-gradient-to-r from-cyber-orange to-orange-600 hover:from-orange-600 hover:to-cyber-orange text-black font-bold text-xl px-16 py-6 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyber-orange/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Connecting to Dojo...
                  </>
                ) : (
                  <>
                    <Play className="mr-3 h-6 w-6" />
                    Connect & Play
                  </>
                )}
              </Button>
            )}
          </div>
          
          {hasValidSession && (
            <Button 
              onClick={handleDisconnect}
              variant="outline"
              className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>

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

      {/* Statistics Row */}
      <div className="flex justify-center w-full mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
          <StatCard title="Games Played" value={queueLength.toString()} />
          <StatCard title="Total Prize Won" value="$3,891" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
