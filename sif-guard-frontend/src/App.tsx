import { useState, useEffect } from 'react';
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

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('sif_guard_theme') as 'dark' | 'light') || 'dark';
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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

  const handleNavigate = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Header theme={theme} onToggleTheme={toggleTheme} />

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
    </div>
  );
}

export default App;

