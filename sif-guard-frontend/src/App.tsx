<<<<<<< Updated upstream
import { useState, useEffect } from 'react';
=======
import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
>>>>>>> Stashed changes
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import type { TabId } from './components/layout/Navigation';
import { DashboardPage } from './pages/DashboardPage';
import { IngestionPage } from './pages/IngestionPage';
import { ReportsExplorerPage } from './pages/ReportsExplorerPage';
import { PrecursorClustersPage } from './pages/PrecursorClustersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { KnowledgeLSRPage } from './pages/KnowledgeLSRPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
<<<<<<< Updated upstream
=======
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';

const TAB_ORDER: TabId[] = [
  'dashboard',
  'facility',
  'ingestion',
  'explorer',
  'clusters',
  'analytics',
  'knowledge',
  'review',
];
>>>>>>> Stashed changes

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('sif_guard_theme') as 'dark' | 'light') || 'dark';
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
<<<<<<< Updated upstream
=======
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const mainContentRef = useRef<HTMLElement>(null);
>>>>>>> Stashed changes

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sif_guard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

<<<<<<< Updated upstream
  const handleNavigate = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Header theme={theme} onToggleTheme={toggleTheme} />
=======
  // Global Keyboard Shortcuts (Ctrl+K, '?', 'Esc', Tabs 1-8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl+K or Cmd+K everywhere
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (shortcutsOpen) {
          setShortcutsOpen(false);
        }
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
  }, [shortcutsOpen, commandPaletteOpen]);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        activeTab={activeTab}
      />
>>>>>>> Stashed changes

      <div style={{ display: 'flex', flex: 1 }}>
        <Navigation
          activeTab={activeTab}
          onTabChange={handleNavigate}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {activeTab === 'ingestion' && <IngestionPage onNavigate={handleNavigate} />}
          {activeTab === 'explorer' && <ReportsExplorerPage onNavigate={handleNavigate} />}
          {activeTab === 'clusters' && <PrecursorClustersPage onNavigate={handleNavigate} />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'knowledge' && <KnowledgeLSRPage />}
          {activeTab === 'review' && <ReviewQueuePage onNavigate={handleNavigate} />}
        </main>
      </div>
<<<<<<< Updated upstream
=======

      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />
>>>>>>> Stashed changes
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;

