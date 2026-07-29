VERDICT: BLOCKED

## 1. DSGVO (Datenschutz-Grundverordnung)

### 1.1 Fehlende Rechtsgrundlage für die Verarbeitung personenbezogener Daten (E-Mail) – Einwilligung nicht eingeholt
**Schweregrad:** kritisch  
**Fundstelle:** `backend/schemas.py` (UserCreate), `frontend/src/pages/RegisterPage.tsx`, Teamkonvention »Privacy checkbox is a required field on the Pydantic model; the frontend blocks submit if unchecked.«  
**Problem:** Bei der Registrierung werden E-Mail-Adresse und Passwort verarbeitet. Es fehlt jeglicher Mechanismus, um eine informierte Einwilligung des Nutzers einzuholen – weder ein erforderliches Häkchen noch ein Hinweis auf die Datenschutzerklärung. Ohne diesen Nachweis fehlt eine Rechtsgrundlage im Sinne von Art. 6 Abs. 1 lit. a DSGVO.  
**Maßnahme:**
1. In `backend/schemas.py` das Pydantic-Modell `UserCreate` um ein Pflichtfeld `privacy_accepted: bool` erweitern, das nur `True` akzeptiert wird.
2. In `frontend/src/pages/RegisterPage.tsx` eine Checkbox mit Label einbauen (z. B. „Ich habe die <Link to="/privacy">Datenschutzerklärung</Link> gelesen und stimme der Verarbeitung meiner Daten zu.“) und das Absenden nur erlauben, wenn die Checkbox aktiviert ist.
3. Die Datenschutzerklärung muss unter `/privacy` erreichbar sein (siehe Abschnitt 4).

### 1.2 Fehlendes Recht auf Löschung des Benutzerkontos (Art. 17 DSGVO)
**Schweregrad:** kritisch  
**Fundstelle:** `backend/auth.py` (nur `logout` vorhanden)  
**Problem:** Nutzer können ihr Konto nicht selbstständig löschen. Es gibt keinen API-Endpunkt, der das gesamte Benutzerkonto einschließlich aller zugehörigen Garderoben-Items, Outfits und Sitzungen unwiderruflich entfernt. Dies verstößt gegen das Recht auf Löschung.  
**Maßnahme:**
1. In `backend/auth.py` einen neuen Endpunkt `DELETE /api/auth/me` (geschützt durch `get_current_user`) implementieren.
2. Der Endpunkt löscht den aktuellen Benutzerdatensatz (`User`) aus der Datenbank – durch das konfigurierte `cascade="all, delete-orphan"` in den Modellen werden automatisch alle Sessions, ClothingItems, Outfits und OutfitItems mitgelöscht.
3. Zusätzlich müssen die auf dem Dateisystem gespeicherten Bilder (`uploads/`) der zugehörigen Kleidungsstücke entfernt werden. Daher vor dem Löschen des Users die Dateipfade aller `ClothingItem`-Datensätze des Users ermitteln und die entsprechenden Dateien löschen.
4. Nach erfolgreicher Löschung das Session-Cookie entfernen (`response.delete_cookie`) und Status 204 zurückgeben.

### 1.3 Fehlende Transparenz- und Informationspflichten (Art. 13 DSGVO)
**Schweregrad:** kritisch  
**Problem:** Es existiert keine verlinkte oder angezeigte Datenschutzerklärung. Nutzer erhalten keine Informationen über Zweck, Rechtsgrundlage, Speicherdauer oder ihre Rechte.  
**Maßnahme:** Siehe Abschnitt 4 (Pflichttexte).

---

## 2. EU Cyber Resilience Act (CRA)

### 2.1 Unvollständige Sicherheitsdokumentation
**Schweregrad:** medium  
**Fundstelle:** gesamtes Projekt  
**Problem:** Das Produkt enthält keine dokumentierten Sicherheitseigenschaften, keine Benennung eines Sicherheitskontakts und keine SBOM. Der CRA verlangt für Produkte mit digitalen Elementen, dass Sicherheitsrisiken gemeldet werden können und Hersteller support-/updatefähig sind.  
**Maßnahme:**
1. Eine `SECURITY.md` im Repository mit einer Kontaktadresse für Sicherheitsmeldungen erstellen.
2. Eine einfache SBOM (Software Bill of Materials) als `sbom.json` ablegen – z. B. mittels `pip freeze` und `npm list --json` generiert.
3. In der `README.md` auf die Maßnahmen zur Sicherheit (Passwort-Hashing, sichere Cookies, Bildvalidierung) und den Aktualisierungsprozess hinweisen.

---

## 3. EU AI Act
Nicht anwendbar – das Produkt enthält keine KI-Komponenten. Keine Beanstandungen.

---

## 4. Pflichttexte & UI (Impressum, Datenschutz, Cookie-Hinweis)

### 4.1 Fehlendes Impressum (DDG/TMG)
**Schweregrad:** kritisch  
**Fundstelle:** `frontend/src/App.tsx`, `frontend/src/components/NavBar.tsx`, `frontend/index.html`  
**Problem:** Für ein öffentlich zugängliches Webangebot mit personenbezogenen Daten ist ein Impressum mit ladungsfähiger Anschrift vorgeschrieben. Weder eine separate Seite noch ein Link in der Navigation oder im Footer existieren.  
**Maßnahme:**
1. Eine neue Seite `frontend/src/pages/ImprintPage.tsx` anlegen und unter `/imprint` in der Routenkonfiguration (`App.tsx`) eintragen.
2. In der `NavBar.tsx` oder einem globalen Footer (z. B. in `App.tsx`) einen Link „Impressum“ einfügen.

### 4.2 Fehlende Datenschutzerklärung
**Schweregrad:** kritisch  
**Fundstelle:** gesamtes Frontend  
**Problem:** Es gibt keine Datenschutzerklärung, die über die Verarbeitung der personenbezogenen Daten (E-Mail, Passwort-Hash, hochgeladene Bilder) informiert und insbesondere die Nutzung technisch notwendiger Cookies erklärt.  
**Maßnahme:**
1. Neue Seite `frontend/src/pages/PrivacyPage.tsx` anlegen, die alle erforderlichen Informationen enthält (Verantwortlicher, Zwecke, Rechtsgrundlagen, Speicherdauer, Betroffenenrechte, Empfänger/Hoster).
2. Die Seite unter `/privacy` über `App.tsx` einbinden.
3. In der `NavBar` oder im Footer einen Link und in der Registrierungs-Checkbox (siehe 1.1) auf diese Seite verweisen.

### 4.3 Fehlender Cookie-Hinweis
**Schweregrad:** medium (da nur ein technisch notwendiges Session-Cookie gesetzt wird, reicht ein Hinweis in der Datenschutzerklärung)  
**Fundstelle:** `backend/auth.py` setzt `session_token`  
**Problem:** Obwohl für rein funktionale Cookies keine Einwilligung erforderlich ist, muss die Nutzung in der Datenschutzerklärung erläutert werden.  
**Maßnahme:** In der `PrivacyPage.tsx` einen Abschnitt über Cookies aufnehmen, der den Session-Cookie benennt und erklärt, dass er für die Anmeldung erforderlich ist.

---

## 5. Barrierefreiheit (WCAG / BITV / EAA)

### 5.1 Fehlende Alternativtexte für Bilder
**Schweregrad:** medium  
**Fundstelle:** `frontend/src/pages/WardrobePage.tsx`, `frontend/src/pages/OutfitCreatorPage.tsx` (nicht vollständig einsehbar, aber Verwendung der Klasse `garment-image` sowie `image_url` ohne ersichtliche `alt`-Attribute)  
**Problem:** Hochgeladene Garderobenbilder werden ohne `alt`-Attribut eingebunden. Bildschirmleseprogramme erhalten keine Beschreibung, was für die Zugänglichkeit (WCAG 1.1.1) erforderlich ist.  
**Maßnahme:** In allen `<img>`-Tags, die über `garment-image` oder ähnlich gestylt sind, ein `alt`-Attribut mit dem Namen des Kleidungsstücks setzen, z. B. `alt={item.name}` in WardrobePage und OutfitCreatorPage.

---

## Hinweis zur Funktionalität unter den geforderten Maßnahmen
Alle oben genannten Änderungen sind mit der bestehenden Produktlogik kompatibel. Sie fügen lediglich erforderliche rechtliche Elemente hinzu, ohne bestehende Datenflüsse oder Features zu beeinträchtigen. Insbesondere:
- Die Datenschutz-Checkbox und die neue Account-Löschung verändern nicht die Abbildung der Kleider- oder Outfit-Verwaltung.
- Die Pflichttextseiten werden über das existierende Routing eingebunden.
- Die `alt`-Attribute brechen keine Layout- oder Drag‑and‑Drop-Funktionen.