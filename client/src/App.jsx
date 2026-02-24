import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HeroHeader from './components/HeroHeader';
import HomePage from './pages/HomePage';
import TaskPage from './pages/TaskPage';
import FilesPage from './pages/FilesPage';
import styles from './App.module.css';


export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
