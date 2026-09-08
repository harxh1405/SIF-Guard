import { useState, useEffect, useRef } from 'react';
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
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';

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

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('sif_guard_theme') as 'dark' | 'light') || 'dark';
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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

  // Global Keyboard Shortcuts (Tabs 1-7, '?' for shortcuts modal, 'Esc' to close modal)
  useEffect(() => {
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
  }, [shortcutsOpen]);

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
          {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {activeTab === 'facility' && <FacilityTwinPage theme={theme} />}
          {activeTab === 'ingestion' && <IngestionPage onNavigate={handleNavigate} />}
          {activeTab === 'explorer' && <ReportsExplorerPage onNavigate={handleNavigate} />}
          {activeTab === 'clusters' && <PrecursorClustersPage onNavigate={handleNavigate} />}
          {activeTab === 'analytics' && <AnalyticsPage onNavigate={handleNavigate} />}
          {activeTab === 'knowledge' && <KnowledgeLSRPage />}
          {activeTab === 'review' && <ReviewQueuePage onNavigate={handleNavigate} />}
        </main>
      </div>

      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
