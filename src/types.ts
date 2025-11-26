export interface Proposal {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  status: 'active' | 'completed' | 'upcoming';
  votes: {
    for: number;
    against: number;
  };
  creator: string;
}

export interface User {
  address: string;
  votingHistory: {
    proposalId: string;
    vote: 'for' | 'against';
    timestamp: Date;
  }[];
}