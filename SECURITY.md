# Security Policy

## Reporting a Vulnerability

Wir nehmen Sicherheitsmeldungen ernst. Wenn du eine Sicherheitslücke entdeckst,
melde sie bitte verantwortungsvoll – gib uns Zeit zur Behebung, bevor du sie
veröffentlichst.

**Kontakt:** [security@glamcloset.example.com](mailto:security@glamcloset.example.com)

Antwortzeit: Wir bestätigen den Eingang innerhalb von 48 Stunden und geben
regelmäßig Status-Updates.

## Sicherheitsmaßnahmen

| Maßnahme | Beschreibung |
|----------|-------------|
| **Passwort-Hashing** | bcrypt mit Kostenfaktor 12 – keine Klartextpasswörter in Datenbank, Logs oder Antworten |
| **Session-Cookies** | HttpOnly, SameSite=Lax – kein clientseitiger Token-Zugriff, kein localStorage |
| **Session-Expiry** | Sessions verfallen automatisch nach 24 Stunden Inaktivität |
| **Bildvalidierung** | Magic-Byte-Prüfung für JPEG, PNG und WebP – keine ausführbaren Dateien |
| **EXIF-Bereinigung** | Metadaten werden vor dem Speichern aus hochgeladenen Bildern entfernt |
| **Dateinamen-Sanitization** | Originaldateinamen werden durch UUID-basierte Namen ersetzt |
| **Dateigrößenbeschränkung** | Uploads auf maximal 10 MB begrenzt |
| **IDOR-Schutz** | Alle Endpunkte prüfen strikt die Benutzerzugehörigkeit (Eigentümer auf DB-Ebene) |
| **Pfadtraversal-Schutz** | Bildabruf blockiert `..`, `/`, `\\` und prüft absoluten Pfad gegen das Upload-Verzeichnis |
| **Content-Type-Ermittlung** | Bildauslieferung setzt den Content-Type aus tatsächlichen Magic Bytes, nicht aus dem Dateinamen |
| **Kontolöschung** | Vollständige Löschung aller Benutzerdaten inklusive hochgeladener Bilddateien |
| **Keine sensiblen Logs** | Keine E-Mail-Adressen oder Passwörter in Anwendungslogs oder Fehlermeldungen |

## Supported Versions

Derzeit wird nur die neueste Version (main branch) mit Sicherheitsupdates
versorgt.

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |
