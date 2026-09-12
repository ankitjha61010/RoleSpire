import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileSectionsProvider } from './context/ProfileSectionsContext';
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
import { Job, JobFilters, JobSortOption } from './types';
import { jobAggregator } from './services/jobProviders/jobAggregator';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { CompanyPage } from './pages/CompanyPage';
import { CompanyRegisterPage } from './pages/CompanyRegisterPage';
import { DerivedCompany, findDerivedCompany } from './services/companyDirectory';

const MainApp: React.FC = () => {
  const { profile } = useAuth();

  const [activePage, setActivePage] = useState<NavPage>('home');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<DerivedCompany | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyPageOrigin, setCompanyPageOrigin] = useState<NavPage>('company-register');

  // Search & Filter State
  const [filters, setFilters] = useState<JobFilters>({});
  const [sortOption, setSortOption] = useState<JobSortOption>('best_match');

  // Aggregated Jobs State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch / Score Jobs on filter or profile change
  useEffect(() => {
    let isStale = false;

    async function loadJobs() {
      setIsLoading(true);
      try {
        const result = await jobAggregator.searchJobs(filters, profile, sortOption);
        // If the filters/profile/sort changed again while this request was in
        // flight, a newer effect run has already taken over — applying this
        // now-stale response would silently clobber the correct, newer result.
        if (isStale) return;
        setJobs(result.jobs);
        setDuplicateCount(result.duplicateCount);
      } catch (err) {
        if (!isStale) console.error('Error querying job aggregator:', err);
      } finally {
        if (!isStale) setIsLoading(false);
      }
    }

    loadJobs();

    return () => {
      isStale = true;
    };
  }, [filters, profile, sortOption]);

  const handleUpdateFilters = (updated: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleSelectCompanyByName = (companyName: string) => {
    const company = findDerivedCompany(jobs, companyName);
    if (!company) return;
    setSelectedCompany(company);
    setSelectedJob(null);
    setActivePage('company-profile');
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
            isLoading={isLoading}
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
              setViewingUserId(author.id);
              setActivePage('user-profile');
            }}
            sortOption={sortOption}
            setSortOption={setSortOption}
            totalCount={jobs.length}
            duplicateCount={duplicateCount}
            isLoading={isLoading}
          />
        )}

        {activePage === 'company-profile' && (
          <CompanyProfilePage
            company={selectedCompany}
            onBack={() => setActivePage('search')}
            onSelectJob={(j) => setSelectedJob(j)}
          />
        )}

        {activePage === 'foryou' && (
          <ForYouPage
            jobs={jobs}
            isLoading={isLoading}
            onSelectJob={(j) => setSelectedJob(j)}
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'community' && (
          <CommunityPage 
            setActivePage={setActivePage} 
            onSelectAuthor={(author) => {
              setViewingUserId(author.id);
              setActivePage('user-profile');
            }}
          />
        )}

        {activePage === 'user-profile' && (
          <UserProfilePage
            userId={viewingUserId}
            onBack={() => setActivePage('community')}
            onSelectCompanyId={(id) => {
              setSelectedCompanyId(id);
              setCompanyPageOrigin('user-profile');
              setActivePage('company-page');
            }}
          />
        )}

        {activePage === 'company-page' && (
          <CompanyPage
            companyId={selectedCompanyId}
            onBack={() => setActivePage(companyPageOrigin)}
          />
        )}

        {activePage === 'company-register' && (
          <CompanyRegisterPage
            onBack={() => setActivePage('profile')}
            onManageCompany={(id) => {
              setSelectedCompanyId(id);
              setCompanyPageOrigin('company-register');
              setActivePage('company-page');
            }}
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
        onSelectCompany={handleSelectCompanyByName}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileSectionsProvider>
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
        </ProfileSectionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
