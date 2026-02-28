import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
            </Protected>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
