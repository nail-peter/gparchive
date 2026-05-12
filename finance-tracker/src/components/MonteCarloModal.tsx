import { useMemo } from 'react';
import { monteCarlo } from '../simulation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Props {
  startCapital: number;
  monthlyExpenses: number;
  realReturnPct: number;
  inflationPct: number;
  onClose: () => void;
}

function fmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${v}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>Alter {label}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} style={{ color: e.color ?? e.fill, margin: '2px 0' }}>
          {e.name}: {new Intl.NumberFormat('de-DE').format(Math.round(e.value))} €
        </p>
      ))}
    </div>
  );
}

export function MonteCarloModal({ startCapital, monthlyExpenses, realReturnPct, inflationPct, onClose }: Props) {
  const { results, successRate } = useMemo(
    () => monteCarlo(startCapital, monthlyExpenses, realReturnPct, inflationPct, 1000, 12),
    [startCapital, monthlyExpenses, realReturnPct, inflationPct],
  );

  const xTicks = results.filter(d => (d.age - 48) % 3 === 0).map(d => d.age);

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
          background: '#1a2035', borderRadius: 16, padding: 32, maxWidth: 860,
          width: '95vw', maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, margin: 0 }}>
              Monte-Carlo Simulation
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
              1.000 Szenarien mit zufälligen Jahresrenditen (Ø {realReturnPct.toFixed(1)}%, σ 12%)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>

        {/* Success rate badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: successRate >= 80 ? 'rgba(52,211,153,0.12)' : successRate >= 50 ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)',
          borderRadius: 10, padding: '10px 20px', marginBottom: 20,
        }}>
          <span style={{
            fontSize: 32, fontWeight: 800,
            color: successRate >= 80 ? '#34d399' : successRate >= 50 ? '#f59e0b' : '#f87171',
          }}>
            {successRate.toFixed(1)}%
          </span>
          <div>
            <p style={{ color: '#e2e8f0', margin: 0, fontWeight: 600 }}>Erfolgsquote</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Kapital reicht bis Alter 100</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={results} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="p90grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="age"
              ticks={xTicks}
              tickFormatter={v => `Alter ${v}`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={54}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="p90" name="90. Perzentile" stroke="#3b82f6" fill="url(#p90grad)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="p75" name="75. Perzentile" stroke="#60a5fa" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            <Area type="monotone" dataKey="p50" name="Median (50.)" stroke="#f1f5f9" fill="none" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="p25" name="25. Perzentile" stroke="#f472b6" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            <Area type="monotone" dataKey="p10" name="10. Perzentile" stroke="#f87171" fill="none" strokeWidth={1.5} dot={false} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          </AreaChart>
        </ResponsiveContainer>

        <p style={{ color: '#475569', fontSize: 12, marginTop: 16 }}>
          Die Simulation berücksichtigt die gleichen Einkommensquellen wie die Hauptansicht (Hausgeld, Rente).
          Renditen folgen einer Normalverteilung um den eingestellten Realertrag.
        </p>
      </div>
    </div>
  );
}
