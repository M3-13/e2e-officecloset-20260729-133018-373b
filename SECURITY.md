VERDICT: CHANGES_REQUESTED

**Sicherheitsbewertung des glamourösen Kleiderschrank-Managers (MVP)**
  
Die Analyse deckt keine kritischen Lücken (Secrets, Injection/Auth-Bypass) auf, zeigt jedoch zwei mittelschwere Mängel und wichtige Härtungsempfehlungen auf. Die Authentifizierung, Passworthashes und Upload-Validierung sind grundsätzlich korrekt implementiert. Eine Änderung ist erforderlich, um Datenschutz bei Bildabrufen umzusetzen; zusätzliche Maßnahmen erhöhen die Robustheit.

---

### 1. Insecure Direct Object Reference (IDOR) bei Bildabruf (Medium)
**Betroffene Datei:** `backend/wardrobe.py`, Endpunkt `GET /api/images/{filename}`  
Der Endpunkt prüft lediglich auf Authentifizierung, jedoch nicht, ob die angeforderte Bilddatei dem eingeloggten Benutzer gehört. Dadurch kann jeder authentifizierte Nutzer durch Erraten eines zufälligen Dateinamens (UUID) die Bilder anderer Benutzer sehen – ein Verstoß gegen die geforderte strikte Beschränkung auf die eigene ID und ein mögliches Datenschutzrisiko.

**Empfohlene Korrektur:**
- Verknüpfe die Bilddatei über die `ClothingItem`-Tabelle mit dem Eigentümer.
- Ändere `serve_image` so, dass zusätzlich die Existenz eines `ClothingItem` mit dem gegebenen `image_filename` und `user_id == current_user.id` abgefragt wird, bevor die Datei ausgeliefert wird.
- Beispielhafte Anpassung in `wardrobe.py`:
  ```python
  @wardrobe_router.get("/api/images/{filename}")
  def serve_image(
      filename: str,
      current_user: User = Depends(get_current_user),
      db: Session = Depends(get_db),
  ):
      # Pfadeingangsvalidierung wie bisher ...
      # Zusätzliche Prüfung
      item = db.query(ClothingItem).filter(
          ClothingItem.image_filename == filename,
          ClothingItem.user_id == current_user.id
      ).first()
      if not item:
          raise HTTPException(status_code=404, detail="Bild nicht gefunden")
      # Medienauslieferung wie bisher ...
  ```

---

### 2. Fehlende Sitzungsablaufzeit / Session Expiry (Medium)
**Betroffene Dateien:** `backend/auth.py`, `backend/models.py`  
Die erstellten Session-Tokens (UUID) werden ohne Ablaufdatum in der Datenbank gespeichert. Ein einmal erlangtes Token bleibt daher dauerhaft gültig – selbst nach langer Inaktivität oder einem Passwortwechsel. Das verlängert das Zeitfenster für Session-Hijacking erheblich.

**Empfohlene Korrektur:**
- Füge ein `expires_at`-Feld in das `Session`-Modell ein und setze es beim Erstellen auf z. B. 24 Stunden.
- Prüfe in `get_current_user`, ob das Token abgelaufen ist, und lösche es gegebenenfalls (oder lehne die Anfrage ab).
- Beispiel:
  ```python
  # models.py
  expires_at = Column(DateTime, nullable=False)

  # auth.py
  from datetime import timedelta
  # Beim Erstellen:
  session = SessionModel(
      token=session_token,
      user_id=user.id,
      expires_at=datetime.now(UTC) + timedelta(hours=24)
  )
  # In get_current_user:
  if session.expires_at < datetime.now(UTC):
      db.delete(session)
      db.commit()
      raise HTTPException(status_code=401, detail="Sitzung abgelaufen")
  ```

---

### 3. Cookie-Sicherheitsattribute (Low)
**Betroffene Datei:** `backend/auth.py`  
Das Session-Cookie wird mit `secure=False` gesetzt. Dies ist im Entwicklungsumfeld (localhost) akzeptabel, verletzt jedoch die Vorgabe für den Produktivbetrieb (HTTPS). Gemäß der Spec soll das Cookie `Secure` gesetzt werden, wenn HTTPS verfügbar ist. Die aktuelle Konfiguration ist für das MVP ohne Produktiv-HTTPS kein Blocker, sollte aber als Todo dokumentiert werden.

**Hinweis für nächsten Schritt:**  
Für den Produktivbetrieb muss `secure=True` gesetzt werden und die CORS-Origins entsprechend der öffentlichen Domain eingeschränkt werden. In der aktuellen lokalen Umgebung ist dies nicht ausnutzbar.

---

### 4. Fehlende Dependency-Scans
Weder `pip-audit` noch `bandit`/`semgrep` waren in dieser Auswertung aktiv. Es ist möglich, dass bekannte Schwachstellen in Drittanbieterpaketen unentdeckt bleiben. Ein manueller Scan (z. B. `pip list --outdated` und `npm audit`) wird dringend empfohlen, bevor das Produkt live geht. Dies ist ein Prozessmangel, der beim nächsten Buildzyklus behoben werden sollte.

---

### Zusammenfassung der erforderlichen Änderungen
- **IDOR bei `serve_image` beheben** → Zugriffskontrolle auf Benutzerebene einbauen.
- **Session-Expiry implementieren** → begrenzte Lebensdauer der Sitzungen.
- **Cookie `Secure`-Flag für Produktion vorbereiten** – aktuell optional, aber dokumentieren.