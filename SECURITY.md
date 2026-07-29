VERDICT: CHANGES_REQUESTED

## Security Report

### 1. DDL-Operationen im Anwendungslauf (Medium)
**Betroffene Datei:** `backend/database.py` (Zeilen 12–18)
**Beschreibung:**  
Die Funktion `init_db` führt bei jedem Start `Base.metadata.create_all` und eine bedingte `ALTER TABLE`-Anweisung aus. Dies verstößt gegen die Akzeptanzkriterien „Datenbank-Verbindung nur mit minimal nötigen Rechten (kein DDL-Zugriff für die Applikation im Produktivbetrieb)“. In SQLite existieren zwar keine granularen Benutzerrechte, aber das Prinzip der geringsten Rechte wird dennoch missachtet – ein laufender Webserver sollte keine Schemaänderungen am Datenspeicher vornehmen. Sollte wider Erwarten doch eine Injektion gelingen (aktuell nicht gegeben), wäre die DDL-Fähigkeit ein Verstärker.
**Empfehlung:**  
- Migrationen ausschließlich über ein separates CLI-Kommando oder ein Tool wie Alembic ausführen.  
- `init_db` im Produktionsmodus nicht aufrufen oder zumindest so kapseln, dass sie nur bei explizitem Schema-Befehl ausgeführt wird.
**Schweregrad:** Medium

### 2. Fehlende Ratenbegrenzung bei Login und Registrierung (Medium)
**Betroffene Datei:** `backend/auth.py` (Endpunkte `POST /api/auth/login` und `POST /api/auth/register`)
**Beschreibung:**  
Es existiert keinerlei Begrenzung der Anfragen, weder pro IP noch pro Nutzer. Ein Angreifer kann folglich Brute‑Force‑Angriffe gegen Passwörter oder massenhafte Registrierungen durchführen und so die Benutzer‑DB überfluten.
**Empfehlung:**  
Integration einer Ratenbegrenzungs‑Middleware (z. B. `slowapi`), die fehlgeschlagene Login‑Versuche pro IP oder E‑Mail‑Adresse in einem Zeitfenster limitiert. Für Registrierungen kann eine globale Rate pro IP oder Captcha vorgesehen werden.
**Schweregrad:** Medium

### 3. CORS‑Konfiguration zu permissiv (Low)
**Betroffene Datei:** `backend/main.py` (Zeilen 12–17)
**Beschreibung:**  
In der CORS‑Middleware sind `allow_methods=["*"]` und `allow_headers=["*"]` gesetzt, gleichzeitig ist `allow_credentials=True`. Obwohl die erlaubten Origins derzeit auf `localhost` beschränkt sind, würde eine spätere Erweiterung auf eine Produktionsdomain alle HTTP‑Methoden und beliebige Header zulassen. Dies widerspricht dem Need‑to‑Know‑Prinzip.
**Empfehlung:**  
Erlaubte Methoden und Header auf die tatsächlich benötigten Werte einschränken, z. B. `allow_methods=["GET", "POST", "DELETE"]` und `allow_headers=["Content-Type"]`.
**Schweregrad:** Low

### 4. Diskrepanz beim SameSite‑Attribut (Hinweis)
**Betroffene Datei:** `backend/auth.py` (Zeile 14)
**Beschreibung:**  
Das Session‑Cookie wird mit `SameSite=Strict` gesetzt. Die Datenschutz‑AC fordern `SameSite=Lax`, während die Security‑AC `Strict` vorgibt. Diese Inkonsistenz kann zu Fehlverhalten führen (etwa wenn ein externer Link auf die Anwendung verweist) und sollte vereinheitlicht werden.
**Empfehlung:**  
Rücksprache mit den Verantwortlichen, ob aus Sicherheitsgründen `Strict` beizubehalten ist oder zugunsten von `Lax` gemäß Datenschutz‑Vorgabe geändert werden soll.
**Schweregrad:** Hinweis

---

**Gesamtbewertung:**  
Der Code weist keine akut ausnutzbaren kritischen Schwachstellen auf. Die mittelschweren Findings (DDL‑Rechte, fehlende Ratenbegrenzung) sowie die permissive CORS‑Konfiguration rechtfertigen eine Überarbeitung vor dem Produktiveinsatz. Daher **CHANGES_REQUESTED**.