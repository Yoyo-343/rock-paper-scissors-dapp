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
  const [isConnecting, setIsConnecting] = useState(false);

  // Simple session check - just account existence  
  const hasSession = !!account;

  // Simple connection handler
  const handlePlayClick = useCallback(async () => {
    if (hasSession) {
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

    setIsConnecting(true);
    
    try {
      await connect({ connector: controllerConnector });
      // Small delay to ensure connection is established
      setTimeout(() => {
        navigate('/game');
      }, 500);
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Cartridge Controller. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [hasSession, controllerConnector, connect, navigate, toast]);

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

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Floating background symbols */}
      <FloatingSymbols />
      
      {/* Header */}
      <header className="text-center py-12 px-4 relative z-10 mb-8">
        <div className="flex justify-center">
          <h1 className="text-8xl font-bold neon-text mb-4">
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

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-center mb-4 px-4">
          <div className="inline-flex flex-col items-center gap-1 px-4 py-2 bg-gray-800/50 border border-gray-600/40 rounded text-xs text-gray-400">
            <div>Status: {status} | Connected: {isConnected.toString()}</div>
            <div>Account: {account ? '✅' : '❌'} | Address: {address ? '✅' : '❌'}</div>
            <div>Has Session: {hasSession.toString()} | Connecting: {isConnecting.toString()}</div>
          </div>
        </div>
      )}

      <main className="flex-1 px-4">
        {/* Statistics Row */}
        <div className="flex justify-center w-full mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
            <StatCard title="Queue Length" value={queueLength.toString()} />
            <StatCard title="Prize Pool" value="$2" />
          </div>
        </div>

        {/* Play Now Button */}
        <div className="flex justify-center mb-12">
          <div className="px-16">
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handlePlayClick}
                size="lg"
                className="bg-gradient-to-r from-cyber-orange to-cyber-red hover:from-cyber-orange/80 hover:to-cyber-red/80 text-white font-bold px-16 py-6 text-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                disabled={isConnecting || !controllerConnector}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Connecting...
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

        {/* Additional Statistics */}
        <div className="flex justify-center w-full mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md">
            <StatCard title="Games Played" value="142" />
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
