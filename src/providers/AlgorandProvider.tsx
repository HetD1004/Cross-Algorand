import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { ALGORAND_CONFIG } from '../blockchain/contracts';

// Wallet types
export type WalletType = 'pera' | null;

// Algorand context interface
interface AlgorandContextType {
  // Connection state
  isConnected: boolean;
  address: string | null;
  accounts: string[];
  walletType: WalletType;
  
  // Connection methods
  connectWallet: (walletType: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchAccount: (account: string) => void;
  
  // Network info
  network: string;
  isTestnet: boolean;
  
  // Wallet instances
  peraWallet: PeraWalletConnect | null;
}

const AlgorandContext = createContext<AlgorandContextType>({
  isConnected: false,
  address: null,
  accounts: [],
  walletType: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  switchAccount: () => {},
  network: "testnet",
  isTestnet: true,
  peraWallet: null,
});

export const useAlgorand = () => {
  const context = useContext(AlgorandContext);
  if (!context) {
    throw new Error('useAlgorand must be used within an AlgorandProvider');
  }
  return context;
};

interface AlgorandProviderProps {
  children: ReactNode;
}

export const AlgorandProvider: React.FC<AlgorandProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);

  // Initialize Pera Wallet
  useEffect(() => {
    try {
      const pera = new PeraWalletConnect({
        shouldShowSignTxnToast: true,
      });
      setPeraWallet(pera);

      // Check for existing connections
      checkExistingConnections(pera);
    } catch (error) {
      console.error('Error initializing Pera wallet:', error);
    }
  }, []);

  const checkExistingConnections = async (pera: PeraWalletConnect) => {
    try {
      // Check Pera Wallet connection
      const peraAccounts = await pera.reconnectSession();
      if (peraAccounts && peraAccounts.length > 0) {
        // Get the previously selected address from localStorage
        const savedAddress = localStorage.getItem('algorand_address');
        
        setAccounts(peraAccounts);
        // Use saved address if it exists in reconnected accounts, otherwise use first account
        const activeAddress = savedAddress && peraAccounts.includes(savedAddress) 
          ? savedAddress 
          : peraAccounts[0];
        
        setAddress(activeAddress);
        setWalletType('pera');
        setIsConnected(true);
        localStorage.setItem('algorand_wallet', 'pera');
        localStorage.setItem('algorand_address', activeAddress);
        localStorage.setItem('algorand_accounts', JSON.stringify(peraAccounts));
        return;
      }
    } catch (error) {
      console.log('No existing Pera connection');
    }

    // Check localStorage for previous connection
    const savedWallet = localStorage.getItem('algorand_wallet') as WalletType;
    const savedAddress = localStorage.getItem('algorand_address');
    const savedAccounts = localStorage.getItem('algorand_accounts');
    if (savedWallet === 'pera' && savedAddress) {
      setWalletType(savedWallet);
      setAddress(savedAddress);
      if (savedAccounts) {
        try {
          setAccounts(JSON.parse(savedAccounts));
        } catch {
          setAccounts([savedAddress]);
        }
      } else {
        setAccounts([savedAddress]);
      }
      setIsConnected(true);
    }
  };

  const connectWallet = async (selectedWalletType: WalletType) => {
    if (!selectedWalletType || selectedWalletType !== 'pera') return;

    try {
      let connectedAccounts: string[] = [];

      if (peraWallet) {
        connectedAccounts = await peraWallet.connect();
      }

      if (connectedAccounts && connectedAccounts.length > 0) {
        setAccounts(connectedAccounts);
        setAddress(connectedAccounts[0]);
        setWalletType(selectedWalletType);
        setIsConnected(true);
        
        // Save to localStorage
        localStorage.setItem('algorand_wallet', selectedWalletType);
        localStorage.setItem('algorand_address', connectedAccounts[0]);
        localStorage.setItem('algorand_accounts', JSON.stringify(connectedAccounts));

        console.log(`Connected to ${selectedWalletType} wallet:`, connectedAccounts);
      }
    } catch (error) {
      console.error(`Error connecting to ${selectedWalletType} wallet:`, error);
      throw error;
    }
  };

  const disconnectWallet = async () => {
    try {
      if (walletType === 'pera' && peraWallet) {
        await peraWallet.disconnect();
      }

      setAddress(null);
      setAccounts([]);
      setWalletType(null);
      setIsConnected(false);

      // Clear localStorage
      localStorage.removeItem('algorand_wallet');
      localStorage.removeItem('algorand_address');
      localStorage.removeItem('algorand_accounts');
      
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const switchAccount = (account: string) => {
    if (accounts.includes(account)) {
      setAddress(account);
      localStorage.setItem('algorand_address', account);
      console.log('Switched to account:', account);
    }
  };

  const contextValue: AlgorandContextType = {
    isConnected,
    address,
    accounts,
    walletType,
    connectWallet,
    disconnectWallet,
    switchAccount,
    network: 'TestNet',
    isTestnet: true,
    peraWallet,
  };

  return (
    <AlgorandContext.Provider value={contextValue}>
      {children}
    </AlgorandContext.Provider>
  );
};

// Helper hook for backward compatibility
export const useAccount = () => {
  const { isConnected, address } = useAlgorand();
  return { isConnected, address };
};

// Helper hook for network info
export const useNetwork = () => {
  const { network, isTestnet } = useAlgorand();
  return { 
    chain: { 
      id: isTestnet ? 'testnet-v1.0' : 'mainnet-v1.0', 
      name: network,
      blockExplorers: {
        default: {
          url: ALGORAND_CONFIG.explorerUrl
        }
      }
    } 
  };
};