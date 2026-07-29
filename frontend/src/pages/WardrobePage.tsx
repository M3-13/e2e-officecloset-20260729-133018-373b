import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface ClothingItem {
  id: number;
  name: string;
  category: string;
  image_url: string;
  created_at: string;
}

const CATEGORIES = ['Oberteil', 'Hose', 'Schuhe', 'Accessoire', 'Kleid', 'Jacke'];
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CSS = `
:root {
  --color-bg: #0D0A07;
  --color-fg: #F5F0E8;
  --color-accent: #C9A84C;
  --color-accent_light: #DDBF6E;
  --color-accent_dark: #A8892E;
  --color-border: #2A2520;
  --color-muted: #8A8078;
  --color-surface: #1A1510;
  --color-surface_raised: #221C16;
  --color-error: #C0392B;
  --color-success: #3D8B40;
  --color-glow: rgba(201, 168, 76, 0.25);
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 999px;
}
* { box-sizing: border-box; margin: 0; }
body {
  background-color: var(--color-bg);
  color: var(--color-fg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.wardrobe-page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
.wardrobe-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 12px; }
.wardrobe-header h1 {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-weight: 700; font-size: clamp(28px, 5vw, 40px);
  color: var(--color-accent); letter-spacing: 1px; text-transform: uppercase;
}
.wardrobe-header-right { display: flex; align-items: center; gap: 16px; }
.user-email { color: var(--color-muted); font-size: 14px; }
.btn { font-weight: 600; padding: 12px 28px; border-radius: var(--radius-md); min-height: 48px; cursor: pointer; transition: all 0.2s ease; font-size: 14px; border: none; }
.btn-primary { background-color: var(--color-accent); color: var(--color-bg); }
.btn-primary:hover { background-color: var(--color-accent_light); box-shadow: 0 0 20px var(--color-glow); }
.btn-primary:active { background-color: var(--color-accent_dark); transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
.btn-secondary { background-color: transparent; color: var(--color-accent); border: 1.5px solid var(--color-accent); }
.btn-secondary:hover { background-color: rgba(201,168,76,0.1); box-shadow: 0 0 12px var(--color-glow); }
.btn-secondary:active { background-color: rgba(201,168,76,0.18); }
.upload-section { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 48px; }
.upload-section h2 { font-family: 'Playfair Display','Times New Roman',Georgia,serif; font-weight: 700; font-size: 20px; color: var(--color-accent); margin-bottom: 16px; }
.upload-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
.form-group { flex: 1 1 200px; }
.form-input, .form-select { width: 100%; background-color: var(--color-surface); color: var(--color-fg); border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 16px; font-size: 14px; min-height: 48px; transition: border-color 0.2s ease; }
.form-input::placeholder { color: var(--color-muted); }
.form-input:focus, .form-select:focus { border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-glow); outline: none; }
.form-select { appearance: none; padding-right: 40px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23C9A84C' d='M6 8L0 0h12z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; }
.form-group input[type="file"] { color: var(--color-muted); font-size: 14px; }
.form-group input[type="file"]::file-selector-button { background-color: transparent; color: var(--color-accent); border: 1.5px solid var(--color-accent); border-radius: var(--radius-md); padding: 8px 16px; margin-right: 12px; cursor: pointer; font-weight: 600; font-size: 13px; min-height: 40px; transition: all 0.2s ease; }
.form-group input[type="file"]::file-selector-button:hover { background-color: rgba(201,168,76,0.1); }
.category-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
.chip { background-color: var(--color-surface); color: var(--color-muted); border: 1px solid var(--color-border); border-radius: var(--radius-pill); padding: 8px 20px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
.chip:hover { border-color: rgba(201,168,76,0.5); color: var(--color-fg); }
.chip-active { background-color: var(--color-accent); color: var(--color-bg); border-color: var(--color-accent); font-weight: 600; }
.chip-active:hover { border-color: var(--color-accent); color: var(--color-bg); }
.garment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.garment-card { background-color: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; transition: all 0.3s ease; position: relative; }
.garment-card:hover { border-color: rgba(201,168,76,0.4); box-shadow: 0 8px 32px var(--color-glow); transform: translateY(-2px); }
.garment-delete { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; border: none; background-color: rgba(13,10,7,0.85); color: var(--color-muted); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; z-index: 2; line-height: 1; }
.garment-delete:hover { color: var(--color-error); background-color: rgba(13,10,7,0.95); }
.garment-image-wrapper { aspect-ratio: 3/4; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 8px; }
.garment-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.garment-info { display: flex; flex-direction: column; gap: 4px; }
.garment-name { font-weight: 500; color: var(--color-fg); font-size: 14px; }
.garment-category { color: var(--color-muted); font-size: 12px; }
.status-text { color: var(--color-muted); text-align: center; padding: 48px 0; font-size: 16px; }
.error-text { color: var(--color-error); font-size: 14px; margin-top: 8px; }
`;

async function postFormData(path: string, formData: FormData) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

function WardrobePage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchItems = useCallback(async (cat?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const path = cat
        ? `/api/wardrobe?category=${encodeURIComponent(cat)}`
        : '/api/wardrobe';
      const data: ClothingItem[] = await apiClient.get(path);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(selectedCategory);
  }, [fetchItems, selectedCategory]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || !imageFile) {
      setUploadError('Bitte alle Felder ausfüllen');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('category', category);
      formData.append('image', imageFile);
      const newItem: ClothingItem = await postFormData('/api/wardrobe', formData);
      setItems((prev) => [newItem, ...prev]);
      setName('');
      setCategory('');
      setImageFile(null);
      const fileInput = document.getElementById('image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await apiClient.del(`/api/wardrobe/${itemId}`);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch {
      /* silently handle delete errors */
    }
  };

  const imageUrl = (url: string) => `${BASE_URL}${url}`;

  return (
    <>
      <style>{CSS}</style>
      <div className="wardrobe-page">
        <header className="wardrobe-header">
          <h1>Meine Garderobe</h1>
          <div className="wardrobe-header-right">
            <span className="user-email">{user?.email}</span>
            <button className="btn btn-secondary" onClick={logout}>
              Abmelden
            </button>
          </div>
        </header>

        <section className="upload-section">
          <h2>Neues Kleidungsstück</h2>
          <form className="upload-form" onSubmit={handleUpload}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
              >
                <option value="">Kategorie wählen...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <input
                id="image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Lädt...' : 'Hochladen'}
            </button>
            {uploadError && <p className="error-text">{uploadError}</p>}
          </form>
        </section>

        <section className="wardrobe-gallery">
          <div className="category-filters">
            <button
              className={`chip ${selectedCategory === null ? 'chip-active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              Alle
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`chip ${selectedCategory === cat ? 'chip-active' : ''}`}
                onClick={() => setSelectedCategory((prev) => (prev === cat ? null : cat))}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && <p className="status-text">Lade Garderobe...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p className="status-text">
              Noch keine Kleidungsstücke. Lade dein erstes hoch!
            </p>
          )}

          {items.length > 0 && (
            <div className="garment-grid">
              {items.map((item) => (
                <div key={item.id} className="garment-card">
                  <button
                    className="garment-delete"
                    onClick={() => handleDelete(item.id)}
                    title="Löschen"
                  >
                    &times;
                  </button>
                  <div className="garment-image-wrapper">
                    <img
                      src={imageUrl(item.image_url)}
                      alt={item.name}
                      className="garment-image"
                    />
                  </div>
                  <div className="garment-info">
                    <span className="garment-name">{item.name}</span>
                    <span className="garment-category">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default WardrobePage;
