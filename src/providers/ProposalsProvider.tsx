import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Proposal } from '../types';
import { useAlgorandGovernance, TransactionInfo } from '../blockchain/useAlgorandGovernance';
import { useNetwork } from './AlgorandProvider';

interface ProposalsContextType {
  proposals: Proposal[];
  voteFor: (proposalId: string) => Promise<any>;
  voteAgainst: (proposalId: string) => Promise<any>;
  createProposal: (title: string, description: string, deadline: Date) => Promise<any>;
  userVotes: Record<string, 'for' | 'against'>;
  hasVoted: (proposalId: string) => boolean;
  isLoading: boolean;
  isVoting: Record<string, boolean>;
  isCreatingProposal: boolean;
  transactions: TransactionInfo[];
  getExplorerUrl: (txHash: string) => string;
  userBalance: number;
  canAffordVoting: () => boolean;
  canAffordProposalCreation: () => boolean;
  votingCost: number;
  proposalCreationCost: number;
  formatAlgoAmount: (microAlgos: number | bigint) => string;
  checkUserBalance: () => Promise<number>;
  chain?: {
    id: number;
    name: string;
  };
}

const ProposalsContext = createContext<ProposalsContextType | undefined>(undefined);

export const useProposals = () => {
  const context = useContext(ProposalsContext);
  if (!context) {
    throw new Error('useProposals must be used within a ProposalsProvider');
  }
  return context;
};

interface ProposalsProviderProps {
  initialProposals: Proposal[];
  children: ReactNode;
}

export const ProposalsProvider = ({ initialProposals, children }: ProposalsProviderProps) => {
  const { chain } = useNetwork();
  const { 
    proposals: blockchainProposals,
    userVotes,
    isLoading,
    isVoting,
    isCreatingProposal,
    userBalance,
    canAffordVoting,
    canAffordProposalCreation,
    votingCost,
    proposalCreationCost,
    formatAlgoAmount,
    checkUserBalance,
    voteFor,
    voteAgainst,
    createProposal,
    hasVoted,
    transactions,
    getExplorerUrl
  } = useAlgorandGovernance();
  
  // Always prioritize blockchain proposals when connected
  const [mergedProposals, setMergedProposals] = useState<Proposal[]>(initialProposals);
  
  // Clear old mock data on initialization
  useEffect(() => {
    try {
      // Clear any old mock data first
      const keysToCheck = ['governdao_proposals', 'algorand_proposals', 'governdao_user_votes'];
      for (const key of keysToCheck) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          const hasMockData = data.some?.((p: any) => 
            p.creator?.includes('0x') || p.creator?.includes('ALGORANDADDRESSEXAMPLE')
          );
          if (hasMockData || key === 'governdao_user_votes') {
            console.log(`Clearing mock data from ${key}`);
            localStorage.removeItem(key);
          }
        }
      }
      
      // Start with empty proposals - let the blockchain hook handle loading
      setMergedProposals([]);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);
  
  useEffect(() => {
    if (blockchainProposals.length > 0) {
      // Use blockchain/user-created proposals
      console.log('Using blockchain/user-created proposals:', blockchainProposals);
      setMergedProposals(blockchainProposals);
    } else {
      // No proposals available - empty state
      setMergedProposals([]);
    }
  }, [blockchainProposals]);

  return (
    <ProposalsContext.Provider 
      value={{ 
        proposals: mergedProposals, 
        voteFor, 
        voteAgainst, 
        createProposal,
        userVotes, 
        hasVoted,
        isLoading,
        isVoting,
        isCreatingProposal,
        userBalance,
        canAffordVoting,
        canAffordProposalCreation,
        votingCost,
        proposalCreationCost,
        formatAlgoAmount,
        checkUserBalance,
        transactions,
        getExplorerUrl,
        chain: chain ? { id: chain.id === 'testnet-v1.0' ? 1 : 0, name: chain.name } : undefined
      }}
    >
      {children}
    </ProposalsContext.Provider>
  );
};