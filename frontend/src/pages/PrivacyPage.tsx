import { Link } from 'react-router-dom';

const CSS = `
  .legal-page {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 24px;
  }
  .legal-page h1 {
    font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
    font-weight: 700;
    font-size: clamp(28px, 5vw, 40px);
    color: var(--color-accent);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 32px;
  }
  .legal-page h2 {
    font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
    font-weight: 700;
    font-size: 20px;
    color: var(--color-accent);
    margin-top: 32px;
    margin-bottom: 12px;
  }
  .legal-page p,
  .legal-page ul {
    color: var(--color-muted);
    font-size: 15px;
    line-height: 1.7;
    margin-bottom: 12px;
  }
  .legal-page ul {
    padding-left: 20px;
  }
  .legal-page ul li {
    margin-bottom: 6px;
  }
  .legal-page a {
    color: var(--color-accent);
  }
  .legal-page a:hover {
    color: var(--color-accent_light);
  }
  .legal-back {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
  }
`;

function PrivacyPage() {
  return (
    <>
      <style>{CSS}</style>
      <div className="legal-page">
        <h1>Datenschutzerklärung</h1>

        <h2>1. Verantwortlicher</h2>
        <p>
          GlamCloset GmbH<br />
          Musterstraße 1, 10115 Berlin<br />
          E-Mail:{' '}
          <a href="mailto:contact@glamcloset.example.com">
            contact@glamcloset.example.com
          </a>
        </p>

        <h2>2. Zwecke der Datenverarbeitung</h2>
        <p>
          Wir verarbeiten Ihre personenbezogenen Daten ausschließlich zu folgenden
          Zwecken:
        </p>
        <ul>
          <li>
            <strong>Kontoverwaltung:</strong> Erstellung und Verwaltung Ihres
            Benutzerkontos, Authentifizierung und Bereitstellung der
            Anwendungsfunktionen.
          </li>
          <li>
            <strong>Garderobe:</strong> Speicherung und Verwaltung Ihrer
            hochgeladenen Kleidungsstücke inklusive der von Ihnen vergebenen
            Bezeichnungen und Kategorien.
          </li>
          <li>
            <strong>Outfits:</strong> Speicherung und Verwaltung Ihrer
            zusammengestellten Outfits.
          </li>
        </ul>

        <h2>3. Rechtsgrundlagen</h2>
        <p>
          Die Verarbeitung Ihrer Daten erfolgt auf Grundlage folgender
          Rechtsgrundlagen der Datenschutz-Grundverordnung (DSGVO):
        </p>
        <ul>
          <li>
            <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> (Einwilligung): Ihre
            Registrierung und die damit verbundene Datenverarbeitung erfolgt auf
            Basis Ihrer ausdrücklichen Einwilligung, die Sie durch Setzen des
            Häkchens bei der Registrierung erteilen.
          </li>
          <li>
            <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung): Die
            Verarbeitung Ihrer Daten ist zur Erfüllung des Nutzungsvertrags
            erforderlich, insbesondere zur Bereitstellung der
            Garderoben- und Outfit-Funktionen.
          </li>
        </ul>

        <h2>4. Kategorien personenbezogener Daten</h2>
        <p>Wir verarbeiten folgende Kategorien personenbezogener Daten:</p>
        <ul>
          <li>E-Mail-Adresse</li>
          <li>Passwort (ausschließlich als bcrypt-Hash gespeichert)</li>
          <li>Hochgeladene Bilddateien (Kleidungsstücke)</li>
          <li>Session-Cookie (technisch notwendig, siehe Abschnitt 7)</li>
        </ul>

        <h2>5. Speicherdauer</h2>
        <p>
          Ihre personenbezogenen Daten werden gespeichert, solange Ihr
          Benutzerkonto besteht. Mit der Löschung Ihres Kontos werden sämtliche
          damit verbundenen Daten (E-Mail, Passwort-Hash, hochgeladene Bilder,
          Garderobendaten und Outfits) unwiderruflich gelöscht. Sessions
          verfallen automatisch nach 24 Stunden Inaktivität.
        </p>

        <h2>6. Betroffenenrechte</h2>
        <p>
          Sie haben jederzeit das Recht auf:
        </p>
        <ul>
          <li>
            <strong>Auskunft</strong> (Art. 15 DSGVO) über die zu Ihrer Person
            gespeicherten Daten,
          </li>
          <li>
            <strong>Berichtigung</strong> (Art. 16 DSGVO) unrichtiger Daten,
          </li>
          <li>
            <strong>Löschung</strong> (Art. 17 DSGVO) Ihrer Daten durch Löschung
            Ihres Kontos,
          </li>
          <li>
            <strong>Widerspruch</strong> (Art. 21 DSGVO) gegen die Verarbeitung
            Ihrer Daten.
          </li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte unter{' '}
          <a href="mailto:contact@glamcloset.example.com">
            contact@glamcloset.example.com
          </a>
          . Sie haben zudem das Recht auf Beschwerde bei einer
          Aufsichtsbehörde (Art. 77 DSGVO).
        </p>

        <h2>7. Cookies</h2>
        <p>
          Unsere Anwendung verwendet ausschließlich einen technisch notwendigen
          Session-Cookie. Dieser Cookie dient der Authentifizierung und wird als
          HttpOnly-Cookie gesetzt – er ist für JavaScript nicht zugänglich und
          enthält keine personenbezogenen Daten im Klartext. Der Cookie verfällt
          automatisch nach 24 Stunden oder bei Abmeldung.
        </p>
        <p>
          Es findet <strong>kein Tracking</strong>, kein Profiling und keine
          Weitergabe von Daten an Dritte zu Werbezwecken statt.
        </p>

        <div className="legal-back">
          <p>
            <Link to="/">Zurück zur Startseite</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default PrivacyPage;
