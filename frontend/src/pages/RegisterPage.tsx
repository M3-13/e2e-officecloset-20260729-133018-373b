import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CSS = `
  .auth-page {
    min-height: calc(100vh - 64px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
  }
  .auth-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 40px;
    max-width: 440px;
    width: 100%;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  }
  .auth-card h1 {
    font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
    font-weight: 700;
    font-size: 28px;
    color: var(--color-accent);
    margin-bottom: 28px;
    text-align: center;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .auth-form label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    color: var(--color-muted);
  }
  .auth-error {
    color: var(--color-error);
    font-size: 14px;
    text-align: center;
  }
  .auth-footer {
    text-align: center;
    color: var(--color-muted);
    font-size: 14px;
    margin-top: 20px;
  }
  .auth-footer a {
    color: var(--color-accent);
    font-weight: 500;
  }
  .auth-footer a:hover {
    color: var(--color-accent_light);
  }
  .privacy-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: var(--color-muted);
    line-height: 1.4;
  }
  .privacy-checkbox input[type="checkbox"] {
    margin-top: 2px;
    width: 16px;
    height: 16px;
    accent-color: var(--color-accent);
    flex-shrink: 0;
  }
  .privacy-checkbox a {
    color: var(--color-accent);
    text-decoration: underline;
  }
  .privacy-checkbox a:hover {
    color: var(--color-accent_light);
  }
`;

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setSubmitting(true);
    try {
      await register(email, password, privacyAccepted);
      navigate('/wardrobe', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrierung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="auth-page">
        <div className="auth-card">
          <h1>Registrierung</h1>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              E-Mail
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Passwort
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label>
              Passwort bestätigen
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label className="privacy-checkbox">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
              />
              <span>
                Ich habe die{' '}
                <Link to="/privacy" target="_blank">Datenschutzerklärung</Link>{' '}
                gelesen und stimme der Verarbeitung meiner Daten zu.
              </span>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={submitting || !privacyAccepted}>
              {submitting ? 'Wird registriert...' : 'Registrieren'}
            </button>
          </form>
          <p className="auth-footer">
            Bereits registriert? <Link to="/login">Jetzt einloggen</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
