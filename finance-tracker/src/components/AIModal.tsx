interface AIModalProps {
  title: string;
  icon: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function AIModal({ title, icon, onClose, children }: AIModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a2035', borderRadius: 16, padding: 32, maxWidth: 700,
          width: '95vw', maxHeight: '85vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: 0 }}>
            {icon} {title}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface PortfolioAnalysisProps {
  realReturn: number;
  inflation: number;
  onClose: () => void;
}

export function PortfolioAnalysisModal({ realReturn, inflation, onClose }: PortfolioAnalysisProps) {
  const allocations = [
    { name: 'Globale Aktien (ETF)', pct: 60, color: '#3b82f6', note: 'z.B. MSCI World / All Country' },
    { name: 'Anleihen (Staatsanleihen)', pct: 25, color: '#34d399', note: 'Stabilitätsanker, inflationsgebunden' },
    { name: 'Immobilien (REITs)', pct: 10, color: '#f59e0b', note: 'Hausgeld teilweise berücksichtigt' },
    { name: 'Cash & Geldmarkt', pct: 5, color: '#94a3b8', note: 'Liquiditätspuffer 6+ Monate' },
  ];
  return (
    <AIModal title="KI-Portfolio-Analyse" icon="✦" onClose={onClose}>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
        Basierend auf Ihrem Profil (Alter 48, Realrendite {realReturn.toFixed(1)}%, Inflation {inflation.toFixed(1)}%):
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {allocations.map(a => (
          <div key={a.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#e2e8f0', fontSize: 14 }}>{a.name}</span>
              <span style={{ color: a.color, fontWeight: 700, fontSize: 14 }}>{a.pct}%</span>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${a.pct}%`, background: a.color, height: '100%', borderRadius: 4 }} />
            </div>
            <p style={{ color: '#475569', fontSize: 12, marginTop: 3 }}>{a.note}</p>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: 10, padding: 16, marginTop: 20 }}>
        <p style={{ color: '#93c5fd', fontSize: 13, margin: 0 }}>
          <strong>KI-Empfehlung:</strong> Bei einer Realrendite von {realReturn.toFixed(1)}% liegt Ihr Portfolio im
          {realReturn < 2 ? ' konservativen' : realReturn < 5 ? ' ausgewogenen' : ' wachstumsorientierten'} Bereich.
          {inflation > 3
            ? ' Die aktuelle Inflation erfordert eine höhere Aktienquote zum Kapitalerhalt.'
            : ' Ihre Portfoliorendite schlägt die Inflation derzeit positiv.'}
        </p>
      </div>
    </AIModal>
  );
}

interface AdvisorModalProps {
  expenses: number;
  startCapital: number;
  onClose: () => void;
}

export function AdvisorModal({ expenses, startCapital, onClose }: AdvisorModalProps) {
  const tips = [
    {
      icon: '📉',
      title: 'Entnahme optimieren',
      text: `Ihre geplante Entnahme von ${expenses.toLocaleString('de-DE')} €/Monat ergibt eine Entnahmerate von ${((expenses * 12) / startCapital * 100).toFixed(2)}%. Die 4%-Regel empfiehlt max. ${Math.round(startCapital * 0.04 / 12).toLocaleString('de-DE')} €/Monat.`,
    },
    {
      icon: '📈',
      title: 'Rendite steigern',
      text: 'Eine Erhöhung der Aktienquote könnte die Realrendite auf 3–5% p.a. verbessern. Prüfen Sie kostengünstige ETF-Lösungen (TER < 0.2%).',
    },
    {
      icon: '🏦',
      title: 'Rente optimieren',
      text: `Ab 67 erhalten Sie 611 €/Monat gesetzliche Rente. Freiwillige Beitragsjahre oder Riester-Rente können die Rente erhöhen.`,
    },
    {
      icon: '📊',
      title: 'Steuerliche Optimierung',
      text: 'Nutzen Sie den Sparerpauschbetrag (1.000 €/Jahr) vollständig aus. Verlustverrechnung und Günstigerprüfung bei der Steuererklärung prüfen.',
    },
  ];

  return (
    <AIModal title="KI-Finanzberater" icon="💡" onClose={onClose}>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
        Personalisierte Empfehlungen basierend auf Ihrer Finanzsituation:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tips.map(tip => (
          <div key={tip.title} style={{ background: '#0f172a', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{tip.icon}</span>
              <div>
                <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 4px', fontSize: 14 }}>{tip.title}</p>
                <p style={{ color: '#64748b', margin: 0, fontSize: 13, lineHeight: 1.5 }}>{tip.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AIModal>
  );
}
