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
  .legal-page p {
    color: var(--color-muted);
    font-size: 15px;
    line-height: 1.7;
    margin-bottom: 12px;
  }
  .legal-page a {
    color: var(--color-accent);
  }
  .legal-page a:hover {
    color: var(--color-accent_light);
  }
  .legal-page address {
    font-style: normal;
    color: var(--color-fg);
    font-size: 15px;
    line-height: 1.7;
  }
  .legal-back {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--color-border);
  }
`;

function ImprintPage() {
  return (
    <>
      <style>{CSS}</style>
      <div className="legal-page">
        <h1>Impressum</h1>

        <h2>Angaben gemäß § 5 TMG</h2>
        <p>
          <strong>GlamCloset GmbH</strong>
        </p>
        <address>
          Musterstraße 1<br />
          10115 Berlin<br />
          Deutschland
        </address>

        <h2>Vertreten durch</h2>
        <p>
          Geschäftsführer: Alexander von Kleid<br />
          Handelsregister: Amtsgericht Charlottenburg, HRB 123456
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail:{' '}
          <a href="mailto:contact@glamcloset.example.com">
            contact@glamcloset.example.com
          </a>
          <br />
          Telefon: +49 (0)30 1234567
        </p>

        <h2>Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
          DE123456789
        </p>

        <h2>
          Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
        </h2>
        <p>
          Alexander von Kleid<br />
          Musterstraße 1, 10115 Berlin
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

export default ImprintPage;
