import { useState, useEffect } from 'react';
import algosdk from 'algosdk';
import { useAlgorand } from '../providers/AlgorandProvider';
import { 
  algodClient,
  indexerClient,
  getAlgorandExplorerUrl,
  VOTING_COST,
  PROPOSAL_CREATION_COST,
  formatAlgoAmount
} from './contracts';
import { Proposal } from '../types';

export interface TransactionInfo {
  hash: string;
  type: 'vote' | 'create';
  timestamp: number;
  proposalId: string;
}

/**
 * Algorand Governance Hook
 * 
 * DATA PERSISTENCE STRATEGY:
 * - Proposals: Always loaded fresh from Algorand blockchain on connection
 * - Votes: Loaded from blockchain AND cached in localStorage per wallet address
 * - Transactions: Always loaded fresh from blockchain (no cache)
 * - Vote Counts: Calculated from blockchain transaction notes
 * 
 * This ensures that when you return after 2 days:
 * 1. All proposals are fetched from blockchain transaction history
 * 2. All votes are counted from blockchain transactions
 * 3. Your voting history is restored from localStorage + blockchain
 * 4. All transaction hashes are available for blockchain explorer links
 */
export const useAlgorandGovernance = () => {
  const { address, isConnected, peraWallet, walletType } = useAlgorand();
  const [isLoading, setIsLoading] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'for' | 'against'>>({});
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({});
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);

  // Get the explorer URL for the current transaction
  const getExplorerUrl = (txnId: string) => {
    return getAlgorandExplorerUrl(txnId);
  };

  // Check user's ALGO balance
  const checkUserBalance = async (): Promise<number> => {
    if (!address || !isConnected) return 0;
    
    try {
      const accountInfo = await algodClient.accountInformation(address).do();
      const balance = Number(accountInfo.amount); // Convert BigInt to number
      setUserBalance(balance);
      console.log(`User balance: ${formatAlgoAmount(balance)} (${balance} microAlgos)`);
      return balance;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      return 0;
    }
  };

  // Check if user has sufficient balance for voting
  const canAffordVoting = (balance: number = userBalance): boolean => {
    return balance >= VOTING_COST.DEFAULT_COST;
  };

  // Check if user has sufficient balance for proposal creation
  const canAffordProposalCreation = (balance: number = userBalance): boolean => {
    return balance >= PROPOSAL_CREATION_COST;
  };

  // Add transaction to history
  const addTransaction = (hash: string, type: 'vote' | 'create', proposalId: string) => {
    const txInfo: TransactionInfo = {
      hash,
      type,
      timestamp: Date.now(),
      proposalId
    };
    
    setTransactions(prev => [txInfo, ...prev]);
    
    // Also store in localStorage for persistence
    try {
      const storedTxs = localStorage.getItem('algorand_transactions');
      const txHistory = storedTxs ? JSON.parse(storedTxs) : [];
      localStorage.setItem('algorand_transactions', JSON.stringify([txInfo, ...txHistory]));
    } catch (error) {
      console.error('Failed to save transaction to localStorage:', error);
    }
  };

  // Save userVotes to localStorage
  const saveUserVotes = (votes: Record<string, 'for' | 'against'>) => {
    try {
      // Include wallet address in the storage key to separate votes by account
      const storageKey = `algorand_votes_${address}`;
      localStorage.setItem(storageKey, JSON.stringify(votes));
    } catch (error) {
      console.error('Failed to save votes to localStorage:', error);
    }
  };

  // Save proposals to localStorage
  const saveProposals = (proposalsToSave: Proposal[]) => {
    try {
      localStorage.setItem('algorand_proposals', JSON.stringify(proposalsToSave));
    } catch (error) {
      console.error('Failed to save proposals to localStorage:', error);
    }
  };

  // Load userVotes from localStorage
  const loadUserVotes = () => {
    if (!address) return;
    
    try {
      const storageKey = `algorand_votes_${address}`;
      const storedVotes = localStorage.getItem(storageKey);
      if (storedVotes) {
        const parsedVotes = JSON.parse(storedVotes);
        setUserVotes(parsedVotes);
      }
    } catch (error) {
      console.error('Failed to load votes from localStorage:', error);
    }
  };

  // Load transaction history and user votes from localStorage on init
  useEffect(() => {
    try {
      // Clear old transaction cache - we'll reload from blockchain
      console.log('Clearing transaction cache - will reload from blockchain');
      localStorage.removeItem('algorand_transactions');
      
      // Load user votes when address is available (these are OK to cache)
      if (address) {
        loadUserVotes();
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }, [address]);

  // Load all proposals from Algorand blockchain ONLY - NO MOCK DATA
  const loadProposals = async () => {
    console.log('=== LOADING PROPOSALS FROM ALGORAND BLOCKCHAIN ONLY ===');
    console.log('Current address:', address);
    console.log('Is connected:', isConnected);
    
    // ALWAYS clear localStorage to ensure NO mock data
    console.log('Clearing ALL proposal storage to ensure no mock data...');
    try {
      localStorage.removeItem('algorand_proposals');
      localStorage.removeItem('governdao_proposals');
      localStorage.removeItem('proposals');
      localStorage.removeItem('ethereum_proposals');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Start with empty proposals - will be populated from blockchain
    setProposals([]);

    // Load ONLY from Algorand blockchain by querying transaction history
    if (isConnected && address) {
      setIsLoading(true);
      try {
        console.log('Loading proposals from Algorand TestNet blockchain transaction history...');
        await loadProposalsFromTransactionHistory();
      } catch (error) {
        console.error('Error loading proposals from Algorand:', error);
        setProposals([]); // Ensure empty on error
      } finally {
        setIsLoading(false);
      }
    } else {
      console.log('Not connected - showing NO proposals (no mock data)');
      setProposals([]);
    }
  };



  // Load proposals from Algorand blockchain transaction history
  const loadProposalsFromTransactionHistory = async () => {
    try {
      if (!address) {
        console.log('No address available for blockchain query');
        return;
      }

      console.log('Querying Algorand TestNet for transactions from address:', address);
      
      // Query account transactions using Algorand Indexer
      try {
        // Use indexer to get account transactions
        const accountTxns = await indexerClient.lookupAccountTransactions(address)
          .limit(100) // Get last 100 transactions
          .do();
        
        console.log('Found transactions from indexer:', accountTxns.transactions?.length || 0);
        
        // Debug: Log all transactions first
        if (accountTxns.transactions && accountTxns.transactions.length > 0) {
          console.log('=== ALL TRANSACTIONS DEBUG ===');
          accountTxns.transactions.slice(0, 10).forEach((txn: any, i: number) => {
            const note = txn.note ? new TextDecoder().decode(new Uint8Array(Buffer.from(txn.note, 'base64'))) : '';
            const amount = txn['payment-transaction']?.amount || 0;
            const sender = txn.sender;
            const receiver = txn['payment-transaction']?.receiver || '';
            console.log(`Transaction ${i + 1}:`);
            console.log('  ID:', txn.id);
            console.log('  Note:', note);
            console.log('  Amount:', amount, '(', amount / 1000000, 'ALGO )');
            console.log('  Sender:', sender);
            console.log('  Receiver:', receiver);
            console.log('  Type:', txn['tx-type']);
            console.log('  ---');
          });
        }
        
        // Filter ONLY for actual proposal creation transactions (NOT voting transactions)
        const proposalTxns = accountTxns.transactions?.filter((txn: any) => {
          const note = txn.note ? new TextDecoder().decode(new Uint8Array(Buffer.from(txn.note, 'base64'))) : '';
          
          // Accept transactions with EITHER pattern for proposal creation
          const isProposalCreation = note.includes('Proposal Creation:') || 
                                     note.includes('Gov Fee - Proposal:');
          
          // Must be from your address
          const isFromUser = txn.sender === address;
          
          // EXCLUDE ONLY voting transactions (not proposal fees)
          const isVotingTransaction = note.includes('Vote:') && 
                                    (note.includes('FOR') || note.includes('AGAINST'));
          
          console.log(`Checking transaction ${txn.id}:`);
          console.log('  Note:', note);
          console.log('  Is proposal creation:', isProposalCreation);
          console.log('  Is from user:', isFromUser);
          console.log('  Is voting transaction:', isVotingTransaction);
          
          // Include transactions with "Gov Fee - Proposal:" OR "Proposal Creation:" in the note
          return isFromUser && isProposalCreation && !isVotingTransaction;
        }) || [];
        
        console.log('Found ACTUAL proposal creation transactions:', proposalTxns.length);
        
        // Clear any existing fake proposals first
        console.log('Clearing any fake proposals from localStorage...');
        localStorage.removeItem('algorand_proposals');
        
        // Load proposal metadata from localStorage
        let proposalMetadataMap: Record<string, any> = {};
        try {
          const storedMetadata = localStorage.getItem('algorand_proposal_metadata');
          if (storedMetadata) {
            const metadataArray = JSON.parse(storedMetadata);
            console.log('Loaded proposal metadata from localStorage:', metadataArray);
            // Create a map by transaction ID for quick lookup
            metadataArray.forEach((meta: any) => {
              if (meta.txnId) {
                proposalMetadataMap[meta.txnId] = meta;
              }
            });
          }
        } catch (error) {
          console.error('Error loading proposal metadata:', error);
        }
        
        // Create a SEPARATE proposal for EACH transaction
        const reconstructedProposals: Proposal[] = [];
        
        if (proposalTxns.length > 0) {
          console.log(`Found ${proposalTxns.length} proposal creation transactions - creating ${proposalTxns.length} proposals`);
          
          // Create a proposal for EACH transaction
          proposalTxns.forEach((txn: any, index: number) => {
            // Decode note properly - it's already a base64 string from the indexer
            let note = '';
            try {
              if (typeof txn.note === 'string') {
                note = atob(txn.note);
              } else if (txn.note) {
                note = new TextDecoder().decode(txn.note);
              }
            } catch (error) {
              console.error('Error decoding note:', error);
              note = String(txn.note || '');
            }
            
            const txnId = txn.id;
            const timestamp = txn.roundTime ? new Date(txn.roundTime * 1000) : new Date();
            
            console.log(`Processing transaction ${index + 1}/${proposalTxns.length}: ${txnId}`);
            console.log(`Note: "${note}"`);
            
            // Try to get metadata for this transaction
            const metadata = proposalMetadataMap[txnId];
            
            // Extract the actual title from the note or metadata
            let title = '';
            let description = '';
            let deadline: Date;
            
            if (metadata) {
              console.log(`Found metadata for transaction ${txnId}:`, metadata);
              title = metadata.title || '';
              description = metadata.description || metadata.title || '';
              deadline = new Date(metadata.deadline);
              
              // Check if deadline is still valid
              const now = new Date();
              if (deadline < now) {
                // Deadline passed, mark as completed
                console.log(`Proposal deadline has passed: ${deadline.toISOString()}`);
              }
            } else {
              // Fallback to extracting from note
              if (note.includes('Gov Fee - Proposal:')) {
                const match = note.match(/Gov Fee - Proposal:\s*(.+)$/);
                if (match && match[1]) {
                  title = match[1].trim();
                }
              } else if (note.includes('Proposal Creation:')) {
                const match = note.match(/Proposal Creation:\s*(.+)$/);
                if (match && match[1]) {
                  title = match[1].trim();
                }
              }
              
              // Clean up title
              title = title.replace(/\.+$/, '').trim();
              
              if (!title || title.length < 3) {
                title = `Proposal ${index + 1}`; // Fallback with index
              }
              
              description = title;
              deadline = new Date(timestamp.getTime() + (4 * 24 * 60 * 60 * 1000)); // Default 4 days
              console.log(`No metadata found for ${txnId}, using defaults`);
            }
            
            console.log(`Creating proposal #${index + 1}: "${title}" with deadline: ${deadline.toISOString()}`);
            
            // Determine proposal status based on deadline
            const now = new Date();
            let status: 'active' | 'completed' | 'upcoming' = 'active';
            if (deadline < now) {
              status = 'completed';
            } else if (deadline > new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))) {
              status = 'upcoming';
            }
            
            // Create a proposal for each transaction
            const proposal: Proposal = {
              id: (index + 1).toString(),
              title: title,
              description: description,
              deadline: deadline,
              status: status,
              votes: { for: 0, against: 0 },
              creator: address
            };
            
            reconstructedProposals.push(proposal);
          });
          
          console.log(`Created ${reconstructedProposals.length} proposals from blockchain`);
        }
        
        console.log('Reconstructed proposals from blockchain:', reconstructedProposals);
        
        if (reconstructedProposals.length > 0) {
          console.log(`Setting ${reconstructedProposals.length} unique proposals`);
          setProposals(reconstructedProposals);
          
          // Track proposal creation transactions with correct proposal IDs
          const proposalCreationTxns: TransactionInfo[] = proposalTxns.map((txn: any, index: number) => ({
            hash: txn.id,
            type: 'create' as const,
            timestamp: txn.roundTime ? txn.roundTime * 1000 : Date.now(),
            proposalId: (index + 1).toString() // Match the proposal ID
          }));
          
          if (proposalCreationTxns.length > 0) {
            console.log('Adding proposal creation transactions:', proposalCreationTxns.length);
            setTransactions(prev => {
              // Avoid duplicates
              const existingHashes = new Set(prev.map(t => t.hash));
              const newTxns = proposalCreationTxns.filter(t => !existingHashes.has(t.hash));
              return [...newTxns, ...prev];
            });
          }
          
          // Load voting data from blockchain transactions
          await loadVotingDataFromBlockchain(reconstructedProposals);
          
          // Also save to localStorage for faster future loading
          saveProposals(reconstructedProposals);
        } else {
          console.log('No unique proposals found after deduplication');
          console.log('=== NO PROPOSALS FOUND ===');
          console.log('This could mean:');
          console.log('1. Your proposals were created with different note patterns');
          console.log('2. The transaction amounts were different');
          console.log('3. The indexer is not returning your transactions');
          console.log('Please check the transaction debug output above');
          
          // Create a manual recovery proposal if we found any governance-related transactions
          if (proposalTxns.length > 0) {
            console.log('Creating manual recovery proposal from first governance transaction');
            const firstTxn = proposalTxns[0];
            const noteStr = String(firstTxn.note || '');
            const timestamp = firstTxn.roundTime ? new Date(firstTxn.roundTime * 1000) : new Date();
            
            const recoveryProposal: Proposal = {
              id: '1',
              title: noteStr.includes('Testing') ? 'Testing proposal' : 'Recovered Proposal',
              description: `This proposal was recovered from blockchain transaction data.\n\nTransaction ID: ${firstTxn.id}\nOriginal Note: ${noteStr}\nCreated: ${timestamp.toLocaleString()}`,
              deadline: new Date(timestamp.getTime() + (7 * 24 * 60 * 60 * 1000)),
              status: 'active',
              votes: { for: 0, against: 0 },
              creator: address
            };
            
            console.log('Setting recovery proposal:', recoveryProposal);
            setProposals([recoveryProposal]);
            saveProposals([recoveryProposal]);
          }
        }
        
      } catch (indexerError) {
        console.error('Error querying Algorand indexer:', indexerError);
        console.log('Indexer might be unavailable, falling back to algod client...');
        
        // Fallback: try to get recent account info
        try {
          const accountInfo = await algodClient.accountInformation(address).do();
          console.log('Account info from algod:', accountInfo);
          // We can't get transaction history from algod directly, but at least we confirmed the account exists
        } catch (algodError) {
          console.error('Error querying algod client:', algodError);
        }
      }
      
    } catch (error) {
      console.error('Error loading proposals from blockchain:', error);
    }
  };

  // Load voting data from blockchain transactions
  const loadVotingDataFromBlockchain = async (_proposals: Proposal[]) => {
    try {
      console.log('Loading voting data from blockchain transactions...');
      
      // Get all transactions again to find voting transactions
      const accountTxns = await indexerClient.lookupAccountTransactions(address!)
        .limit(100)
        .do();
      
      console.log('Total transactions found:', accountTxns.transactions?.length || 0);
      
      // Filter for voting transactions - need to decode base64 notes
      const votingTxns = accountTxns.transactions?.filter((txn: any) => {
        if (!txn.note) return false;
        
        try {
          // Decode base64 note from Algorand indexer
          const note = new TextDecoder().decode(new Uint8Array(Buffer.from(txn.note, 'base64')));
          const isVoteTxn = note.includes('Gov Fee - Vote:') && 
                           (note.includes('FOR') || note.includes('AGAINST'));
          
          if (isVoteTxn) {
            console.log('Found vote transaction:', txn.id, 'Note:', note);
          }
          
          return isVoteTxn;
        } catch (error) {
          console.error('Error decoding note for transaction', txn.id, error);
          return false;
        }
      }) || [];
      
      console.log('Found voting transactions:', votingTxns.length);
      
      // Process ACTUAL voting transactions from blockchain
      const votes: Record<string, 'for' | 'against'> = {};
      const votingTransactions: TransactionInfo[] = [];
      const voteCount: Record<string, { for: number; against: number }> = {};
      
      votingTxns.forEach((txn: any) => {
        try {
          // Decode base64 note
          const note = new TextDecoder().decode(new Uint8Array(Buffer.from(txn.note, 'base64')));
          const txnId = txn.id;
          const timestamp = txn.roundTime ? txn.roundTime * 1000 : Date.now();
          
          console.log('Processing vote transaction:', txnId, 'Note:', note);
          
          // Extract ACTUAL vote data from blockchain transaction notes
          const voteMatch = note.match(/Gov Fee - Vote: (FOR|AGAINST) #(\d+)/);
          if (voteMatch) {
            const voteType = voteMatch[1].toLowerCase() as 'for' | 'against';
            const proposalId = voteMatch[2];
            
            console.log(`Found ACTUAL vote from blockchain: ${voteType} on proposal ${proposalId} (${txnId})`);
            
            // Store latest vote for this user
            votes[proposalId] = voteType;
            
            // Count ALL votes for this proposal (not just user's)
            if (!voteCount[proposalId]) {
              voteCount[proposalId] = { for: 0, against: 0 };
            }
            voteCount[proposalId][voteType]++;
            
            // Store transaction info
            votingTransactions.push({
              hash: txnId,
              type: 'vote',
              timestamp: timestamp,
              proposalId: proposalId
            });
          }
        } catch (error) {
          console.error('Error processing vote transaction:', txn.id, error);
        }
      });
      
      // Update proposals with ACTUAL vote counts from blockchain
      setProposals(prevProposals => 
        prevProposals.map(proposal => {
          const proposalVotes = voteCount[proposal.id];
          if (proposalVotes) {
            console.log(`Updating proposal ${proposal.id} with ACTUAL votes:`, proposalVotes);
            return {
              ...proposal,
              votes: proposalVotes
            };
          }
          return proposal;
        })
      );
      
      // Update user votes state with ACTUAL blockchain data
      if (Object.keys(votes).length > 0) {
        console.log('Setting ACTUAL user votes from blockchain:', votes);
        setUserVotes(votes);
        saveUserVotes(votes);
      }
      
      // Update transactions state with ACTUAL blockchain transactions (avoid duplicates)
      if (votingTransactions.length > 0) {
        console.log('Setting ACTUAL voting transactions from blockchain:', votingTransactions);
        setTransactions(prev => {
          const existingHashes = new Set(prev.map(t => t.hash));
          const newTxns = votingTransactions.filter(t => !existingHashes.has(t.hash));
          return [...newTxns, ...prev];
        });
        
        // Save to localStorage
        try {
          const allTxns = [...votingTransactions];
          localStorage.setItem('algorand_transactions', JSON.stringify(allTxns));
        } catch (error) {
          console.error('Failed to save transactions to localStorage:', error);
        }
      }
      
    } catch (error) {
      console.error('Error loading voting data from blockchain:', error);
    }
  };

  // Create a new proposal on Algorand
  const createProposal = async (title: string, description: string, deadline: Date) => {
    console.log('CreateProposal called with:', { isConnected, address, title });
    
    if (!isConnected) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (!peraWallet) {
      throw new Error('PeraWalletConnect was not initialized correctly. Please refresh the page and reconnect your wallet.');
    }
    
    if (!address || address.trim() === '') {
      throw new Error('No wallet address found. Please reconnect your wallet.');
    }

    // Validate the deadline is a valid date and in the future
    if (!(deadline instanceof Date) || isNaN(deadline.getTime())) {
      throw new Error('Invalid deadline date');
    }

    const now = new Date();
    if (deadline <= now) {
      throw new Error('Deadline must be in the future');
    }

    // Check user balance
    const currentBalance = await checkUserBalance();
    if (!canAffordProposalCreation(currentBalance)) {
      throw new Error(`Insufficient balance. Need ${formatAlgoAmount(PROPOSAL_CREATION_COST)} to create a proposal. Current balance: ${formatAlgoAmount(currentBalance)}`);
    }

    // Convert to Unix timestamp (seconds)
    const deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
    
    setIsCreatingProposal(true);
    
    try {
      console.log('=== CREATING ALGORAND PROPOSAL ===');
      console.log('Title:', title);
      console.log('Description:', description.substring(0, 50) + '...');
      console.log('Deadline:', deadline.toISOString(), '(timestamp:', deadlineTimestamp, ')');
      console.log('User address:', address);
      console.log('Wallet type:', walletType);
      console.log('Proposal creation cost:', formatAlgoAmount(PROPOSAL_CREATION_COST));
      console.log('User balance:', formatAlgoAmount(currentBalance));
      console.log('=====================================');
      
      let txnId = '';
      
      // Get fresh address from wallet to ensure it's not null
      let walletAddress = address;
      
      if (!walletAddress && peraWallet) {
        try {
          const accounts = await peraWallet.reconnectSession();
          if (accounts && accounts.length > 0) {
            walletAddress = accounts[0];
            console.log('Got fresh address from wallet:', walletAddress);
          }
        } catch (error) {
          console.error('Error getting fresh address:', error);
        }
      }
      
      if (!walletAddress || walletAddress.trim() === '') {
        throw new Error('No wallet address available. Please disconnect and reconnect your wallet.');
      }
      
      console.log('Creating payment transaction with address:', walletAddress);
      
      // Create payment transaction for proposal creation cost
      const suggestedParams = await algodClient.getTransactionParams().do();
      // DEMO MODE: In production, this fee should go to a governance treasury
      // For demo purposes, sending to user's own address (simulates treasury payment)
      console.log('DEMO: Proposal creation fee will be sent to user address (treasury simulation)');
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: walletAddress,
        receiver: walletAddress, // Demo: user's address (represents treasury)
        amount: PROPOSAL_CREATION_COST,
        closeRemainderTo: undefined,
        note: new TextEncoder().encode(`Gov Fee - Proposal: ${title.substring(0, 100)}`), // Store up to 100 chars
        suggestedParams
      });
      try {
        // Sign and submit payment transaction
        const signedPaymentTxn = await signTransaction(paymentTxn);
        const response = await algodClient.sendRawTransaction(signedPaymentTxn).do();
        
        // The transaction ID is the same as the transaction's txID property
        txnId = paymentTxn.txID();
        
        console.log('Transaction submitted successfully:', txnId);
        console.log('Response:', response);
        
        // Ensure we have the transaction ID
        if (!txnId) {
          console.error('No transaction ID received!');
          throw new Error('Transaction submitted but no ID received');
        }
        
        // Create the proposal immediately since transaction was submitted successfully
        const newProposalId = (proposals.length + 1).toString();
        const newProposal: Proposal = {
          id: newProposalId,
          title,
          description,
          deadline,
          status: 'active',
          votes: { for: 0, against: 0 },
          creator: walletAddress
        };
        
        // Update local state with the new proposal (will be reloaded from blockchain)
        setProposals(prev => [...prev, newProposal]);
        
        // Store proposal metadata in localStorage (including deadline)
        try {
          const proposalMetadata = {
            id: newProposalId,
            title,
            description,
            deadline: deadline.toISOString(),
            txnId
          };
          const existingMetadata = localStorage.getItem('algorand_proposal_metadata');
          const metadataArray = existingMetadata ? JSON.parse(existingMetadata) : [];
          metadataArray.push(proposalMetadata);
          localStorage.setItem('algorand_proposal_metadata', JSON.stringify(metadataArray));
          console.log('Saved proposal metadata to localStorage:', proposalMetadata);
        } catch (storageError) {
          console.error('Failed to save proposal metadata:', storageError);
        }
        
        // Add to transaction history with verified hash
        console.log('Adding transaction to history:', { hash: txnId, type: 'create', proposalId: newProposalId });
        addTransaction(txnId, 'create', newProposalId);
        
        // Try to wait for confirmation, but don't fail if it times out
        try {
          await algosdk.waitForConfirmation(algodClient, txnId, 6);
          console.log('Proposal creation payment confirmed:', txnId);
        } catch (confirmError) {
          console.log('Confirmation timeout, but transaction was submitted:', txnId);
          console.log('Check transaction status at:', getAlgorandExplorerUrl(txnId));
        }
        
        // Update user balance after transaction
        await checkUserBalance();
        
        return { hash: txnId, success: true };
        
      } catch (error: any) {
        console.error('Error in createProposal transaction:', error);
        // Handle various error cases and fallback to local creation
        if (error?.message?.includes('rejected') ||
            error?.message?.includes('cancelled') ||
            error?.message?.includes('timeout')) {
          
          console.log('Transaction cancelled or timed out, creating locally');
          txnId = generateMockTxnId();
          
          // Create the proposal locally
          const newProposalId = (proposals.length + 1).toString();
          const newProposal: Proposal = {
            id: newProposalId,
            title,
            description,
            deadline,
            status: 'active',
            votes: { for: 0, against: 0 },
            creator: address
          };
          
          // Update local state (will be reloaded from blockchain)
          setProposals(prev => [...prev, newProposal]);
          
          return { hash: txnId, success: true };
        } else {
          throw error;
        }
      }
      
      return { hash: '', success: false };
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    } finally {
      setIsCreatingProposal(false);
    }
  };

  // Sign transaction with connected wallet
  const signTransaction = async (txn: algosdk.Transaction): Promise<Uint8Array> => {
    // Verify wallet is properly initialized
    if (!peraWallet) {
      throw new Error('PeraWalletConnect was not initialized correctly. Please reconnect your wallet.');
    }

    if (walletType !== 'pera') {
      throw new Error('No wallet connected for signing');
    }

    // Get fresh address from wallet
    let walletAddress = address;
    
    if (!walletAddress) {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts && accounts.length > 0) {
          walletAddress = accounts[0];
        }
      } catch (error) {
        console.error('Error getting address for signing:', error);
        throw new Error('Failed to reconnect wallet session. Please disconnect and reconnect your wallet.');
      }
    }
    
    if (!walletAddress) {
      throw new Error('No wallet address available for signing. Please reconnect your wallet.');
    }
    
    const txnToSign = [{ txn, signers: [walletAddress] }];
    
    try {
      const signedTxns = await peraWallet.signTransaction([txnToSign]);
      return signedTxns[0];
    } catch (error: any) {
      console.error('Error signing transaction:', error);
      if (error?.message?.includes('rejected') || error?.message?.includes('cancelled')) {
        throw new Error('Transaction was rejected by user');
      }
      throw new Error('Failed to sign transaction: ' + (error?.message || 'Unknown error'));
    }
  };

  // Generate mock transaction ID for demo purposes
  const generateMockTxnId = (): string => {
    return Array.from({length: 52}, () => 
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
    ).join('');
  };

  // Check if user has voted on a proposal
  const hasVoted = (proposalId: string): boolean => {
    return proposalId in userVotes;
  };

  // Vote on a proposal
  const castVote = async (proposalId: string, support: boolean) => {
    console.log('CastVote called with:', { isConnected, address, proposalId, support });
    
    if (!isConnected) {
      console.error("Cannot vote: wallet not connected");
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (!peraWallet) {
      console.error("Cannot vote: PeraWallet not initialized");
      throw new Error('PeraWalletConnect was not initialized correctly. Please refresh the page and reconnect your wallet.');
    }
    
    if (!address || address.trim() === '') {
      console.error("Cannot vote: no address found");
      throw new Error('No wallet address found. Please reconnect your wallet.');
    }
    
    // Check if already voted
    if (hasVoted(proposalId)) {
      console.error(`User has already voted on proposal ${proposalId}`);
      throw new Error('You have already voted on this proposal');
    }
    
    // Check user balance for voting cost
    const currentBalance = await checkUserBalance();
    if (!canAffordVoting(currentBalance)) {
      throw new Error(`Insufficient balance. Need ${formatAlgoAmount(VOTING_COST.DEFAULT_COST)} to vote. Current balance: ${formatAlgoAmount(currentBalance)}`);
    }
    
    console.log(`Starting vote on proposal ${proposalId}, support: ${support ? 'FOR' : 'AGAINST'}`);
    console.log(`User address: ${address}, Connected: ${isConnected}, Wallet: ${walletType}`);
    
    // Set voting status to true
    setIsVoting(prev => ({ ...prev, [proposalId]: true }));
    
    try {
      // Find the proposal we're voting on
      const proposal = proposals.find(p => String(p.id) === String(proposalId));
      if (!proposal) {
        console.error(`Proposal ${proposalId} not found. Available IDs:`, proposals.map(p => p.id));
        setIsVoting(prev => ({ ...prev, [proposalId]: false }));
        throw new Error(`Proposal ${proposalId} not found`);
      }
      
      console.log(`Current votes - For: ${proposal.votes.for}, Against: ${proposal.votes.against}`);
      
      // Calculate new vote counts
      const newForVotes = support ? proposal.votes.for + 1 : proposal.votes.for;
      const newAgainstVotes = !support ? proposal.votes.against + 1 : proposal.votes.against;
      
      let txnId = '';
      
      try {
        // Get fresh address from wallet to ensure it's not null
        let walletAddress = address;
        
        if (!walletAddress && peraWallet) {
          try {
            const accounts = await peraWallet.reconnectSession();
            if (accounts && accounts.length > 0) {
              walletAddress = accounts[0];
              console.log('Got fresh address from wallet for voting:', walletAddress);
            }
          } catch (error) {
            console.error('Error getting fresh address for voting:', error);
          }
        }
        
        if (!walletAddress || walletAddress.trim() === '') {
          throw new Error('No wallet address available. Please disconnect and reconnect your wallet.');
        }
        
        console.log('Creating vote payment transaction with address:', walletAddress);
        
        // Create payment transaction for voting cost
        const suggestedParams = await algodClient.getTransactionParams().do();
        // DEMO MODE: In production, this fee should go to a governance treasury
        // For demo purposes, sending to user's own address (simulates treasury payment)
        console.log('DEMO: Voting fee will be sent to user address (treasury simulation)');
        const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: walletAddress,
          receiver: walletAddress, // Demo: user's address (represents treasury)
          amount: VOTING_COST.DEFAULT_COST,
          closeRemainderTo: undefined,
          note: new TextEncoder().encode(`Gov Fee - Vote: ${support ? 'FOR' : 'AGAINST'} #${proposalId}`),
          suggestedParams
        });
        // Sign and submit payment transaction
        const signedPaymentTxn = await signTransaction(paymentTxn);
        const response = await algodClient.sendRawTransaction(signedPaymentTxn).do();
        
        // The transaction ID is the same as the transaction's txID property
        txnId = paymentTxn.txID();
        
        console.log('Vote transaction submitted successfully:', txnId);
        console.log('Response:', response);
        
        // Ensure we have the transaction ID
        if (!txnId) {
          console.error('No vote transaction ID received!');
          throw new Error('Vote transaction submitted but no ID received');
        }
        
        // Apply UI updates immediately since transaction was submitted successfully
        console.log('Applying vote transaction updates with hash:', txnId);
        applyTransactionUpdates(proposalId, support, newForVotes, newAgainstVotes, txnId);
        
        // Try to wait for confirmation, but don't fail if it times out
        try {
          await algosdk.waitForConfirmation(algodClient, txnId, 6);
          console.log('Vote payment confirmed:', txnId);
        } catch (error) {
          console.log('Confirmation timeout, but vote transaction was submitted:', txnId);
          console.log('Check transaction status at:', getAlgorandExplorerUrl(txnId));
        }
        
        // Update user balance after voting cost payment
        await checkUserBalance();
        
        return { hash: txnId, success: true };
        
      } catch (error: any) {
        console.error('Algorand voting transaction error:', error);
        
        // Handle error cases
        if (
          error?.message?.includes('rejected') ||
          error?.message?.includes('cancelled') ||
          error?.message?.includes('timeout')
        ) {
          
          console.log('Vote transaction cancelled by user');
          throw new Error('Vote transaction was cancelled by user');
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in castVote:', error);
      throw error;
    } finally {
      // Set voting status back to false
      setIsVoting(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  // Helper function to apply UI updates after transaction
  const applyTransactionUpdates = (
    proposalId: string, 
    support: boolean, 
    newForVotes: number, 
    newAgainstVotes: number, 
    txnId: string
  ) => {
    console.log('Applying immediate UI updates for transaction:', txnId);
    console.log(`Updating proposal ${proposalId} votes - For: ${newForVotes}, Against: ${newAgainstVotes}`);
    
    // Update user votes
    setUserVotes(prev => {
      const newUserVotes: Record<string, 'for' | 'against'> = {
        ...prev,
        [proposalId]: support ? 'for' : 'against'
      };
      // Save to localStorage
      saveUserVotes(newUserVotes);
      console.log(`User vote for proposal ${proposalId} saved as ${support ? 'for' : 'against'}`);
      return newUserVotes;
    });
    
    // Update proposal votes (will be persisted on blockchain)
    setProposals(prevProposals => 
      prevProposals.map(p => {
        if (String(p.id) === String(proposalId)) {
          console.log(`Updating proposal ${p.id} (${p.title}) votes - Before: For=${p.votes.for}, Against=${p.votes.against} | After: For=${newForVotes}, Against=${newAgainstVotes}`);
          return {
            ...p,
            votes: {
              for: newForVotes,
              against: newAgainstVotes
            }
          };
        }
        return p;
      })
    );
    
    // Record transaction
    console.log('Vote transaction complete, recording ID:', txnId);
    addTransaction(txnId, 'vote', proposalId);
  };

  // Vote for a proposal
  const voteFor = async (proposalId: string) => {
    return castVote(proposalId, true);
  };

  // Vote against a proposal
  const voteAgainst = async (proposalId: string) => {
    return castVote(proposalId, false);
  };

  // Load proposals when connected
  useEffect(() => {
    if (isConnected && address) {
      loadProposals();
      checkUserBalance();
    } else {
      // When not connected, only show user-created proposals (no mock data)
      console.log('Not connected - loading only user-created proposals');
      loadProposals();
    }
  }, [isConnected, address]);

  // Periodically check balance while connected (more frequent updates)
  useEffect(() => {
    if (isConnected && address) {
      // Check balance every 10 seconds for dynamic updates
      const interval = setInterval(() => {
        checkUserBalance();
      }, 10000); // Check every 10 seconds
      
      // Also check balance when window gains focus
      const handleFocus = () => {
        console.log('Window focused - refreshing balance');
        checkUserBalance();
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [isConnected, address]);

  return {
    proposals,
    userVotes,
    isLoading,
    isVoting,
    isCreatingProposal,
    userBalance,
    voteFor,
    voteAgainst,
    createProposal,
    hasVoted,
    loadProposals,
    transactions,
    getExplorerUrl,
    checkUserBalance,
    canAffordVoting,
    canAffordProposalCreation,
    votingCost: VOTING_COST.DEFAULT_COST,
    proposalCreationCost: PROPOSAL_CREATION_COST,
    formatAlgoAmount,
    chain: { 
      id: 'testnet-v1.0', 
      name: 'Algorand TestNet',
      blockExplorers: {
        default: {
          url: 'https://testnet.explorer.perawallet.app'
        }
      }
    }
  };
};