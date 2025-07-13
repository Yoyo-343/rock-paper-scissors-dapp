import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AccountInterface, RpcProvider } from 'starknet';
import { ControllerConnector } from '@cartridge/connector';
import { useToast } from '@/hooks/use-toast';

// Enhanced Configuration for Rock Paper Scissors
const RPS_CONFIG = {
  rpcUrl: 'https://free-rpc.nethermind.io/sepolia-juno',
  contractAddress: '0x0638e6d45d476e71044f8e8d7119f6158748bf5bd56018e2f9275c96499c52b9',
  worldName: 'rock_paper_scissors',
};

// Cartridge Controller Configuration with enhanced policies
const cartridgeConnector = new ControllerConnector({
  policies: [
    {
      target: RPS_CONFIG.contractAddress,
      method: "join_queue",
    },
    {
      target: RPS_CONFIG.contractAddress,
      method: "commit_move",
    },
    {
      target: RPS_CONFIG.contractAddress,
      method: "reveal_move",
    },
    {
      target: RPS_CONFIG.contractAddress,
      method: "claim_prize",
    },
    {
      target: RPS_CONFIG.contractAddress,
      method: "forfeit_game",
    }
  ]
});

interface DojoContextType {
  account: AccountInterface | null;
  address: string | null;
  isConnected: boolean;
  provider: RpcProvider | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  sessionValid: boolean;
}

const DojoContext = createContext<DojoContextType | null>(null);

interface DojoProviderProps {
  children: ReactNode;
}

export const DojoProvider: React.FC<DojoProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<RpcProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState(false);
  
  const { toast } = useToast();

  // Initialize provider and check for existing session
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        const rpcProvider = new RpcProvider({ nodeUrl: RPS_CONFIG.rpcUrl });
        setProvider(rpcProvider);
        
        // Check for existing session
        const savedAddress = localStorage.getItem('dojo_address');
        const savedSessionTime = localStorage.getItem('dojo_session_time');
        
        if (savedAddress && savedSessionTime) {
          const sessionAge = Date.now() - parseInt(savedSessionTime);
          const sessionExpired = sessionAge > (24 * 60 * 60 * 1000); // 24 hours
          
          if (!sessionExpired) {
            try {
              // Try to get account from Cartridge Controller
              const cartridgeAccount = await cartridgeConnector.account(rpcProvider);
              
              if (cartridgeAccount && cartridgeAccount.address === savedAddress) {
                setAccount(cartridgeAccount);
                setAddress(savedAddress);
                setIsConnected(true);
                setSessionValid(true);
                
                console.log('✅ Restored valid session:', { address: savedAddress });
                return;
              }
            } catch (error) {
              console.log('⚠️ Saved session invalid, will need to reconnect');
            }
          }
          
          // Clear invalid session
          localStorage.removeItem('dojo_address');
          localStorage.removeItem('dojo_session_time');
        }
        
        console.log('🔧 Provider initialized, no valid session found');
      } catch (error) {
        console.error('❌ Failed to initialize provider:', error);
        setError('Failed to initialize connection provider');
      }
    };

    initializeProvider();
  }, []);

  const connect = async () => {
    if (!provider) {
      toast({
        title: "Provider Not Ready",
        description: "Connection provider is not initialized yet. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔌 Connecting to Cartridge Controller with enhanced session...');
      
      // Connect via Cartridge Controller
      await cartridgeConnector.connect();
      
      // Get account from Cartridge Controller with retry logic
      let cartridgeAccount: AccountInterface | null = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          cartridgeAccount = await cartridgeConnector.account(provider);
          if (cartridgeAccount) break;
        } catch (error) {
          console.log(`⚠️ Account retrieval attempt ${attempt} failed:`, error);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      if (!cartridgeAccount) {
        throw new Error('Failed to get account from Cartridge Controller after 3 attempts');
      }

      const accountAddress = cartridgeAccount.address;
      
      // Set up connection state
      setAccount(cartridgeAccount);
      setAddress(accountAddress);
      setIsConnected(true);
      setSessionValid(true);
      
      // Save session with timestamp
      localStorage.setItem('dojo_address', accountAddress);
      localStorage.setItem('dojo_session_time', Date.now().toString());
      
      console.log('✅ Successfully connected with enhanced session management:', {
        address: accountAddress,
        sessionTime: new Date().toISOString()
      });
      
      toast({
        title: "Connected Successfully",
        description: `Connected to Rock Paper Scissors game`,
      });
      
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: `Failed to connect: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await cartridgeConnector.disconnect?.();
      
      setAccount(null);
      setAddress(null);
      setIsConnected(false);
      setSessionValid(false);
      setError(null);
      
      // Clear saved session
      localStorage.removeItem('dojo_address');
      localStorage.removeItem('dojo_session_time');
      
      console.log('✅ Disconnected and cleared session');
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from the game",
      });
      
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
      
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect properly. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  // Periodic session validation
  useEffect(() => {
    if (!isConnected || !sessionValid) return;

    const validateSession = async () => {
      try {
        if (account && provider) {
          // Simple validation - check if account is still accessible
          const currentAccount = await cartridgeConnector.account(provider);
          if (!currentAccount || currentAccount.address !== address) {
            throw new Error('Session invalid');
          }
        }
      } catch (error) {
        console.log('⚠️ Session validation failed:', error);
        setSessionValid(false);
        setIsConnected(false);
        setAccount(null);
        setAddress(null);
        
        // Clear invalid session
        localStorage.removeItem('dojo_address');
        localStorage.removeItem('dojo_session_time');
      }
    };

    // Validate session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isConnected, sessionValid, account, provider, address]);

  const contextValue: DojoContextType = {
    account,
    address,
    isConnected,
    provider,
    connect,
    disconnect,
    isConnecting,
    error,
    sessionValid
  };

  return (
    <DojoContext.Provider value={contextValue}>
      {children}
    </DojoContext.Provider>
  );
};

export const useDojo = () => {
  const context = useContext(DojoContext);
  if (!context) {
    throw new Error('useDojo must be used within a DojoProvider');
  }
  return context;
};

export default DojoProvider; 