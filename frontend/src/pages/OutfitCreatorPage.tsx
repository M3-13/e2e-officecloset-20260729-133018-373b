import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';

interface ClothingItem {
  id: number;
  name: string;
  category: string;
  image_url: string;
  created_at: string;
}

interface OutfitData {
  id: number;
  name: string;
  items: ClothingItem[];
  created_at: string;
}

const CATEGORY_ORDER = ['Oberteile', 'Hosen', 'Röcke', 'Kleider', 'Schuhe', 'Accessoires'];
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function OutfitCreatorPage() {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [droppedItemIds, setDroppedItemIds] = useState<number[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [outfits, setOutfits] = useState<OutfitData[]>([]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragItemRef = useRef<HTMLDivElement | null>(null);

  const loadWardrobe = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/wardrobe');
      setWardrobeItems(data);
    } catch {
      // wardrobe may be empty or unavailable
    }
  }, []);

  const loadOutfits = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/outfits');
      setOutfits(data);
    } catch {
      // outfits may be empty
    }
  }, []);

  useEffect(() => {
    loadWardrobe();
    loadOutfits();
  }, [loadWardrobe, loadOutfits]);

  const groupedByCategory = wardrobeItems.reduce<Record<string, ClothingItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const orderedCategories = CATEGORY_ORDER.filter((c) => groupedByCategory[c]);
  const otherCategories = Object.keys(groupedByCategory).filter((c) => !CATEGORY_ORDER.includes(c));
  const allCategories = [...orderedCategories, ...otherCategories];

  function toggleCategory(category: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function handleDragStart(e: React.DragEvent, item: ClothingItem) {
    dragItemRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.setData('application/item-id', String(item.id));
    e.dataTransfer.effectAllowed = 'copy';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const itemIdStr = e.dataTransfer.getData('application/item-id');
    if (!itemIdStr) return;
    const itemId = parseInt(itemIdStr, 10);
    if (isNaN(itemId)) return;
    if (droppedItemIds.includes(itemId)) return;
    setDroppedItemIds((prev) => [...prev, itemId]);
    setError('');
  }

  function removeDroppedItem(itemId: number) {
    setDroppedItemIds((prev) => prev.filter((id) => id !== itemId));
  }

  function getDroppedItems(): ClothingItem[] {
    return droppedItemIds
      .map((id) => wardrobeItems.find((item) => item.id === id))
      .filter((item): item is ClothingItem => item !== undefined);
  }

  async function handleSave() {
    if (!outfitName.trim()) {
      setError('Bitte gib dem Outfit einen Namen.');
      return;
    }
    if (droppedItemIds.length < 2) {
      setError('Ziehe mindestens 2 Kleidungsstücke in die Vorschau.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/api/outfits', {
        name: outfitName.trim(),
        item_ids: droppedItemIds,
      });
      setOutfitName('');
      setDroppedItemIds([]);
      await loadOutfits();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Fehler beim Speichern.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(outfitId: number) {
    try {
      await apiClient.del(`/api/outfits/${outfitId}`);
      setOutfits((prev) => prev.filter((o) => o.id !== outfitId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen.');
    }
  }

  const droppedItems = getDroppedItems();
  const imageUrl = (url: string) => `${BASE_URL}${url}`;

  return (
    <div className="outfit-creator-page">
      <h1>Outfit Creator</h1>

      <div className="outfit-creator-layout">
        <div className="wardrobe-panel">
          <h2>Garderobe</h2>
          {allCategories.length === 0 && (
            <p className="empty-hint">Keine Kleidungsstücke vorhanden.</p>
          )}
          {allCategories.map((category) => (
            <div key={category} className="category-accordion">
              <button
                type="button"
                className={`category-header ${openCategories.has(category) ? 'open' : ''}`}
                onClick={() => toggleCategory(category)}
              >
                <span>{category}</span>
                <span className="accordion-arrow">{openCategories.has(category) ? '▾' : '▸'}</span>
              </button>
              {openCategories.has(category) && (
                <div className="category-items">
                  {groupedByCategory[category].map((item) => (
                    <div
                      key={item.id}
                      className="drag-item"
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                    >
                      <img src={imageUrl(item.image_url)} alt={item.name} />
                      <span className="drag-item-label">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="preview-panel">
          <h2>Outfit-Vorschau</h2>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {droppedItems.length === 0 && (
              <p className="drop-hint">Ziehe Kleidungsstücke hierher</p>
            )}
            {droppedItems.map((item) => (
              <div key={item.id} className="preview-item">
                <img src={imageUrl(item.image_url)} alt={item.name} />
                <span className="preview-item-label">{item.name}</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeDroppedItem(item.id)}
                  title="Entfernen"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="outfit-save-area">
            <input
              type="text"
              className="outfit-name-input"
              placeholder="Outfit-Name"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
            />
            <button
              type="button"
              className="save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Speichern...' : 'Outfit speichern'}
            </button>
          </div>
          {error && <p className="error-msg">{error}</p>}
        </div>
      </div>

      <div className="outfits-list-section">
        <h2>Meine Outfits</h2>
        {outfits.length === 0 && (
          <p className="empty-hint">Noch keine Outfits gespeichert.</p>
        )}
        <div className="outfits-grid">
          {outfits.map((outfit) => (
            <div key={outfit.id} className="outfit-card">
              <div className="outfit-card-preview">
                {outfit.items.slice(0, 4).map((item) => (
                  <img key={item.id} src={imageUrl(item.image_url)} alt={item.name} />
                ))}
              </div>
              <span className="outfit-card-name">{outfit.name}</span>
              <button
                type="button"
                className="delete-outfit-btn"
                onClick={() => handleDelete(outfit.id)}
                title="Outfit löschen"
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .outfit-creator-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        .outfit-creator-page h1 {
          font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
          font-weight: 700;
          font-size: clamp(28px, 5vw, 40px);
          color: var(--color-accent);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 32px;
        }
        .outfit-creator-layout {
          display: flex;
          gap: 24px;
          margin-bottom: 48px;
        }
        @media (max-width: 768px) {
          .outfit-creator-layout {
            flex-direction: column;
          }
        }
        .wardrobe-panel {
          flex: 35;
          min-width: 0;
        }
        .preview-panel {
          flex: 65;
          min-width: 0;
        }
        .wardrobe-panel h2,
        .preview-panel h2 {
          font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
          font-weight: 700;
          font-size: 20px;
          color: var(--color-accent);
          margin-bottom: 16px;
        }
        .empty-hint {
          color: var(--color-muted);
          font-style: italic;
          text-align: center;
          padding: 24px 0;
        }

        /* Category Accordion */
        .category-accordion {
          margin-bottom: 8px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 10px 14px;
          background: var(--color-surface);
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-fg);
          text-align: left;
          font-family: inherit;
          transition: background 0.2s ease;
        }
        .category-header:hover {
          background: var(--color-surface_raised);
        }
        .category-header.open {
          border-bottom: 1px solid var(--color-border);
        }
        .accordion-arrow {
          font-size: 14px;
          color: var(--color-muted);
        }
        .category-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          background: var(--color-bg);
        }

        /* Drag Items */
        .drag-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 96px;
          padding: 8px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          cursor: grab;
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
        }
        .drag-item:hover {
          transform: scale(1.05);
          border-color: var(--color-accent);
          box-shadow: 0 4px 16px var(--color-glow);
        }
        .drag-item:active {
          cursor: grabbing;
        }
        .drag-item img {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 6px;
        }
        .drag-item-label {
          font-size: 11px;
          text-align: center;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
          color: var(--color-muted);
        }

        /* Drop Zone */
        .drop-zone {
          min-height: 400px;
          border: 2px dashed rgba(201, 168, 76, 0.5);
          border-radius: var(--radius-lg);
          padding: 24px;
          background: var(--color-surface);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.25s ease;
        }
        .drop-zone.drag-over {
          border-color: var(--color-accent);
          background: var(--color-surface_raised);
          box-shadow: inset 0 0 60px var(--color-glow);
        }
        .drop-hint {
          color: var(--color-muted);
          text-align: center;
          margin: auto;
          font-style: italic;
        }

        /* Preview Items */
        .preview-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--color-surface_raised);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          transition: border-color 0.2s ease;
        }
        .preview-item:hover {
          border-color: var(--color-accent);
        }
        .preview-item img {
          width: 56px;
          height: 74px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        .preview-item-label {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-fg);
        }
        .remove-btn {
          background: none;
          border: none;
          color: var(--color-muted);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
          line-height: 1;
        }
        .remove-btn:hover {
          color: var(--color-error);
          background: rgba(192, 57, 43, 0.1);
        }

        /* Save Area */
        .outfit-save-area {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .outfit-name-input {
          flex: 1;
          background: var(--color-surface);
          color: var(--color-fg);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          font-size: 14px;
          min-height: 48px;
          font-family: inherit;
          transition: border-color 0.2s ease;
        }
        .outfit-name-input::placeholder {
          color: var(--color-muted);
        }
        .outfit-name-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-glow);
          outline: none;
        }
        .save-btn {
          padding: 12px 28px;
          background: var(--color-accent);
          color: var(--color-bg);
          border: none;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          min-height: 48px;
          transition: all 0.2s ease;
        }
        .save-btn:hover {
          background: var(--color-accent_light);
          box-shadow: 0 0 20px var(--color-glow);
        }
        .save-btn:active {
          background: var(--color-accent_dark);
          transform: scale(0.97);
        }
        .save-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .error-msg {
          color: var(--color-error);
          margin-top: 8px;
          font-size: 14px;
        }

        /* Outfits List */
        .outfits-list-section h2 {
          font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
          font-weight: 700;
          font-size: 24px;
          color: var(--color-accent);
          margin-bottom: 20px;
        }
        .outfits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        .outfit-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px;
          border: 1.5px dashed var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface_raised);
          transition: all 0.3s ease;
          min-height: 200px;
        }
        .outfit-card:hover {
          border-color: rgba(201, 168, 76, 0.6);
          box-shadow: 0 4px 24px var(--color-glow);
        }
        .outfit-card-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .outfit-card-preview img {
          width: 56px;
          height: 74px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        .outfit-card-name {
          font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
          font-weight: 700;
          font-size: 16px;
          color: var(--color-accent);
          text-align: center;
        }
        .delete-outfit-btn {
          padding: 6px 18px;
          background: transparent;
          color: var(--color-error);
          border: 1.5px solid var(--color-error);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          transition: all 0.2s ease;
          min-height: 40px;
        }
        .delete-outfit-btn:hover {
          background: rgba(192, 57, 43, 0.1);
        }
      `}</style>
    </div>
  );
}

export default OutfitCreatorPage;
