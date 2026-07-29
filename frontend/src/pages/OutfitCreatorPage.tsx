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

function OutfitCreatorPage() {
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [droppedItemIds, setDroppedItemIds] = useState<number[]>([]);
  const [outfitName, setOutfitName] = useState('');
  const [outfits, setOutfits] = useState<OutfitData[]>([]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/api/outfits/${outfitId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Fehler beim Löschen.' }));
        throw new Error(err.detail);
      }
      setOutfits((prev) => prev.filter((o) => o.id !== outfitId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen.');
    }
  }

  const droppedItems = getDroppedItems();

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
                      <img src={item.image_url} alt={item.name} />
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
            className="drop-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {droppedItems.length === 0 && (
              <p className="drop-hint">Ziehe Kleidungsstücke hierher</p>
            )}
            {droppedItems.map((item) => (
              <div key={item.id} className="preview-item">
                <img src={item.image_url} alt={item.name} />
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
                  <img key={item.id} src={item.image_url} alt={item.name} />
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
          padding: 24px;
        }
        .outfit-creator-page h1 {
          font-size: 2rem;
          margin-bottom: 24px;
          color: #2d1b4e;
        }
        .outfit-creator-layout {
          display: flex;
          gap: 24px;
          margin-bottom: 48px;
        }
        .wardrobe-panel {
          flex: 1;
          min-width: 0;
        }
        .preview-panel {
          flex: 1;
          min-width: 0;
        }
        .wardrobe-panel h2,
        .preview-panel h2 {
          font-size: 1.25rem;
          margin-bottom: 12px;
          color: #4a2c7a;
        }
        .empty-hint {
          color: #888;
          font-style: italic;
        }

        /* Category Accordion */
        .category-accordion {
          margin-bottom: 8px;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 10px 14px;
          background: #f5f0fa;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          color: #2d1b4e;
          text-align: left;
        }
        .category-header:hover {
          background: #ebe0f7;
        }
        .accordion-arrow {
          font-size: 1.1rem;
        }
        .category-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px;
          background: #fafafa;
        }

        /* Drag Items */
        .drag-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 90px;
          padding: 6px;
          border: 2px solid #e0d8f0;
          border-radius: 8px;
          background: #fff;
          cursor: grab;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .drag-item:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
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
          font-size: 0.7rem;
          text-align: center;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        /* Drop Zone */
        .drop-zone {
          min-height: 200px;
          border: 2px dashed #b8a0d8;
          border-radius: 12px;
          padding: 16px;
          background: #faf5ff;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 0.2s;
        }
        .drop-zone:hover {
          border-color: #7c5cbf;
        }
        .drop-hint {
          color: #b8a0d8;
          text-align: center;
          margin: auto;
          font-style: italic;
        }

        /* Preview Items */
        .preview-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: #fff;
          border: 1px solid #e0d8f0;
          border-radius: 8px;
        }
        .preview-item img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
        }
        .preview-item-label {
          flex: 1;
          font-size: 0.9rem;
          color: #2d1b4e;
        }
        .remove-btn {
          background: none;
          border: none;
          color: #c44;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .remove-btn:hover {
          background: #fdd;
        }

        /* Save Area */
        .outfit-save-area {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        .outfit-name-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #b8a0d8;
          border-radius: 8px;
          font-size: 0.95rem;
        }
        .outfit-name-input:focus {
          outline: none;
          border-color: #7c5cbf;
          box-shadow: 0 0 0 2px rgba(124,92,191,0.2);
        }
        .save-btn {
          padding: 10px 24px;
          background: #7c5cbf;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .save-btn:hover {
          background: #6a4dab;
        }
        .save-btn:disabled {
          background: #b8a0d8;
          cursor: not-allowed;
        }
        .error-msg {
          color: #c44;
          margin-top: 8px;
          font-size: 0.9rem;
        }

        /* Outfits List */
        .outfits-list-section h2 {
          font-size: 1.5rem;
          margin-bottom: 16px;
          color: #2d1b4e;
        }
        .outfits-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .outfit-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 180px;
          padding: 12px;
          border: 1px solid #e0d8f0;
          border-radius: 12px;
          background: #faf5ff;
        }
        .outfit-card-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: center;
        }
        .outfit-card-preview img {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 6px;
        }
        .outfit-card-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #2d1b4e;
          text-align: center;
        }
        .delete-outfit-btn {
          padding: 4px 14px;
          background: #fee;
          color: #c44;
          border: 1px solid #fcc;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .delete-outfit-btn:hover {
          background: #fdd;
        }
      `}</style>
    </div>
  );
}

export default OutfitCreatorPage;
