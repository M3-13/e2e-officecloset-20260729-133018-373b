# Glamouröser Kleiderschrank-Manager

Ein Fullstack-Webprojekt für einen eleganten Kleiderschrank-Manager im Hollywood-Stil.
Benutzer registrieren sich per E-Mail, laden Kleidungsbilder hoch, durchstöbern ihre
Garderobe nach Kategorien und kombinieren im Outfit-Creator per Drag-and-Drop
Einzelteile zu gespeicherten Outfits.

## Tech Stack

- **Backend**: Python (FastAPI), SQLAlchemy, SQLite
- **Frontend**: Vite + React + TypeScript + React Router
- **Bildspeicherung**: Lokales Dateisystem (`uploads/`)

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Starten (Entwicklung)

### Backend

```bash
cd backend
uvicorn main:app --reload
```

Der Server läuft unter `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm run dev
```

Der Dev-Server läuft unter `http://localhost:5173`.

## Bauen (Produktion)

### Frontend

```bash
cd frontend
npm run build
```

Das gebaute Frontend liegt in `frontend/dist/`.

## API-Endpunkte

### Health

`GET /api/health` — Health-Check des Backends.

Response `200`:
```json
{"status": "ok"}
```

### Authentifizierung — `/api/auth/*`

| Methode | Pfad              | Beschreibung        |
|---------|-------------------|---------------------|
| POST    | `/api/auth/register` | Registrierung       |
| POST    | `/api/auth/login`    | Login               |

### Garderobe — `/api/wardrobe/*`

| Methode | Pfad                  | Beschreibung              |
|---------|-----------------------|---------------------------|
| GET     | `/api/wardrobe`       | Alle Kleidungsstücke      |
| POST    | `/api/wardrobe`       | Kleidungsstück anlegen    |
| DELETE  | `/api/wardrobe/{id}`  | Kleidungsstück löschen    |

### Outfits — `/api/outfits/*`

| Methode | Pfad                  | Beschreibung           |
|---------|-----------------------|------------------------|
| GET     | `/api/outfits`        | Alle Outfits           |
| POST    | `/api/outfits`        | Outfit erstellen       |
| DELETE  | `/api/outfits/{id}`   | Outfit löschen         |

## Features (geplant)

- Registrierung & Login mit E-Mail und Passwort
- Garderobe: Kleidungsstücke anlegen, durchstöbern und nach Kategorie filtern
- Outfit-Creator: Drag-and-Drop, Outfits speichern und verwalten
- Bild-Upload mit EXIF-Bereinigung und Magic-Byte-Validierung

## Sicherheit

- **Passwort-Hashing:** Alle Passwörter werden mit bcrypt (Kostenfaktor 12) gehasht – Klartextpasswörter
  werden zu keinem Zeitpunkt gespeichert oder geloggt.
- **Session-Cookies:** Authentifizierung erfolgt über HttpOnly-Session-Cookies.
  Sessions verfallen automatisch nach 24 Stunden Inaktivität. Kein localStorage,
  kein clientseitiger Token-Zugriff.
- **Bildvalidierung:** Hochgeladene Bilder werden per Magic-Byte-Prüfung auf
  JPEG, PNG und WebP beschränkt. EXIF-/Metadaten werden vor dem Speichern
  entfernt. Dateinamen werden durch kryptografisch zufällige UUIDs ersetzt.
- **Dateigrößenbeschränkung:** Uploads sind auf maximal 10 MB begrenzt.
- **Zugriffskontrolle:** Alle API-Endpunkte prüfen strikt die
  Benutzerzugehörigkeit (IDOR-Schutz). Bilder können nur vom Eigentümer
  abgerufen werden.
- **Kontolöschung:** Benutzer können ihr Konto vollständig löschen – inklusive
  aller Kleidungsbilder, Sessions, Outfits und personenbezogener Daten.

Weitere Details siehe [`SECURITY.md`](./SECURITY.md).
