import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProposalsList from './components/ProposalsList';
import CreateProposal from './components/CreateProposal';
import ProposalDetail from './components/ProposalDetail';
import VotePage from './components/VotePage';
import ResultsPage from './components/ResultsPage';
import ProfilePage from './components/ProfilePage';
import Settings from './components/Settings';
import { AlgorandProvider } from './providers/AlgorandProvider';
import { ProposalsProvider } from './providers/ProposalsProvider';

function App() {

  return (
    <AlgorandProvider>
      <ProposalsProvider initialProposals={[]}>
        <Router>
          <div className="min-h-screen bg-background">
            <Navigation />
            
            <Routes>
              <Route path="/" element={<ProposalsList title="Active Proposals" description="Vote on current proposals or create new ones for the community." filterStatus="active" />} />
              <Route path="/proposals" element={<ProposalsList title="All Proposals" description="Browse and vote on all community proposals." />} />
              <Route path="/proposals/:id" element={<ProposalDetail />} />
              <Route path="/create" element={<CreateProposal />} />
              <Route path="/vote" element={<VotePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </Router>
      </ProposalsProvider>
    </AlgorandProvider>
  );
}

export default App;