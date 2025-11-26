import { useState, useEffect, useRef } from 'react';
import { Home, Plus, Vote, PieChart, User, Menu, X, Settings as SettingsIcon, ChevronDown, Wallet, LogOut, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAlgorand } from '../providers/AlgorandProvider';
import { Button } from './ui/Button';
import { formatAlgorandAddress } from '../blockchain/contracts';

const Navigation = () => {
  const location = useLocation();
  const { address, accounts, isConnected, connectWallet, disconnectWallet, switchAccount } = useAlgorand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position to add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const isActive = (path: string) => location.pathname === path;
  
  // Modified navItems to identify Create separately
  const standardNavItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/vote', icon: Vote, label: 'Vote' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/results', icon: PieChart, label: 'Results' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];
  
  const handleWalletClick = () => {
    if (isConnected) {
      setShowWalletDropdown(!showWalletDropdown);
    } else {
      setShowWalletModal(true);
    }
  };

  const handleWalletSelect = async () => {
    try {
      await connectWallet('pera');
      setShowWalletModal(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setShowWalletDropdown(false);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  return (
    <nav className={`bg-surface sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'shadow-lg shadow-black/20' : 'border-b border-surface-hover'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-background transform transition-transform group-hover:rotate-12">
                <Vote className="h-5 w-5" />
              </div>
              <div className="ml-3 flex flex-col justify-center">
                <span className="text-xl font-bold text-text-primary leading-tight">CrossVote</span>
                <span className="text-xs text-primary-400 font-medium leading-tight mt-0.5">Governance DAO</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="hidden md:flex md:space-x-1">
              {standardNavItems.map(({ path, icon: Icon, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors nav-link-hover ${
                    isActive(path)
                      ? 'text-primary-400 bg-surface-hover'
                      : 'text-text-secondary hover:text-primary-400 hover:bg-surface-hover'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive(path) ? 'text-primary-400' : 'text-text-muted'}`} />
                  {label}
                </Link>
              ))}
            </div>
            
            <div className="ml-6 relative" ref={dropdownRef}>
              <Button 
                onClick={handleWalletClick}
                variant={isConnected ? "outline" : "default"}
                size="md"
                className={isConnected ? 'border-primary-400 hover:border-primary-500 hover:bg-primary-500/10' : ''}
              >
                <span className="flex items-center">
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                      <span className="font-medium">{address ? formatAlgorandAddress(address) : ''}</span>
                      <ChevronDown className={`ml-2 h-4 w-4 opacity-70 transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`} />
                    </>
                  ) : (
                    <>Connect Wallet</>
                  )}
                </span>
              </Button>
              
              {/* Wallet Dropdown Menu */}
              {isConnected && showWalletDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-surface rounded-lg shadow-xl border border-surface-hover overflow-hidden z-50 animate-fadeIn">
                  <div className="p-3 bg-dark border-b border-surface-hover">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                        <Wallet className="w-5 h-5 text-dark" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-muted">Connected Accounts</p>
                        <p className="text-sm font-medium text-text-primary">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* List of all accounts */}
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {accounts.map((account) => (
                      <button
                        key={account}
                        onClick={() => {
                          switchAccount(account);
                          setShowWalletDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left flex items-center hover:bg-primary-500/10 transition-colors group ${
                          account === address ? 'bg-primary-500/20' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          {account === address ? (
                            <Check className="w-4 h-4 text-primary-400" />
                          ) : (
                            <Wallet className="w-4 h-4 text-primary-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            account === address ? 'text-primary-400' : 'text-text-primary'
                          }`}>
                            {formatAlgorandAddress(account)}
                          </p>
                          {account === address && (
                            <p className="text-xs text-text-muted">Active Account</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="border-t border-surface-hover">
                    <button
                      onClick={handleDisconnect}
                      className="w-full px-4 py-2.5 text-left flex items-center hover:bg-error/10 transition-colors text-error"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      <span className="text-sm">Disconnect All</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-primary-400 hover:bg-surface-hover focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-hover shadow-lg animate-fadeIn bg-surface">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {standardNavItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-all ${
                  isActive(path)
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-primary-400'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className={`w-8 h-8 rounded-full ${isActive(path) ? 'bg-primary-500/30' : 'bg-dark'} flex items-center justify-center mr-3`}>
                  <Icon className={`w-4 h-4 ${isActive(path) ? 'text-primary-400' : 'text-text-muted'}`} />
                </div>
                {label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-surface-hover bg-dark">
            <div className="px-4">
              {isConnected ? (
                <>
                  <div className="mb-3">
                    <p className="text-xs text-text-muted mb-2">{accounts.length} Connected Account{accounts.length !== 1 ? 's' : ''}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {accounts.map((account) => (
                        <button
                          key={account}
                          onClick={() => {
                            switchAccount(account);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-md text-left flex items-center transition-colors ${
                            account === address 
                              ? 'bg-primary-500/20 border border-primary-500/30' 
                              : 'bg-surface hover:bg-primary-500/10 border border-surface-hover'
                          }`}
                        >
                          <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            {account === address ? (
                              <Check className="w-4 h-4 text-primary-400" />
                            ) : (
                              <Wallet className="w-4 h-4 text-primary-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              account === address ? 'text-primary-400' : 'text-text-primary'
                            }`}>
                              {formatAlgorandAddress(account)}
                            </p>
                            {account === address && (
                              <p className="text-xs text-text-muted">Active</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                    size="md"
                    fullWidth
                    className="text-error border-error hover:bg-error/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect All
                  </Button>
                </>
              ) : (
                <div className="py-3">
                  <Button 
                    onClick={handleWalletClick}
                    variant="default"
                    size="md"
                    fullWidth
                    className="btn-gradient"
                  >
                    Connect Wallet
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-5 max-w-xs w-full border border-surface-hover shadow-xl">
            <h3 className="text-base font-semibold mb-3 text-text-primary">Connect Wallet</h3>
            <p className="text-xs text-text-secondary mb-4">Select your Pera Wallet and choose one or more accounts to connect.</p>
            <div className="space-y-2">
              <button
                onClick={handleWalletSelect}
                className="w-full flex items-center p-2.5 border border-surface-hover rounded-lg hover:bg-dark transition-colors group"
              >
                <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center mr-2.5 group-hover:scale-110 transition-transform">
                  <span className="text-dark font-bold text-xs">P</span>
                </div>
                <div className="flex-1 text-left">
                  <span className="font-medium text-text-primary text-sm block">Pera Wallet</span>
                  <span className="text-xs text-text-muted">Multi-account support</span>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowWalletModal(false)}
              className="w-full mt-3 px-3 py-2 text-sm text-text-secondary border border-surface-hover rounded-lg hover:bg-dark transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;