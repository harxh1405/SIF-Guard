import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import type { TabId } from './components/layout/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { FacilityTwinPage } from './pages/FacilityTwinPage';
import { IngestionPage } from './pages/IngestionPage';
import { ReportsExplorerPage } from './pages/ReportsExplorerPage';
import { PrecursorClustersPage } from './pages/PrecursorClustersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { KnowledgeLSRPage } from './pages/KnowledgeLSRPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { PageTransition } from './components/motion/PageTransition';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { ShieldAlert, Loader2 } from 'lucide-react';

const TAB_ORDER: TabId[] = [
  'dashboard',
  'facility',
  'ingestion',
  'explorer',
  'clusters',
  'analytics',
  'knowledge',
  'review',
  'design-system',
];

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (
      (localStorage.getItem('sifguard-theme') as 'dark' | 'light') ||
      (localStorage.getItem('sif_guard_theme') as 'dark' | 'light') ||
      'dark'
    );
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sifguard-theme', theme);
    localStorage.setItem('sif_guard_theme', theme);
  }, [theme]);

  const handleNavigate = (tab: TabId) => {
    setActiveTab(tab);
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Global Keyboard Shortcuts (Tabs 1-8, '?' for shortcuts modal, 'Esc' to close modal)
  useEffect(() => {
    if (!user) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && shortcutsOpen) {
        setShortcutsOpen(false);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= TAB_ORDER.length) {
          e.preventDefault();
          handleNavigate(TAB_ORDER[num - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsOpen, user]);

  // Loading state: Do not display dashboard content while authentication is resolving
  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary, #080706)',
          color: 'var(--text-primary, #F5F1EA)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 115, 0, 0.12)',
            border: '1px solid rgba(255, 115, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <ShieldAlert size={30} color="var(--primary, #FF7300)" />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--text-secondary, #A8A099)',
            fontSize: '0.9rem',
          }}
        >
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Verifying SIF-Guard session...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated: Show Landing Page by default, or Auth Page when requested
  if (!user) {
    if (showAuth) {
      return <AuthPage onBack={() => setShowAuth(false)} />;
    }
    return (
      <LandingPage
        onEnterPlatform={() => setShowAuth(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Authenticated: Show full existing SIF-Guard Application
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Navigation
          activeTab={activeTab}
          onTabChange={handleNavigate}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <main ref={mainContentRef} style={{ flex: 1, minWidth: 0, padding: '28px 36px', overflowY: 'auto', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          <AnimatePresence mode="wait">
            <PageTransition key={activeTab} tabKey={activeTab}>
              {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} theme={theme} />}
              {activeTab === 'facility' && <FacilityTwinPage theme={theme} />}
              {activeTab === 'ingestion' && <IngestionPage onNavigate={handleNavigate} />}
              {activeTab === 'explorer' && <ReportsExplorerPage onNavigate={handleNavigate} />}
              {activeTab === 'clusters' && <PrecursorClustersPage onNavigate={handleNavigate} />}
              {activeTab === 'analytics' && <AnalyticsPage onNavigate={handleNavigate} theme={theme} />}
              {activeTab === 'knowledge' && <KnowledgeLSRPage />}
              {activeTab === 'review' && <ReviewQueuePage onNavigate={handleNavigate} />}
              {activeTab === 'design-system' && <DesignSystemPage />}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
