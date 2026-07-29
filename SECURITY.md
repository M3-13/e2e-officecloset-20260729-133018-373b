VERDICT: BLOCKED

# Sicherheitsbericht – Glamouröser Kleiderschrank-Manager (MVP)

## 1. Blockierende Sicherheitslücke: Unsichere Session‑Cookie‑Konfiguration

**Schweregrad**  
🔴 **KRITISCH** (Verstoß gegen die explizit geforderten Security‑ACs; führt zu einem schwerwiegenden Authentifizierungsrisiko)

**Betroffene Stellen**  
- `backend/auth.py`:
  - `register()` – Zeile 66–68 (`response.set_cookie(…)`)
  - `login()` – Zeile 83–85 (`response.set_cookie(…)`)
  - `logout()` – Zeile 100–102 (`response.delete_cookie(…)`)
  - `delete_account()` – Zeile 125–127 (`response.delete_cookie(…)`)

**Problem**  
Die Session‑Cookies werden mit **`secure=False`** und **`samesite="lax"`** gesetzt.  
Die Sprint-Vorgabe fordert jedoch ausdrücklich:

> *[Security] Sitzungs-Token (z. B. JWT) ausschließlich per HttpOnly, Secure, SameSite=Strict-Cookie ausliefern, niemals in localStorage.*

Aktuell:
- `secure=False` erlaubt die Übertragung des Tokens über unverschlüsseltes HTTP. Bei einem Deployment ohne HTTPS (oder einem Man‑in‑the‑Middle) kann das Cookie abgefangen und von einem Angreifer für sämtliche Aktionen des Benutzers verwendet werden.
- `samesite="lax"` schützt die API **nicht** zuverlässig vor CSRF‑Angriffen (z. B. über einen POST von einer externen Seite). `SameSite=Strict` wäre erforderlich, um alle cross‑origin state‑changing Requests zu sperren.

**Konkreter Fix**
1. Setze `secure=True` beim Cookie (produktionsreife Umgebungen gehen von HTTPS aus; in lokaler Entwicklung kann dies über einen Proxy simuliert werden).
2. Ändere `samesite="lax"` in **`samesite="strict"`**.
3. Vereinheitliche die gesamte Cookie‑Konfiguration (Register, Login, Logout, Account‑Löschung) – am besten über eine zentrale Hilfsfunktion oder eine FastAPI‑Middleware, die für alle geschützten Antworten denselben Cookie‑Policy anwendet.

**Begründung für BLOCKED**  
Die Abweichung von den verpflichtenden Security‑Acceptance‑Criteria macht das Authentifizierungstoken für einen aktiven Netzwerk‑Angreifer lesbar und erhöht die CSRF‑Angriffsfläche erheblich. Das Produkt darf in diesem Zustand nicht ausgeliefert werden.

---

## 2. Weitere Sicherheitsmängel (nicht blockierend, aber dringend empfohlen)

### 2.1 Fehlende CSRF‑Absicherung für state‑changing Operationen
**Schweregrad**: Hoch  
**Dateien**: Alle API‑Endpunkte, die via Cookie authentifiziert werden (z. B. `POST /api/wardrobe`, `DELETE /api/outfits/{id}`).  
**Problem**: Ohne sichtbaren CSRF‑Token können Angreifer mit gesetztem `SameSite=Strict` (nach unserer Behebung) zwar nicht direkt einen POST von einer fremden Seite auslösen, dennoch ist eine serverseitige Bestätigung eines CSRF‑Tokens (z. B. als Header) zusätzlicher Schutz, falls die SameSite‑Policy umgangen wird (z. B. Browser‑Bugs, neuere Angriffstechniken).  
**Empfehlung**: Integriere einen CSRF‑Token Mechanismus (z. B. Ein‑Mal‑Token, das bei jedem POST/DELETE erwartet wird) – aus dem Frontend generiert und im Backend validiert.

### 2.2 Kein Rate Limiting bei Login/Register
**Schweregrad**: Mittel  
**Datei**: `backend/auth.py`  
**Problem**: Mehrfache fehlgeschlagene Login‑Versuche werden nicht verzögert oder blockiert (Brute‑Force / Credential‑Stuffing).  
**Empfehlung**: Füge eine einfache IP‑basierte oder benutzerbasierte Rate‑Limit‑Schicht ein (z. B. mit `slowapi` oder einem Middleware‑Wrapper um die Auth‑Routen).

### 2.3 POTENZIELLES TOCTOU‑Risiko beim Ausliefern von Bildern
**Schweregrad**: Niedrig  
**Datei**: `backend/wardrobe.py` – `serve_image()`  
**Problem**: Zwischen der Berechtigungsprüfung und dem Öffnen der Datei könnte (in einem parallelen Thread) ein symbolischer Link ausgetauscht werden, der auf eine nicht‑eigene Datei zeigt.  
**Empfehlung**: Verwende `pathlib.Path.resolve()` und prüfe den tatsächlichen Pfad vor dem Senden. Zusätzlich könnten die Dateien in einem benutzerspezifischen Unterverzeichnis gespeichert werden, das ausschließlich diesem Benutzer gehört (z. B. `uploads/<user_id>/`).

### 2.4 Keine Content‑Security‑Policy oder andere Sicherheits‑Header
**Schweregrad**: Niedrig  
**Frontend**: `vite.config.ts` / `main.py`  
**Problem**: Es werden keine Sicherheits‑Header (CSP, X‑Content‑Type‑Options, X‑Frame‑Options) gesetzt.  
**Empfehlung**: Konfiguriere in FastAPI eine Middleware, die mindestens `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` und eine restriktive CSP ausliefert, die die legitimen Ressourcen (Self, Google Fonts) nicht blockiert.

---

## 3. Bereits korrekt umgesetzte Sicherheitsmaßnahmen (Anerkennung)

- Passwörter werden mit **bcrypt (Kostenfaktor 12)** gehasht und nie im Klartext gespeichert.
- Session‑Cookie ist **HttpOnly** – kein Zugriff per JavaScript.
- Bild‑Uploads werden auf JPEG/PNG/WebP per **Magic‑Byte‑Prüfung** beschränkt, EXIF‑Daten werden entfernt, Dateinamen kryptografisch zufällig.
- Alle geschützten Endpunkte erfordern Authentifizierung und **isolieren strikt auf den aktuellen Benutzer**.
- Datenbank‑Abfragen nutzen SQLAlchemy ORM und sind gegen SQL‑Injection geschützt.
- `privacy_accepted` ist als Pflichtfeld im Pydantic‑Modell verankert und wird im Frontend erzwungen.

---

**Gesamturteil**  
Das Produkt weist **eine kritische Diskrepanz zu den vereinbarten Security‑Akzeptanzkriterien** auf – die unsichere Session‑Cookie‑Konfiguration muss vor der Auslieferung behoben werden. Erst nach Behebung dieser und der optionalen Härtungen kann der Code freigegeben werden.