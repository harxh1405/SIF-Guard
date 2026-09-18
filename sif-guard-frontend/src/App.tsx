import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import type { TabId } from './components/layout/Navigation';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const FacilityTwinPage = lazy(() => import('./pages/FacilityTwinPage').then((m) => ({ default: m.FacilityTwinPage })));
const IngestionPage = lazy(() => import('./pages/IngestionPage').then((m) => ({ default: m.IngestionPage })));
const ReportsExplorerPage = lazy(() => import('./pages/ReportsExplorerPage').then((m) => ({ default: m.ReportsExplorerPage })));
const PrecursorClustersPage = lazy(() => import('./pages/PrecursorClustersPage').then((m) => ({ default: m.PrecursorClustersPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const KnowledgeLSRPage = lazy(() => import('./pages/KnowledgeLSRPage').then((m) => ({ default: m.KnowledgeLSRPage })));
const ReviewQueuePage = lazy(() => import('./pages/ReviewQueuePage').then((m) => ({ default: m.ReviewQueuePage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./components/auth/AuthPage').then((m) => ({ default: m.AuthPage })));

const ModuleLoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '360px',
      width: '100%',
      gap: '12px',
      color: 'var(--text-secondary, #A8A099)',
    }}
  >
    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary, #FF7300)' }} />
    <span style={{ fontSize: '0.85rem', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
      LOADING MODULE...
    </span>
  </div>
);

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

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (
      (localStorage.getItem('sifguard-theme') as 'dark' | 'light') ||
      (localStorage.getItem('sif_guard_theme') as 'dark' | 'light') ||
      'light'
    );
  });
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  // Background Audio Controller for the entire platform ("Modi hai to Mumkin hai")
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.75;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    const startPlayback = () => {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          const handleFirstGesture = () => {
            audio
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {});
            window.removeEventListener('click', handleFirstGesture);
            window.removeEventListener('keydown', handleFirstGesture);
            window.removeEventListener('touchstart', handleFirstGesture);
          };
          window.addEventListener('click', handleFirstGesture, { once: true });
          window.addEventListener('keydown', handleFirstGesture, { once: true });
          window.addEventListener('touchstart', handleFirstGesture, { once: true });
        });
    };

    startPlayback();

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

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

  // Auto-collapse sidebar on smaller screens or high zoom
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1080) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      return (
        <Suspense fallback={<ModuleLoadingFallback />}>
          <AuthPage onBack={() => setShowAuth(false)} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<ModuleLoadingFallback />}>
        <LandingPage
          onEnterPlatform={() => setShowAuth(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </Suspense>
    );
  }

  // Authenticated: Show full existing SIF-Guard Application
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="/audio/bg_audio.webm" type="audio/webm" />
        <source src="/audio/bg_audio.m4a" type="audio/mp4" />
      </audio>

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        isPlaying={isPlaying}
        onToggleAudio={toggleAudio}
      />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Navigation
          activeTab={activeTab}
          onTabChange={handleNavigate}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <main ref={mainContentRef} className="app-main-content" style={{ flex: 1, minWidth: 0, padding: '24px 24px', overflowY: 'auto', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          <Suspense fallback={<ModuleLoadingFallback />}>
            {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
            {activeTab === 'facility' && <FacilityTwinPage theme={theme} />}
            {activeTab === 'ingestion' && <IngestionPage onNavigate={handleNavigate} />}
            {activeTab === 'explorer' && <ReportsExplorerPage onNavigate={handleNavigate} />}
            {activeTab === 'clusters' && <PrecursorClustersPage onNavigate={handleNavigate} />}
            {activeTab === 'analytics' && <AnalyticsPage onNavigate={handleNavigate} />}
            {activeTab === 'knowledge' && <KnowledgeLSRPage />}
            {activeTab === 'review' && <ReviewQueuePage onNavigate={handleNavigate} />}
          </Suspense>
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
