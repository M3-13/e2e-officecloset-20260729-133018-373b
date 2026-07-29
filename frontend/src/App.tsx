import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WardrobePage from './pages/WardrobePage';
import OutfitCreatorPage from './pages/OutfitCreatorPage';
import ImprintPage from './pages/ImprintPage';
import PrivacyPage from './pages/PrivacyPage';
import './styles/global.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return null;
  }
  if (isAuthenticated) {
    return <Navigate to="/wardrobe" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/wardrobe" replace />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/wardrobe"
          element={
            <ProtectedRoute>
              <WardrobePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/outfits"
          element={
            <ProtectedRoute>
              <OutfitCreatorPage />
            </ProtectedRoute>
          }
        />
        <Route path="/imprint" element={<ImprintPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 24,
          borderTop: '1px solid var(--color-border)',
          marginTop: 64,
          fontSize: 13,
        }}
      >
        <Link
          to="/imprint"
          style={{
            color: 'var(--color-muted)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
        >
          Impressum
        </Link>
        <Link
          to="/privacy"
          style={{
            color: 'var(--color-muted)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
        >
          Datenschutz
        </Link>
      </footer>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
