import algosdk from 'algosdk';

// Algorand TestNet configuration
export const ALGORAND_CONFIG = {
  // AlgoNode TestNet API
  algodServer: 'https://testnet-api.algonode.cloud',
  algodPort: 443,
  algodToken: '',
  
  // Indexer for querying
  indexerServer: 'https://testnet-idx.algonode.cloud',
  indexerPort: 443,
  indexerToken: '',
  
  // Network configuration
  genesisId: 'testnet-v1.0',
  genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
  
  // Explorer
  explorerUrl: 'https://testnet.explorer.perawallet.app'
};

// Initialize Algorand client
export const algodClient = new algosdk.Algodv2(
  ALGORAND_CONFIG.algodToken,
  ALGORAND_CONFIG.algodServer,
  ALGORAND_CONFIG.algodPort
);

// Initialize Indexer client
export const indexerClient = new algosdk.Indexer(
  ALGORAND_CONFIG.indexerToken,
  ALGORAND_CONFIG.indexerServer,
  ALGORAND_CONFIG.indexerPort
);

// Governance Smart Contract Application ID (will be set after deployment)
export const GOVERNANCE_APP_ID = 0; // Replace with actual App ID after deployment

// Voting cost configuration (in microAlgos - 1 ALGO = 1,000,000 microAlgos)
export const VOTING_COST = {
  MIN_COST: 500000, // 0.5 ALGO in microAlgos
  MAX_COST: 1000000, // 1.0 ALGO in microAlgos
  DEFAULT_COST: 750000 // 0.75 ALGO in microAlgos
};

// Application methods for governance contract
export const GOVERNANCE_METHODS = {
  CREATE_PROPOSAL: 'create_proposal',
  CAST_VOTE: 'cast_vote',
  GET_PROPOSAL: 'get_proposal',
  GET_PROPOSAL_COUNT: 'get_proposal_count',
  HAS_VOTED: 'has_voted'
};

// Proposal creation cost (in microAlgos)
export const PROPOSAL_CREATION_COST = 1000000; // 1 ALGO

// NOTE: In production, governance fees should go to a dedicated treasury address
// For demo purposes, fees are sent to user's own address (treasury simulation)

// Proposal status mapping
export const mapStatus = (status: number): 'upcoming' | 'active' | 'completed' => {
  switch (status) {
    case 0: return 'upcoming';
    case 1: return 'active';
    case 2: return 'completed';
    default: return 'upcoming';
  }
};

// Helper function to get explorer URL for transactions
export const getAlgorandExplorerUrl = (txnId: string): string => {
  return `${ALGORAND_CONFIG.explorerUrl}/tx/${txnId}`;
};

// Helper function to get explorer URL for applications
export const getApplicationExplorerUrl = (appId: number): string => {
  return `${ALGORAND_CONFIG.explorerUrl}/application/${appId}`;
};

// Helper function to format Algorand address for display
export const formatAlgorandAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to convert microAlgos to ALGO
export const microAlgosToAlgo = (microAlgos: number | bigint): number => {
  const numValue = typeof microAlgos === 'bigint' ? Number(microAlgos) : microAlgos;
  return numValue / 1000000;
};

// Helper function to convert ALGO to microAlgos
export const algoToMicroAlgos = (algo: number): number => {
  return Math.floor(algo * 1000000);
};

// Helper function to format ALGO amount for display
export const formatAlgoAmount = (microAlgos: number | bigint): string => {
  const algo = microAlgosToAlgo(microAlgos);
  return `${algo.toFixed(3)} ALGO`;
};