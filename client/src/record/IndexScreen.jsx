// The Index — table of contents for the four archive sections.

const toRoman = (num) => {
  const table = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = num;
  let out = '';
  for (const [v, sym] of table) {
    while (n >= v) {
      out += sym;
      n -= v;
    }
  }
  return out;
};

/** "Fall 2026" → "Fall Term · MMXXVI"; anything unparseable shows as-is. */
const termKicker = (term) => {
  const m = /^(.+?)\s+(\d{4})$/.exec(String(term || '').trim());
  return m ? `${m[1]} Term · ${toRoman(Number(m[2]))}` : String(term || '');
};

export default function IndexScreen({ onOpen, stats, term, role = 'member' }) {
  const allSections = [
    {
      no: '01',
      title: 'Life Points Ledger',
      desc: 'Family Cup standings, podium, streak bonuses, and individual records — synced live from Google Sheets.',
      folio: 'Folio 01',
      cta: 'Open ledger',
      color: '#6f2b26',
      key: 'rankings',
    },
    {
      no: '02',
      title: 'Family Lineage',
      desc: 'Trace the pledge classes and brothers across five families and every mentorship tie.',
      folio: 'Folio 02',
      cta: 'Browse families',
      color: '#9a7327',
      key: 'lineage',
    },
    {
      no: '03',
      title: 'Resources & Records',
      desc: 'Calendars, newsletters, officer contacts, and chapter deadlines, gathered in one register.',
      folio: 'Folio 03',
      cta: 'Open archive',
      color: '#6b6f3a',
      key: 'resources',
    },
    {
      no: '04',
      title: 'Alumni Network',
      desc: 'Sign in to view the alumni directory, your mentor pairing, and the mentorship workspace.',
      folio: 'Folio 04',
      cta: 'Enter network',
      color: '#5f6f86',
      key: 'alumni',
    },
  ];

  // An alumni account keeps the lineage; the Ledger, Hub and Network are the
  // active chapter's. Folio numbers are left as written so the archive's
  // numbering stays stable between the two views.
  const sections =
    role === 'alumni' ? allSections.filter((s) => s.key === 'lineage') : allSections;

  return (
    <div className="ncr-shell">
      <div className="ncr-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 30 }}>
        <div style={{ maxWidth: 620 }}>
          <div className="ncr-label ncr-label--gold" style={{ letterSpacing: '.36em', marginBottom: 14 }}>
            {termKicker(term)}
          </div>
          <h1 className="ncr-display-1" style={{ fontSize: 58, lineHeight: 0.98, marginBottom: 14 }}>The Index</h1>
          <p className="ncr-italic" style={{ fontSize: 18, lineHeight: 1.5, margin: 0, maxWidth: 480 }}>Choose a record to open.</p>
        </div>
        <div
          className="ncr-label"
          style={{ textAlign: 'right', fontSize: 11, letterSpacing: '.14em', lineHeight: 2.1 }}
        >
          Folio I
          <br />
          Curated by the Secretariat
        </div>
      </div>
      <div className="ncr-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {sections.map((row) => (
          <button
            key={row.key}
            className="ncr-lift"
            onClick={() => onOpen(row.key)}
            style={{
              position: 'relative',
              textAlign: 'left',
              background: 'var(--ncr-card-raised)',
              border: '1px solid rgba(43,35,24,.5)',
              padding: '30px 30px 26px',
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 7, background: row.color }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <span className="ncr-fig" style={{ fontFamily: 'var(--ncr-display)', fontSize: 42, lineHeight: 1, color: row.color }}>{row.no}</span>
              <span className="ncr-label" style={{ fontSize: 10, letterSpacing: '.18em', marginTop: 8 }}>{row.folio}</span>
            </div>
            <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 27, fontWeight: 700, color: 'var(--ncr-ink)', marginBottom: 8 }}>{row.title}</div>
            <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink-mid)', lineHeight: 1.5, marginBottom: 18 }}>{row.desc}</div>
            <span style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: row.color }}>
              {row.cta} →
            </span>
          </button>
        ))}
      </div>
      <div
        className="ncr-snapshot-grid ncr-band ncr-band--framed"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          marginTop: 34,
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={{ padding: '18px 16px 16px', borderRight: '1px solid rgba(43,35,24,.14)' }}>
            <div className="ncr-fig" style={{ fontFamily: 'var(--ncr-display)', fontSize: 36, lineHeight: 1, color: 'var(--ncr-ink)' }}>{s.fig}</div>
            <div className="ncr-label" style={{ fontSize: 10.5, letterSpacing: '.2em', marginTop: 9 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
