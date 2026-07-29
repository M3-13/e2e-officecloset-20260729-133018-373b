import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WardrobePage from './pages/WardrobePage';
import OutfitCreatorPage from './pages/OutfitCreatorPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/wardrobe" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/wardrobe" element={<WardrobePage />} />
        <Route path="/outfits" element={<OutfitCreatorPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
