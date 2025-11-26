import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, XCircle, ArrowLeft, ExternalLink, Database, Loader } from 'lucide-react';
import { Proposal } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import * as Progress from '@radix-ui/react-progress';
import * as Separator from '@radix-ui/react-separator';
import { useAlgorand } from '../providers/AlgorandProvider';
import { useProposals } from '../providers/ProposalsProvider';

const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, connectWallet } = useAlgorand();
  const [showWalletModal, setShowWalletModal] = React.useState(false);
  const { proposals, voteFor, voteAgainst, userVotes, hasVoted, isVoting, transactions, getExplorerUrl } = useProposals();
  
  // Add debug logging for proposals
  console.log("Available proposals:", proposals.map(p => ({ id: p.id, title: p.title })));
  console.log("Current proposal ID from URL:", id);
  
  const proposal = proposals.find(p => String(p.id) === String(id));
  
  if (!proposal) {
    console.error("Proposal not found. ID:", id);
    console.log("Available IDs:", proposals.map(p => p.id));
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Proposal Not Found</h2>
          <p className="text-text-secondary mb-6">The proposal you are looking for does not exist or has been removed.</p>
          <Button onClick={() => navigate('/proposals')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </Button>
        </Card>
      </div>
    );
  }
  
  const totalVotes = proposal.votes.for + proposal.votes.against;
  const forPercentage = totalVotes > 0 ? (proposal.votes.for / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.votes.against / totalVotes) * 100 : 0;
  
  const formatDate = (date: Date | number) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const userVoteOnThisProposal = id ? userVotes[id] : undefined;
  const isVotingOnCurrentProposal = id ? isVoting[id] : false;
  
  // Debug transaction filtering
  console.log('=== PROPOSAL DETAIL TRANSACTION DEBUG ===');
  console.log('All transactions:', transactions);
  console.log('Transaction count:', transactions.length);
  console.log('Looking for proposal ID:', id);
  
  // Filter out dummy transactions with invalid hashes (Algorand format)
  const validTransactions = transactions.filter(tx => {
    const isValid = tx.hash && 
      typeof tx.hash === 'string' && 
      tx.hash.length >= 40 && // More lenient length check for Algorand hashes
      !tx.hash.includes('mock') &&
      !tx.hash.includes('dummy');
    
    console.log(`Transaction ${tx.hash}: valid = ${isValid}, proposalId = ${tx.proposalId}`);
    return isValid;
  });
  
  // Get transactions related to this proposal (use all transactions in development)
  const proposalTransactions = (process.env.NODE_ENV === 'development' ? 
    transactions.filter(tx => String(tx.proposalId) === String(id)) :
    validTransactions.filter(tx => String(tx.proposalId) === String(id))
  );
  
  console.log('Valid transactions:', validTransactions.length);
  console.log('Proposal transactions:', proposalTransactions.length);
  
  console.log(`ProposalDetail: Found ${proposalTransactions.length} transactions for proposal ${id}`);
  if (proposalTransactions.length > 0) {
    console.log("Transaction details:", proposalTransactions.map(tx => `${tx.hash} (${tx.type})`));
  }
  
  // Wallet-integrated vote functions
  const handleVoteFor = async () => {
    if (!id) return;
    
    try {
      if (!isConnected) {
        // Open wallet connection modal if not connected
        setShowWalletModal(true);
        return;
      }
      
      console.log("Initiating FOR vote on proposal:", id);
      
      // This will trigger the wallet transaction
      const result = await voteFor(id);
        console.log(`Vote FOR result:`, result);
        
        if (result && result.hash) {
          console.log(`Vote transaction successful with hash: ${result.hash}`);
          
        // No need to refresh immediately, let user see the success state
          setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error voting for proposal:', error);
      alert("Error submitting vote: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleVoteAgainst = async () => {
    if (!id) return;
    
    try {
      if (!isConnected) {
        // Open wallet connection modal if not connected
        setShowWalletModal(true);
        return;
      }
      
      console.log("Initiating AGAINST vote on proposal:", id);
      
      // This will trigger the wallet transaction
      const result = await voteAgainst(id);
        console.log(`Vote AGAINST result:`, result);
        
        if (result && result.hash) {
          console.log(`Vote transaction successful with hash: ${result.hash}`);
          
        // No need to refresh immediately, let user see the success state
          setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Error voting against proposal:', error);
      alert("Error submitting vote: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/proposals')}
          className="inline-flex items-center text-text-secondary hover:text-primary-400"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Proposals
        </button>
      </div>
      
      <Card>
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-text-primary">{proposal.title}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            proposal.status === 'active' ? 'bg-success/20 text-success' :
            proposal.status === 'upcoming' ? 'bg-primary-500/20 text-primary-400' :
            'bg-text-muted/20 text-text-muted'
          }`}>
            {proposal.status}
          </span>
        </div>
        
        <div className="text-sm text-text-secondary mb-6 flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Deadline: {formatDate(proposal.deadline)}</span>
          </div>
          
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
          </div>
          
          <div className="flex items-center">
            <span>Created by: {proposal.creator}</span>
          </div>
        </div>
        
        <div className="prose prose-primary max-w-none mb-6">
          <p className="text-text-secondary">{proposal.description}</p>
        </div>
        
        <Separator.Root className="h-px bg-gray-200 my-6" />
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Voting Results</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">For: <span data-for-count={proposal.id} data-testid={`for-votes-${proposal.id}`}>{proposal.votes.for}</span> votes ({forPercentage.toFixed(1)}%)</span>
                </div>
                <span className="text-sm text-gray-500">{forPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <Progress.Root className="w-full h-full relative overflow-hidden rounded-full" value={forPercentage}>
                  <Progress.Indicator
                    className="h-full bg-green-500 transition-all duration-500 ease-in-out"
                    style={{ width: `${forPercentage}%` }}
                  />
                </Progress.Root>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center text-red-600">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Against: <span data-against-count={proposal.id} data-testid={`against-votes-${proposal.id}`}>{proposal.votes.against}</span> votes ({againstPercentage.toFixed(1)}%)</span>
                </div>
                <span className="text-sm text-gray-500">{againstPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <Progress.Root className="w-full h-full relative overflow-hidden rounded-full" value={againstPercentage}>
                  <Progress.Indicator
                    className="h-full bg-red-500 transition-all duration-500 ease-in-out"
                    style={{ width: `${againstPercentage}%` }}
                  />
                </Progress.Root>
              </div>
            </div>
          </div>
        </div>
        
        {/* Blockchain Transactions Section */}
        {proposalTransactions.length > 0 || (process.env.NODE_ENV === 'development' && transactions.length > 0) ? (
          <>
            <Separator.Root className="h-px bg-gray-200 my-6" />
            
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary-500" />
                Blockchain Transactions
              </h2>
              
              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-3 bg-dark rounded text-xs">
                  <strong>Debug Info:</strong><br/>
                  Total transactions: {transactions.length}<br/>
                  Valid transactions: {validTransactions.length}<br/>
                  Proposal transactions: {proposalTransactions.length}<br/>
                  Looking for proposal ID: {id}
                </div>
              )}
              
              <div className="space-y-4">
                {(proposalTransactions.length > 0 ? proposalTransactions : 
                  transactions.filter(tx => String(tx.proposalId) === String(id))
                ).map((tx) => (
                  <div key={tx.hash || `${tx.type}-${tx.timestamp}`} className="bg-dark rounded-lg p-4 border border-surface-hover">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'vote' ? 'bg-primary-500/20 text-primary-400' : 'bg-success/20 text-success'
                      }`}>
                        {tx.type === 'vote' ? 'Vote Transaction' : 'Create Proposal'}
                      </span>
                      {tx.hash && (
                        <a 
                          href={getExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300"
                          data-testid="blockchain-link"
                        >
                          <Button variant="ghost" size="sm" className="py-1 h-7 flex items-center">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View on Blockchain
                          </Button>
                        </a>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs text-text-muted mb-1">Transaction Hash:</div>
                      <div className="flex items-center">
                        <code className="text-xs font-mono bg-surface p-1 rounded text-text-secondary overflow-x-auto max-w-full">
                          {tx.hash || 'Processing...'}
                        </code>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs text-text-muted">Timestamp:</div>
                      <div className="text-xs text-text-secondary">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : userVoteOnThisProposal ? (
          <>
            <Separator.Root className="h-px bg-gray-200 my-6" />
            
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary-500" />
                Blockchain Transactions
              </h2>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Transaction Display Issue</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Your vote has been recorded, but we're unable to display the blockchain transaction hash.
                      This may happen during testing or if the transaction wasn't properly processed.
                      Your vote counts in the totals above.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-sm font-medium text-amber-800 hover:text-amber-900"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
        
        {proposal.status === 'active' && (
          <>
            <Separator.Root className="h-px bg-gray-200 my-6" />
            
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Cast Your Vote</h2>
              
              {!isConnected ? (
                <div className="text-center p-6 bg-dark rounded-lg">
                  <p className="text-text-secondary mb-4">You need to connect your wallet to vote on this proposal.</p>
                  <Button onClick={() => setShowWalletModal(true)}>
                    Connect Wallet
                  </Button>
                </div>
              ) : id && hasVoted(id) && !isVotingOnCurrentProposal ? (
                <div className="text-center p-6 bg-success/10 rounded-lg border border-success/30" id="vote-success-message">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-text-primary mb-1">Vote Successfully Cast</h3>
                  <p className="text-text-secondary mb-2">Thank you for participating in governance!</p>
                  <p className="text-sm font-medium text-text-primary">
                    {userVoteOnThisProposal === 'for' ? 
                      'You voted FOR this proposal' : 
                      'You voted AGAINST this proposal'}
                  </p>
                </div>
              ) : (
                <div className="flex gap-4" id="vote-container">
                  {isVotingOnCurrentProposal ? (
                    <div className="w-full text-center p-4 bg-dark rounded-lg">
                      <div className="flex items-center justify-center">
                        <Loader className="w-5 h-5 animate-spin mr-2 text-primary-400" />
                        <span className="text-text-primary">Processing your vote on the blockchain...</span>
                      </div>
                      <p className="text-sm text-text-secondary mt-2">
                        Please wait while your transaction is being processed. This may take a few moments.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700" 
                        onClick={handleVoteFor}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Vote For
                      </Button>
                      <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700" 
                        onClick={handleVoteAgainst}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Vote Against
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {isConnected && (
              <p className="text-sm text-text-secondary mt-4">
                Note: Voting requires a blockchain transaction to be signed with your wallet. 
                Please make sure your wallet is properly connected to the network.
              </p>
            )}
          </>
        )}
      </Card>

      {/* Wallet Selection Modal */}
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

export default ProposalDetail;