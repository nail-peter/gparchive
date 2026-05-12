import { useState, useMemo } from 'react';
import './App.css';
import {
  simulate,
  wealthAtAge,
  depletionAge,
  START_CAPITAL,
  START_AGE,
  START_YEAR,
  IST_AUSGABEN,
  RENTE_START_AGE,
} from './simulation';
import { WealthChart } from './components/WealthChart';
import { MonteCarloModal } from './components/MonteCarloModal';
import { PortfolioAnalysisModal, AdvisorModal } from './components/AIModal';

type WithdrawalRule = 'Feste Entnahme' | 'Inflationsanpassung' | '4%-Regel';
type Modal = 'montecarlo' | 'portfolio' | 'advisor' | null;

function SliderControl({
  label, value, min, max, step, onChange, color = 'blue',
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; color?: 'blue' | 'pink';
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
      <span style={{ color: '#94a3b8', fontSize: 11, letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="range" min={min} max={max} step={step} value={value}
          className={color === 'pink' ? 'slider-pink' : ''}
          onChange={e => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: color === 'pink' ? '#f472b6' : '#60a5fa' }}
        />
        <span style={{ color: '#f1f5f9', fontWeight: 700, minWidth: 44, textAlign: 'right' }}>
          {value.toLocaleString('de-DE')}
        </span>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, color = '#f1f5f9', sub,
}: {
  label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <div style={{
      background: '#151b27', borderRadius: 12, padding: '20px 24px',
      flex: '1 1 0', minWidth: 160,
    }}>
      <p style={{ color: '#64748b', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ color, fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
        {value}
      </p>
      {sub && <p style={{ color: '#475569', fontSize: 12, margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

function NavButton({
  label, icon, onClick, bg,
}: {
  label: string; icon: string; onClick: () => void; bg: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: bg, border: 'none', borderRadius: 8,
        color: '#f1f5f9', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}

function IncomeSource({ label, amount, note, color }: { label: string; amount: number; note: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 3, height: 40, background: color, borderRadius: 2 }} />
      <div>
        <p style={{ color, fontSize: 14, fontWeight: 700, margin: 0 }}>{label}: {amount} €/Monat</p>
        <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>{note}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [ausgaben, setAusgaben] = useState(1400);
  const [inflation, setInflation] = useState(2.9);
  const [realReturn, setRealReturn] = useState(0.3);
  const [whatIfActive, setWhatIfActive] = useState(true);
  const [whatIfExpenses, setWhatIfExpenses] = useState(1900);
  const [withdrawalRule, setWithdrawalRule] = useState<WithdrawalRule>('Feste Entnahme');
  const [activeModal, setActiveModal] = useState<Modal>(null);

  const zielData = useMemo(() => simulate(START_CAPITAL, ausgaben, realReturn, inflation), [ausgaben, realReturn, inflation]);
  const istData = useMemo(() => simulate(START_CAPITAL, IST_AUSGABEN, realReturn, inflation), [realReturn, inflation]);
  const whatifData = useMemo(
    () => whatIfActive ? simulate(START_CAPITAL, whatIfExpenses, realReturn, inflation) : null,
    [whatIfActive, whatIfExpenses, realReturn, inflation],
  );

  const wealthAt67 = wealthAtAge(zielData, RENTE_START_AGE);
  const depletion = depletionAge(zielData);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <header style={{
        background: '#111827', borderBottom: '1px solid #1e293b',
        padding: '16px 24px', display: 'flex', flexWrap: 'wrap',
        gap: 20, alignItems: 'flex-end',
      }}>
        {/* Logo */}
        <div style={{ minWidth: 130, alignSelf: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 26 }}>🐷</span>
            <h1 style={{ color: '#f472b6', fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
              Finanz<br />Tracker
            </h1>
          </div>
          <p style={{ color: '#475569', fontSize: 11, margin: '4px 0 0' }}>
            Startjahr: {START_YEAR} • Aktuelles Alter: {START_AGE} Jahre
          </p>
        </div>

        {/* Ausgaben slider */}
        <SliderControl label="Ausgaben (€/M)" value={ausgaben} min={200} max={4000} step={50} onChange={setAusgaben} />

        {/* Inflation with EZB badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8', fontSize: 11, letterSpacing: '0.05em' }}>Inflation (% p.a.)</span>
            <span style={{
              background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 700,
              padding: '1px 6px', borderRadius: 3, letterSpacing: '0.04em',
            }}>○ EZB LIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range" min={0} max={10} step={0.1} value={inflation}
              className="slider-pink"
              onChange={e => setInflation(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#f472b6' }}
            />
            <span style={{ color: '#f1f5f9', fontWeight: 700, minWidth: 28 }}>{inflation.toFixed(1)}</span>
          </div>
        </div>

        {/* Portfolio real return */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: '#94a3b8', fontSize: 11, letterSpacing: '0.05em' }}>Ø Portfolio-Rendite (Real)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <input
              type="number" value={realReturn} step={0.1} min={-5} max={15}
              onChange={e => setRealReturn(Number(e.target.value))}
              style={{
                background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
                color: '#34d399', fontWeight: 800, fontSize: 26, width: 75, padding: '2px 6px',
                textAlign: 'right',
              }}
            />
            <div>
              <span style={{ color: '#34d399', fontSize: 16, fontWeight: 700 }}> %</span>
              <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>Nach Steuern</p>
            </div>
          </div>
        </div>

        {/* What-If */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>? What-If Szenario</span>
            <button
              onClick={() => setWhatIfActive(v => !v)}
              style={{
                background: whatIfActive ? '#d97706' : '#374151',
                border: 'none', borderRadius: 4, color: '#fff', fontSize: 9,
                fontWeight: 700, padding: '2px 7px', cursor: 'pointer',
              }}
            >
              {whatIfActive ? 'AKTIV' : 'INAKTIV'}
            </button>
          </div>
          {whatIfActive && (
            <SliderControl
              label="Ausgaben (€)" value={whatIfExpenses} min={200} max={5000} step={50}
              onChange={setWhatIfExpenses} color="pink"
            />
          )}
        </div>

        {/* Withdrawal rule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>💰 Entnahmeregel</span>
          <select
            value={withdrawalRule}
            onChange={e => setWithdrawalRule(e.target.value as WithdrawalRule)}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
              color: '#f1f5f9', fontSize: 13, padding: '6px 10px', cursor: 'pointer',
            }}
          >
            <option>Feste Entnahme</option>
            <option>Inflationsanpassung</option>
            <option>4%-Regel</option>
          </select>
        </div>

        {/* Nav buttons — push to far right */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <NavButton icon="🎲" label="Monte-Carlo" onClick={() => setActiveModal('montecarlo')} bg="#7c3aed" />
          <NavButton icon="✦" label="KI-Portfolio-Analyse" onClick={() => setActiveModal('portfolio')} bg="#6d28d9" />
          <NavButton icon="💡" label="KI-Finanzberater" onClick={() => setActiveModal('advisor')} bg="#059669" />
          <NavButton icon="📄" label="PDF Export" onClick={() => window.print()} bg="#1e293b" />
        </div>
      </header>

      {/* ── Summary Cards ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, padding: '20px 24px 0', flexWrap: 'wrap' }}>
        <SummaryCard label="IST-Ausgaben/M" value={`${IST_AUSGABEN.toLocaleString('de-DE')} €`} color="#f87171" />
        <SummaryCard
          label={`Startvermögen (${START_YEAR})`}
          value={`${START_CAPITAL.toLocaleString('de-DE')} €`}
        />
        <SummaryCard
          label="Vermögen mit 67"
          value={`${Math.round(wealthAt67).toLocaleString('de-DE')} €`}
          color="#34d399"
          sub="bei Zielausgaben"
        />
        <SummaryCard
          label="Reichweite (Alter bei 0€)"
          value={depletion ? `${depletion} J.` : '> 100 J.'}
          color={depletion ? '#f59e0b' : '#34d399'}
          sub="bei Zielausgaben"
        />
      </div>

      {/* ── Chart ──────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px' }}>
        <WealthChart
          zielData={zielData}
          istData={istData}
          whatifData={whatifData}
          whatifExpenses={whatIfExpenses}
        />
      </div>

      {/* ── Income info bar ────────────────────────────────── */}
      <div style={{
        margin: '0 24px 40px', background: '#151b27', borderRadius: 12,
        padding: '16px 20px', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <div>
          <p style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>
            Einkommensquellen
          </p>
          <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>Werden automatisch von den Ausgaben abgezogen</p>
        </div>
        <IncomeSource label="Hausgeld" amount={750} note="nicht inflationsangepasst, bis Alter 60" color="#60a5fa" />
        <IncomeSource label="Netto-Rente" amount={611} note="ab Alter 67, steigt mit Inflation" color="#34d399" />
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      {activeModal === 'montecarlo' && (
        <MonteCarloModal
          startCapital={START_CAPITAL}
          monthlyExpenses={ausgaben}
          realReturnPct={realReturn}
          inflationPct={inflation}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'portfolio' && (
        <PortfolioAnalysisModal
          realReturn={realReturn}
          inflation={inflation}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'advisor' && (
        <AdvisorModal
          expenses={ausgaben}
          startCapital={START_CAPITAL}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
