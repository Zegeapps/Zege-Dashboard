import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HeroHeader from './components/HeroHeader';
import HomePage from './pages/HomePage';
import TaskPage from './pages/TaskPage';
import FilesPage from './pages/FilesPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import SplashScreen from './components/SplashScreen';
import { isAuthenticated } from './services/authService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useSwipe from './hooks/useSwipe';
import styles from './App.module.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Protected({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

const DASHBOARD_PAGES = ['/', '/task', '/files'];

function SwipeWrapper({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSwipeLeft = () => {
    const currentIndex = DASHBOARD_PAGES.indexOf(pathname);
    if (currentIndex !== -1 && currentIndex < DASHBOARD_PAGES.length - 1) {
      navigate(DASHBOARD_PAGES[currentIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = DASHBOARD_PAGES.indexOf(pathname);
    if (currentIndex !== -1 && currentIndex > 0) {
      navigate(DASHBOARD_PAGES[currentIndex - 1]);
    }
  };

  useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  });

  return children;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Show for 2 seconds
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Completely standalone — no layout, no nav */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Protected dashboard — AppLayout + HeroHeader */}
          <Route path="/*" element={
            <Protected>
              <SwipeWrapper>
                <AppLayout>
                  <HeroHeader />
                  <main className={styles.main}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/task" element={<TaskPage />} />
                      <Route path="/files" element={<FilesPage />} />
                    </Routes>
                  </main>
                </AppLayout>
              </SwipeWrapper>
            </Protected>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
