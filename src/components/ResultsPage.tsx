import React from 'react';
import { Card } from './ui/Card';
import * as Progress from '@radix-ui/react-progress';
import * as Separator from '@radix-ui/react-separator';
import { CheckCircle, XCircle, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProposals } from '../providers/ProposalsProvider';

const ResultsPage: React.FC = () => {
  const { proposals } = useProposals();
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colorMap = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      upcoming: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[status as keyof typeof colorMap]}`}>
        {status}
      </span>
    );
  };

  // Sort proposals: completed first, then active, then upcoming
  const sortedProposals = [...proposals].sort((a, b) => {
    const statusOrder = { completed: 0, active: 1, upcoming: 2 };
    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Voting Results</h1>
        <p className="mt-2 text-text-secondary">
          View the current results of all governance proposals and their status.
        </p>
      </div>

      {proposals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <XCircle className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-text-primary">No Proposals Found</h3>
          <p className="mt-1 text-text-secondary">There are no proposals to display results for.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedProposals.map(proposal => {
            const totalVotes = proposal.votes.for + proposal.votes.against;
            const forPercentage = totalVotes > 0 ? (proposal.votes.for / totalVotes) * 100 : 0;
            const againstPercentage = totalVotes > 0 ? (proposal.votes.against / totalVotes) * 100 : 0;
            
            return (
              <Card key={proposal.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Link
                      to={`/proposals/${proposal.id}`}
                      className="text-xl font-semibold text-text-primary hover:text-primary-400 transition-colors"
                    >
                      {proposal.title}
                    </Link>
                    {getStatusBadge(proposal.status)}
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Deadline: {formatDate(proposal.deadline)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                    </div>
                  </div>
                  
                  <Separator.Root className="h-px bg-gray-200 my-4" />
                  
                  <div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="font-medium">For: {proposal.votes.for} votes ({forPercentage.toFixed(1)}%)</span>
                          </div>
                          <span className="text-sm text-gray-500">{forPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                            <XCircle className="w-4 h-4 mr-2" />
                            <span className="font-medium">Against: {proposal.votes.against} votes ({againstPercentage.toFixed(1)}%)</span>
                          </div>
                          <span className="text-sm text-gray-500">{againstPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default ResultsPage;