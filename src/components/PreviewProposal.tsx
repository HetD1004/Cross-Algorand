import React from 'react';
import { Calendar, Users, CheckCircle, XCircle } from 'lucide-react';
import { Proposal } from '../types';
import { Card } from './ui/Card';

interface PreviewProposalProps {
  proposal: Partial<Proposal>;
}

const PreviewProposal: React.FC<PreviewProposalProps> = ({ proposal }) => {
  const formatDate = (date?: Date) => {
    if (!date) return 'Deadline not set';
    
    // Make sure we're working with a proper Date object
    let dateObj = date;
    if (!(date instanceof Date) && typeof date === 'string') {
      dateObj = new Date(date);
    }
    
    try {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid date';
    }
  };

  return (
    <Card className="border border-dashed border-gray-300 bg-gray-50 p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{proposal.title || 'Untitled Proposal'}</h3>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Preview
        </span>
      </div>
      
      <div className="prose prose-sm max-w-none mb-4">
        <p className="text-gray-600">
          {proposal.description || 'No description provided'}
        </p>
      </div>
      
      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatDate(proposal.deadline)}</span>
        </div>
        
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2" />
          <span>0 votes</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>0 For</span>
          </div>
          
          <div className="flex items-center text-red-600">
            <XCircle className="w-4 h-4 mr-1" />
            <span>0 Against</span>
          </div>
        </div>
        
        <div className="mt-2 h-2 w-full bg-gray-100 rounded-full">
          <div className="h-full bg-gray-300 rounded-full" style={{ width: '0%' }}></div>
        </div>
      </div>
    </Card>
  );
};

export default PreviewProposal;