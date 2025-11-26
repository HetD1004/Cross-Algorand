import { useState } from 'react';
import { Settings as SettingsIcon, Network, Shield, AlertCircle, Wallet, CheckCircle } from 'lucide-react';
import { useAlgorand } from '../providers/AlgorandProvider';
import { Button } from './ui/Button';
import { formatAlgorandAddress } from '../blockchain/contracts';

const Settings = () => {
  const { network, isTestnet, isConnected, address, connectWallet, disconnectWallet } = useAlgorand();
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center">
        <SettingsIcon className="h-6 w-6 text-primary-600 mr-3" />
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Configuration */}
        <div className="bg-surface shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Network className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-text-primary">Network Configuration</h3>
            </div>
            <p className="text-sm text-text-secondary mb-6">Currently connected to Algorand TestNet</p>
            
            {/* Current Network Status */}
            <div className="p-4 bg-dark rounded-lg border border-primary-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-400 mr-3 animate-pulse"></div>
                  <div>
                    <span className="text-sm font-medium text-text-primary">Algorand {network}</span>
                    <p className="text-xs text-text-secondary">Genesis ID: testnet-v1.0</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 rounded-full">
                    {isTestnet ? 'TestNet' : 'MainNet'}
                  </span>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Node:</span>
                <span className="text-text-primary font-mono text-xs">testnet-api.algonode.cloud</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Indexer:</span>
                <span className="text-text-primary font-mono text-xs">testnet-idx.algonode.cloud</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Explorer:</span>
                <span className="text-text-primary font-mono text-xs">testnet.explorer.perawallet.app</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Configuration */}
        <div className="bg-surface shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-5 w-5 text-primary-400 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-text-primary">Wallet Configuration</h3>
            </div>
            <p className="text-sm text-text-secondary mb-6">Supported Algorand wallets for this application</p>
            
            {/* Wallet Connection Status */}
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-success/30 rounded-lg bg-success/10">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-dark font-bold text-sm">P</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-success mr-2" />
                      <span className="text-sm font-medium text-text-primary">Pera Wallet Connected</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{address ? formatAlgorandAddress(address) : ''}</p>
                  </div>
                  <Button 
                    onClick={disconnectWallet} 
                    variant="outline" 
                    size="sm"
                    className="text-error border-error/30 hover:bg-error/10"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-surface-hover rounded-lg">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-dark font-bold text-sm">P</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text-primary">Pera Wallet</span>
                    <p className="text-xs text-text-secondary">Mobile and browser extension wallet</p>
                  </div>
                  <Button 
                    onClick={() => connectWallet('pera')} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-6 p-3 bg-primary-500/10 rounded-lg border border-primary-400/30">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-primary-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">TestNet Notice:</strong> This application is currently configured for Algorand TestNet. 
                    Transactions use test tokens with no real value.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Section */}
      <div className="mt-6 bg-surface shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">Data Management</h3>
          <div className="bg-primary-500/10 border border-primary-400/30 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-primary-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-text-secondary mb-3">
                  <strong className="text-text-primary">Development Mode:</strong> Clear all local data including mock proposals, votes, and transaction history. This will reset the application to use only real blockchain data.
                </p>
                <Button 
                  onClick={() => {
                    if (confirm('This will clear all local data and reload the page. Only real blockchain proposals will remain. Continue?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  variant="outline"
                  className="text-error border-error/30 hover:bg-error/10"
                >
                  Clear All Local Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="mt-6 bg-surface shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-text-primary mb-4">About Cross-Check Governance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-text-secondary">Version:</span>
              <span className="ml-2 text-text-primary">1.0.0-alpha</span>
            </div>
            <div>
              <span className="text-text-secondary">Network:</span>
              <span className="ml-2 text-text-primary">Algorand TestNet</span>
            </div>
            <div>
              <span className="text-text-secondary">Status:</span>
              <span className="ml-2 text-success">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm w-full mx-4 border border-surface-hover">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Connect Algorand Wallet</h3>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    await connectWallet('pera');
                    setShowWalletModal(false);
                  } catch (error) {
                    console.error('Error connecting to Pera:', error);
                  }
                }}
                className="w-full flex items-center p-3 border border-surface-hover rounded-lg hover:bg-dark transition-colors"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-dark font-bold text-sm">P</span>
                </div>
                <span className="font-medium text-text-primary">Pera Wallet</span>
              </button>
            </div>
            <button
              onClick={() => setShowWalletModal(false)}
              className="w-full mt-4 px-4 py-2 text-text-secondary border border-surface-hover rounded-lg hover:bg-dark transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;