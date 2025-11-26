import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlgorand } from '../providers/AlgorandProvider';
import PreviewProposal from './PreviewProposal';
import { Proposal } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import * as Tabs from '@radix-ui/react-tabs';
import * as Separator from '@radix-ui/react-separator';
import { AlertCircle, Loader } from 'lucide-react';
import { useProposals } from '../providers/ProposalsProvider';
import * as Toast from '@radix-ui/react-toast';

const CreateProposal: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, address, connectWallet } = useAlgorand();
  const { createProposal, userBalance, canAffordProposalCreation, proposalCreationCost, formatAlgoAmount, checkUserBalance, isCreatingProposal } = useProposals();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [proposalData, setProposalData] = useState<Partial<Proposal>>({
    title: '',
    description: '',
    deadline: undefined,
    creator: '',
    votes: { for: 0, against: 0 },
    status: 'upcoming'
  });
  const [activeTab, setActiveTab] = useState('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Update creator address when connected
  useEffect(() => {
    if (isConnected && address) {
      console.log('Setting creator address:', address);
      setProposalData(prev => ({
        ...prev,
        creator: address
      }));
    } else {
      console.log('No address available:', { isConnected, address });
      setProposalData(prev => ({
        ...prev,
        creator: ''
      }));
    }
  }, [isConnected, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setToastMessage('Please connect your wallet first');
      setToastType('error');
      setToastOpen(true);
      return;
    }
    
    console.log('Submitting proposal with wallet:', { isConnected, address });

    if (!proposalData.title || !proposalData.description || !proposalData.deadline) {
      setToastMessage('Please fill in all fields');
      setToastType('error');
      setToastOpen(true);
      return;
    }

    // Make sure the deadline is in the future
    const now = new Date();
    if (proposalData.deadline && proposalData.deadline <= now) {
      setToastMessage('Deadline must be in the future');
      setToastType('error');
      setToastOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Creating proposal with deadline:', proposalData.deadline);
      console.log('Proposal data:', proposalData);
      
      // Use the blockchain createProposal function
      const result = await createProposal(
        proposalData.title || '',
        proposalData.description || '',
        proposalData.deadline as Date
      );
      
      // Check if proposal creation was successful
      if (result && result.success) {
        console.log('Proposal created successfully, txHash:', result.hash);
        setToastMessage('Proposal created successfully');
        setToastType('success');
        setToastOpen(true);
        
        // Navigate back to proposals list after successful creation
        setTimeout(() => {
          navigate('/proposals');
        }, 2000);
      } else {
        throw new Error('Failed to create proposal: No success response received');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      setToastMessage(error instanceof Error ? error.message : 'Failed to create proposal. Please try again.');
      setToastType('error');
      setToastOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const dateValue = e.target.value;
      if (!dateValue) {
        setProposalData({ ...proposalData, deadline: undefined });
        return;
      }
      
      const newDate = new Date(dateValue);
      if (isNaN(newDate.getTime())) {
        console.error('Invalid date:', dateValue);
        return;
      }
      
      console.log('Setting deadline to:', newDate);
      setProposalData({ ...proposalData, deadline: newDate });
    } catch (error) {
      console.error('Error parsing date:', error);
    }
  };

  // Preview functionality
  const handlePreviewClick = () => {
    if (!proposalData.title || !proposalData.description || !proposalData.deadline) {
      setToastMessage('Please fill in all fields before previewing');
      setToastType('error');
      setToastOpen(true);
      return;
    }
    setActiveTab('preview');
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Algorand Wallet Connection Required</h2>
          <p className="text-text-secondary mb-6">You need to connect your Algorand wallet to create a proposal.</p>
          <Button 
            onClick={() => setShowWalletModal(true)}
            size="lg"
          >
            Connect Algorand Wallet
          </Button>
        </Card>
        
        {/* Wallet Selection Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
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
                  className="w-full flex items-center p-3 border border-surface-hover rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-dark font-bold text-sm">P</span>
                  </div>
                  <span className="font-medium text-text-primary">Pera Wallet</span>
                </button>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="w-full mt-4 px-4 py-2 text-text-secondary border border-surface-hover rounded-lg hover:bg-surface-hover transition-colors"
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Create Proposal</h1>
        <p className="mt-2 text-text-secondary">Create a new proposal for the community to vote on.</p>
        
        {/* Balance and Cost Information */}
        <div className="mt-4 bg-surface border border-primary-400/30 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text-secondary">Proposal Creation Cost:</span>
            <span className="font-mono font-medium text-primary-400">{formatAlgoAmount(proposalCreationCost)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Your Balance:</span>
            <span className={`font-mono font-medium ${
              canAffordProposalCreation() ? 'text-success' : 'text-error'
            }`}>{formatAlgoAmount(userBalance)}</span>
          </div>
          {!canAffordProposalCreation() && (
            <div className="mt-3 text-xs text-error bg-error/10 p-2 rounded border border-error/30">
              ⚠️ Insufficient balance to create a proposal. You need at least {formatAlgoAmount(proposalCreationCost)}.
            </div>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex border-b border-surface-hover">
            <Tabs.Trigger 
              value="form" 
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'form' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Form
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="preview" 
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'preview' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Preview
            </Tabs.Trigger>
          </Tabs.List>

          <div className="p-6">
            <Tabs.Content value="form">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={proposalData.title}
                    onChange={(e) => setProposalData({ ...proposalData, title: e.target.value })}
                    className="w-full rounded-lg border border-surface-hover bg-dark text-text-primary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-text-muted"
                    placeholder="Enter proposal title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={4}
                    value={proposalData.description}
                    onChange={(e) => setProposalData({ ...proposalData, description: e.target.value })}
                    className="w-full rounded-lg border border-surface-hover bg-dark text-text-primary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-text-muted"
                    placeholder="Describe your proposal"
                  />
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-text-primary mb-1">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    id="deadline"
                    required
                    onChange={handleDateChange}
                    className="w-full rounded-lg border border-surface-hover bg-dark text-text-primary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                  {proposalData.deadline && (
                    <p className="text-xs text-text-secondary mt-1">
                      Selected deadline: {proposalData.deadline.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center pt-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting || isCreatingProposal || !canAffordProposalCreation() || !address}
                    className="disabled:opacity-50 disabled:cursor-not-allowed "
                  >
                    {isSubmitting || isCreatingProposal ? (
                      <>
                        <Loader className="animate-spin w-4 h-4 mr-2" /> 
                        {isCreatingProposal ? 'Processing Payment...' : 'Creating Proposal...'}
                      </>
                    ) : !address ? (
                      'Wallet Address Not Available'
                    ) : !canAffordProposalCreation() ? (
                      `Insufficient Balance (Need ${formatAlgoAmount(proposalCreationCost)})`
                    ) : (
                      `Create Proposal (${formatAlgoAmount(proposalCreationCost)})`
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="ml-4"
                    onClick={handlePreviewClick}
                  >
                    Preview
                  </Button>
                </div>
              </form>
            </Tabs.Content>

            <Tabs.Content value="preview">
              <div>
                <h2 className="text-lg font-medium text-text-primary mb-4">Proposal Preview</h2>
                <PreviewProposal proposal={proposalData} />
                
                <Separator.Root className="h-px bg-surface-hover my-6" />
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('form')}
                    className="mr-4"
                  >
                    Edit Proposal
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || isCreatingProposal || !canAffordProposalCreation()}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || isCreatingProposal ? (
                      <>
                        <Loader className="animate-spin w-4 h-4 mr-2" /> 
                        {isCreatingProposal ? 'Processing Payment...' : 'Creating Proposal...'}
                      </>
                    ) : !canAffordProposalCreation() ? (
                      `Insufficient Balance`
                    ) : (
                      `Submit Proposal (${formatAlgoAmount(proposalCreationCost)})`
                    )}
                  </Button>
                </div>
              </div>
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </Card>

      {/* Toast Notification */}
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          className={`${
            toastType === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
          } fixed bottom-4 right-4 z-50 rounded-lg shadow-lg border p-4 w-72`}
          open={toastOpen}
          onOpenChange={setToastOpen}
          duration={4000}
        >
          <Toast.Title className={`font-semibold ${
            toastType === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {toastType === 'success' ? 'Success' : 'Error'}
          </Toast.Title>
          <Toast.Description className={`text-sm mt-1 ${
            toastType === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {toastMessage}
          </Toast.Description>
        </Toast.Root>
        <Toast.Viewport />
      </Toast.Provider>
    </div>
  );
};

export default CreateProposal;