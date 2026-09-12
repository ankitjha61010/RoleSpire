import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { SavedJobsProvider } from './context/SavedJobsContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { AlertsProvider } from './context/AlertsContext';
import { CommunityProvider } from './context/CommunityContext';
import { ChatProvider } from './context/ChatContext';
import { Navbar, NavPage } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ForYouPage } from './pages/ForYouPage';
import { CommunityPage } from './pages/CommunityPage';
import { MessagesPage } from './pages/MessagesPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { SavedJobsPage } from './pages/SavedJobsPage';
import { ComparePage } from './pages/ComparePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { JobDetailsModal } from './components/jobs/JobDetailsModal';
import { JobComparisonTray } from './components/jobs/JobComparisonTray';
import { FloatingChatWidget } from './components/chat/FloatingChatWidget';
import { Job, JobFilters, JobSortOption, PostAuthor } from './types';
import { jobAggregator } from './services/jobProviders/jobAggregator';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { CompanyData, MOCK_COMPANIES } from './services/mockCompanies';

const MainApp: React.FC = () => {
  const { profile } = useAuth();

  const [activePage, setActivePage] = useState<NavPage>('home');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewingAuthor, setViewingAuthor] = useState<PostAuthor | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);

  // Search & Filter State
  const [filters, setFilters] = useState<JobFilters>({});
  const [sortOption, setSortOption] = useState<JobSortOption>('best_match');

  // Aggregated Jobs State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isRealApiActive, setIsRealApiActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch / Score Jobs on filter or profile change
  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      try {
        const result = await jobAggregator.searchJobs(filters, profile, sortOption);
        setJobs(result.jobs);
        setDuplicateCount(result.duplicateCount);
        setIsRealApiActive(result.isRealApiActive);
      } catch (err) {
        console.error('Error querying job aggregator:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadJobs();
  }, [filters, profile, sortOption]);

  const handleUpdateFilters = (updated: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {activePage === 'home' && (
          <HomePage
            jobs={jobs}
            onSelectJob={(j) => setSelectedJob(j)}
            setActivePage={setActivePage}
            onSearchWithFilters={(f) => {
              setFilters(f);
            }}
          />
        )}

        {activePage === 'search' && (
          <SearchPage
            jobs={jobs}
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
            onSelectJob={(j) => setSelectedJob(j)}
            onSelectCompany={(comp) => {
              setSelectedCompany(comp);
              setActivePage('company-profile');
            }}
            onSelectAuthor={(author) => {
              setViewingAuthor(author);
              setActivePage('user-profile');
            }}
            sortOption={sortOption}
            setSortOption={setSortOption}
            totalCount={jobs.length}
            duplicateCount={duplicateCount}
            isRealApiActive={isRealApiActive}
            isLoading={isLoading}
          />
        )}

        {activePage === 'company-profile' && (
          <CompanyProfilePage
            company={selectedCompany}
            allJobs={jobs}
            onBack={() => setActivePage('search')}
            onSelectJob={(j) => setSelectedJob(j)}
            onSelectAuthor={(author) => {
              setViewingAuthor(author);
              setActivePage('user-profile');
            }}
          />
        )}

        {activePage === 'foryou' && (
          <ForYouPage
            jobs={jobs}
            onSelectJob={(j) => setSelectedJob(j)}
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'community' && (
          <CommunityPage 
            setActivePage={setActivePage} 
            onSelectAuthor={(author) => {
              setViewingAuthor(author);
              setActivePage('user-profile');
            }}
          />
        )}

        {activePage === 'user-profile' && (
          <UserProfilePage
            author={viewingAuthor}
            onBack={() => setActivePage('community')}
          />
        )}

        {activePage === 'messages' && (
          <MessagesPage setActivePage={setActivePage} />
        )}

        {activePage === 'applications' && <ApplicationsPage />}

        {activePage === 'saved' && (
          <SavedJobsPage
            allJobs={jobs}
            onSelectJob={(j) => setSelectedJob(j)}
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'compare' && (
          <ComparePage
            allJobs={jobs}
            onSelectJob={(j) => setSelectedJob(j)}
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'analytics' && <AnalyticsPage jobs={jobs} />}

        {activePage === 'alerts' && <AlertsPage />}

        {activePage === 'profile' && <ProfilePage />}
      </main>

      {/* Floating Job Comparison Matrix Tray */}
      <JobComparisonTray onOpenCompare={() => setActivePage('compare')} />

      {/* Floating Recruiter & Peer Chat Widget (Bottom Right) */}
      <FloatingChatWidget />

      {/* Mobile Bottom Navigation */}
      <MobileNav activePage={activePage} setActivePage={setActivePage} />

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onOpenCompare={() => setActivePage('compare')}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CommunityProvider>
          <ChatProvider>
            <ApplicationProvider>
              <SavedJobsProvider>
                <ComparisonProvider>
                  <AlertsProvider>
                    <MainApp />
                  </AlertsProvider>
                </ComparisonProvider>
              </SavedJobsProvider>
            </ApplicationProvider>
          </ChatProvider>
        </CommunityProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
