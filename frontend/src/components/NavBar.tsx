import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CSS = `
  .navbar {
    background-color: rgba(13, 10, 7, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
    padding: 0 32px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .navbar-logo {
    font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
    color: var(--color-accent);
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-decoration: none;
  }
  .navbar-logo:hover {
    color: var(--color-accent_light);
  }
  .navbar-links {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .navbar-link {
    color: var(--color-muted);
    font-weight: 500;
    font-size: 14px;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .navbar-link:hover {
    color: var(--color-fg);
  }
  .navbar-link.active {
    color: var(--color-accent);
  }
  .navbar-user {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .navbar-user-email {
    color: var(--color-muted);
    font-size: 14px;
  }
  .navbar-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent);
    font-weight: 700;
    font-size: 16px;
    background: var(--color-surface);
    text-transform: uppercase;
  }
  .navbar-btn {
    font-weight: 600;
    font-size: 13px;
    padding: 6px 16px;
    border-radius: var(--radius-md);
    min-height: 36px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    background: transparent;
    color: var(--color-muted);
    border: 1px solid var(--color-border);
  }
  .navbar-btn:hover {
    color: var(--color-fg);
    border-color: var(--color-accent);
  }
`;

function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const avatarLetter = user?.email?.charAt(0) ?? '?';

  return (
    <>
      <style>{CSS}</style>
      <nav className="navbar">
        <NavLink to="/" className="navbar-logo">
          Wardrobe
        </NavLink>

        {isAuthenticated && (
          <div className="navbar-links">
            <NavLink
              to="/wardrobe"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Garderobe
            </NavLink>
            <NavLink
              to="/outfits"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            >
              Outfit Creator
            </NavLink>
          </div>
        )}

        <div className="navbar-user">
          {isAuthenticated ? (
            <>
              <span className="navbar-user-email">{user?.email}</span>
              <div className="navbar-avatar" title={user?.email}>
                {avatarLetter}
              </div>
              <button className="navbar-btn" onClick={handleLogout}>
                Abmelden
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar-link">
                Einloggen
              </NavLink>
              <NavLink
                to="/register"
                className="navbar-link"
                style={{ color: 'var(--color-accent)' }}
              >
                Registrieren
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

export default NavBar;
