import React from 'react';
import { useAlgorand } from '../providers/AlgorandProvider';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { User, Vote, Clock, ExternalLink, CheckCircle, XCircle, Database, Wallet, Copy, Check, X, Coins, TrendingUp, Activity } from 'lucide-react';
import * as Separator from '@radix-ui/react-separator';
import { Link } from 'react-router-dom';
import { useProposals } from '../providers/ProposalsProvider';
import { TransactionInfo } from '../blockchain/useAlgorandGovernance';
import { formatAlgorandAddress } from '../blockchain/contracts';
import * as Dialog from '@radix-ui/react-dialog';

const ProfilePage: React.FC = () => {
  const { address, isConnected, connectWallet, disconnectWallet } = useAlgorand();
  const { proposals, userVotes, transactions, getExplorerUrl, userBalance, formatAlgoAmount } = useProposals();
  const [showWalletModal, setShowWalletModal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  
  const formatDate = (date: Date | number) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user voting history from the userVotes state
  const userVotingHistory = Object.entries(userVotes).map(([proposalId, voteType]) => {
    const proposal = proposals.find(p => p.id === proposalId);
    return proposal ? {
      proposalId,
      proposalTitle: proposal.title,
      vote: voteType,
      timestamp: new Date() // In a real app, we would store the timestamp when the vote was cast
    } : null;
  }).filter(Boolean);
  
  // Debug transaction filtering
  console.log('=== PROFILE PAGE TRANSACTION DEBUG ===');
  console.log('All transactions:', transactions);
  console.log('Transaction count:', transactions.length);
  if (transactions.length > 0) {
    console.log('Sample transaction:', transactions[0]);
    console.log('Sample hash length:', transactions[0]?.hash?.length);
    console.log('Sample hash:', transactions[0]?.hash);
  }
  
  // Only display transactions with valid blockchain hashes (Algorand format)
  const validTransactions = transactions.filter(tx => {
    const isValid = tx.hash && 
      typeof tx.hash === 'string' && 
      tx.hash.length >= 40 && // More lenient length check for Algorand hashes
      !tx.hash.includes('mock') &&
      !tx.hash.includes('dummy');
    
    console.log(`Transaction ${tx.hash}: valid = ${isValid}`);
    return isValid;
  });
  
  console.log('Valid transactions:', validTransactions.length);

  // Find the transaction for a specific proposal ID
  const getTransactionForProposal = (proposalId: string) => {
    return validTransactions.find(tx => tx.proposalId === proposalId && tx.type === 'vote');
  };
  
  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Handle disconnect
  const handleDisconnect = async () => {
    await disconnectWallet();
    setShowWalletModal(false);
  };
  
  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-md mx-auto">
          <Card className="p-8">
            <User className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">Connect your wallet to view your profile and voting history.</p>
            <Button 
              onClick={() => setShowWalletModal(true)}
              size="lg"
            >
              Connect Wallet
            </Button>
          </Card>
        </div>
        
        {/* Wallet Connection Modal (when not connected) */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg p-5 max-w-xs w-full border border-surface-hover shadow-xl">
              <h3 className="text-base font-semibold mb-3 text-text-primary">Connect Wallet</h3>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    try {
                      await connectWallet('pera');
                      setShowWalletModal(false);
                    } catch (error) {
                      console.error('Error connecting to Pera:', error);
                    }
                  }}
                  className="w-full flex items-center p-2.5 border border-surface-hover rounded-lg hover:bg-dark transition-colors"
                >
                  <div className="w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center mr-2.5">
                    <span className="text-dark font-bold text-xs">P</span>
                  </div>
                  <span className="font-medium text-text-primary text-sm">Pera Wallet</span>
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
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Your Profile</h1>
      
      {/* Wallet Information Modal */}
      <Dialog.Root open={showWalletModal} onOpenChange={setShowWalletModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-2xl shadow-2xl p-0 w-full max-w-2xl z-50 max-h-[90vh] border border-surface-hover">
            <div className="overflow-y-auto max-h-[90vh] scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Header */}
            <div className="sticky top-0 bg-dark p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-dark/30 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-dark" />
                  </div>
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-yellow-400 ">
                      Wallet Information
                    </Dialog.Title>
                    <p className="text-dark/70 text-sm ">Algorand TestNet</p>
                  </div>
                </div>
                <Dialog.Close asChild>
                  <button className="text-dark/70 hover:text-dark transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Balance Section */}
              <div className="bg-gradient-to-br from-dark to-surface rounded-xl p-6 border border-primary-400/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-primary-400" />
                    <h3 className="font-semibold text-text-primary">Total Balance</h3>
                  </div>
                  <Activity className="w-5 h-5 text-primary-400 animate-pulse" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold text-text-primary">
                    {formatAlgoAmount(userBalance)}
                  </span>
                  <span className="text-lg text-text-secondary">ALGO</span>
                </div>
                <p className="text-sm text-text-secondary mt-2">
                  {(userBalance / 1000000).toFixed(6)} ALGO
                </p>
              </div>

              {/* Coin Information */}
              <div className="bg-dark rounded-xl border border-surface-hover p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <span className="text-dark font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-lg">Algorand</h3>
                    <p className="text-sm text-text-secondary">ALGO · Native Token</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-xs text-text-muted mb-1">Network</p>
                    <p className="font-semibold text-text-primary">TestNet</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-xs text-text-muted mb-1">Type</p>
                    <p className="font-semibold text-text-primary">Layer 1</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-xs text-text-muted mb-1">Standard</p>
                    <p className="font-semibold text-text-primary">ASA</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-xs text-text-muted mb-1">Decimals</p>
                    <p className="font-semibold text-text-primary">6</p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-dark rounded-xl border border-surface-hover p-6">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Wallet Address
                </h3>
                <div className="bg-surface rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-text-secondary break-all">{address}</span>
                    <button
                      onClick={copyAddress}
                      className="ml-2 p-2 hover:bg-dark rounded-lg transition-colors flex-shrink-0"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-text-secondary" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-surface-hover">
                    <span className="text-xs text-text-muted">Short format:</span>
                    <span className="font-mono text-sm text-text-primary">{formatAlgorandAddress(address || '')}</span>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-dark rounded-xl border border-surface-hover p-6">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Activity Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-surface rounded-lg border border-primary-400/20">
                    <p className="text-2xl font-bold text-primary-400">{transactions.length}</p>
                    <p className="text-xs text-text-secondary mt-1">Total Txns</p>
                  </div>
                  <div className="text-center p-3 bg-surface rounded-lg border border-success/20">
                    <p className="text-2xl font-bold text-success">{userVotingHistory.length}</p>
                    <p className="text-xs text-text-secondary mt-1">Votes Cast</p>
                  </div>
                  <div className="text-center p-3 bg-surface rounded-lg border border-error/20">
                    <p className="text-2xl font-bold text-error">
                      {transactions.filter(tx => tx.type === 'create').length}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">Proposals</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://testnet.explorer.perawallet.app/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-dark rounded-lg hover:bg-primary-400 transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </a>
                <button
                  onClick={handleDisconnect}
                  className="flex-1 px-4 py-3 border-2 border-error text-error rounded-lg hover:bg-error/10 transition-colors font-medium"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-primary-400" />
                </div>
                
                <h2 className="text-xl font-semibold text-text-primary mb-1">Wallet Address</h2>
                <div className="flex flex-col items-center justify-center text-sm text-text-secondary mb-4">
                  <span className="font-mono text-xs mb-2">{formatAlgorandAddress(address || '')}</span>
                  <span className="font-mono text-xs text-text-muted mb-2">{address}</span>
                  <a 
                    href={`https://testnet.explorer.perawallet.app/address/${address}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                <div className="w-full">
                  <Button onClick={() => setShowWalletModal(true)} variant="outline" fullWidth>
                    Manage Wallet
                  </Button>
                </div>
              </div>
              
              <Separator.Root className="h-px bg-surface-hover my-6" />
              
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Governance Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Votes Cast:</span>
                    <span className="font-medium text-text-primary">{userVotingHistory.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Votes For:</span>
                    <span className="font-medium text-success">
                      {userVotingHistory.filter(h => h && h.vote === 'for').length}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Votes Against:</span>
                    <span className="font-medium text-error">
                      {userVotingHistory.filter(h => h && h.vote === 'against').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-6">Voting History</h2>
              
              {userVotingHistory.length === 0 ? (
                <div className="text-center py-6 bg-dark rounded-lg border border-surface-hover">
                  <Vote className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-text-primary mb-1">No Voting History</h3>
                  <p className="text-text-secondary mb-4">You haven't voted on any proposals yet.</p>
                  <Link to="/vote">
                    <Button>Start Voting</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userVotingHistory.map((historyItem) => historyItem && (
                    <div key={historyItem.proposalId} className="bg-dark rounded-lg p-4 border border-surface-hover">
                      <div className="flex justify-between items-start mb-2">
                        <Link 
                          to={`/proposals/${historyItem.proposalId}`}
                          className="text-lg font-medium text-text-primary hover:text-primary-400"
                        >
                          {historyItem.proposalTitle}
                        </Link>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${
                          historyItem.vote === 'for' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                        }`}>
                          {historyItem.vote === 'for' ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Voted for
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Voted against
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-text-secondary">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatDate(historyItem.timestamp)}</span>
                        </div>
                        
                        {getTransactionForProposal(historyItem.proposalId) && (
                          <a 
                            href={getExplorerUrl(getTransactionForProposal(historyItem.proposalId)!.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-400 hover:text-primary-300 flex items-center"
                          >
                            View on Blockchain
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
          
          {/* Blockchain Transactions Section */}
          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary-400" />
                Blockchain Transactions
              </h2>
              
              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-surface border border-primary-400/30 rounded text-xs text-text-secondary">
                  <strong className="text-primary-400">Debug Info:</strong><br/>
                  Total transactions: {transactions.length}<br/>
                  Valid transactions: {validTransactions.length}<br/>
                  Transaction hashes: {transactions.map(tx => 
                    tx.hash ? (tx.hash.substring(0, 10) + '...') : 'undefined'
                  ).join(', ')}
                </div>
              )}
              
              {transactions.length === 0 ? (
                <div className="text-center py-6 bg-dark rounded-lg border border-surface-hover">
                  <Database className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-text-primary mb-1">No Blockchain Transactions</h3>
                  <p className="text-text-secondary mb-4">You haven't made any blockchain transactions yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-surface-hover">
                    <thead className="bg-dark">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          Transaction Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                          Proposal
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-surface-hover">
                      {(process.env.NODE_ENV === 'development' ? transactions : validTransactions.length > 0 ? validTransactions : transactions).map((tx: TransactionInfo) => {
                        const proposal = tx.proposalId !== '0'
                          ? proposals.find(p => p.id === tx.proposalId)
                          : null;
                          
                        return (
                          <tr key={tx.hash}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                tx.type === 'vote' ? 'bg-primary-500/20 text-primary-400' : 'bg-error/20 text-success'
                              }`}>
                                {tx.type === 'vote' ? 'Vote' : 'Create Proposal'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                              {formatDate(tx.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                              {proposal ? (
                                <Link 
                                  to={`/proposals/${proposal.id}`}
                                  className="text-primary-400 hover:text-primary-300"
                                >
                                  {proposal.title}
                                </Link>
                              ) : (
                                <span>New Proposal</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <a
                                href={getExplorerUrl(tx.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-400 hover:text-primary-300 flex items-center justify-end"
                              >
                                View <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;