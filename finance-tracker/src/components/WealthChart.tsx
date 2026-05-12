import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { YearPoint } from '../simulation';

interface ChartData {
  age: number;
  ziel: number;
  ist: number;
  whatif?: number;
}

interface Props {
  zielData: YearPoint[];
  istData: YearPoint[];
  whatifData: YearPoint[] | null;
  whatifExpenses: number;
}

function fmt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${v}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>Alter {label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name}: {new Intl.NumberFormat('de-DE').format(Math.round(entry.value))} €
        </p>
      ))}
    </div>
  );
}

export function WealthChart({ zielData, istData, whatifData, whatifExpenses }: Props) {
  const combined: ChartData[] = zielData.map((pt, i) => ({
    age: pt.age,
    ziel: pt.wealth,
    ist: istData[i]?.wealth ?? 0,
    ...(whatifData ? { whatif: whatifData[i]?.wealth ?? 0 } : {}),
  }));

  // tick every 3 years for readability
  const xTicks = combined.filter(d => (d.age - 48) % 3 === 0).map(d => d.age);

  return (
    <div style={{ background: '#151b27', borderRadius: 12, padding: '24px 8px 16px 8px' }}>
      <h2 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 600, margin: '0 0 4px 16px' }}>
        Vermögensentwicklung: Realität vs. Ziel (Kaufkraftbereinigt)
      </h2>
      <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 20px 16px', maxWidth: 860, lineHeight: 1.5 }}>
        Hinweis: Es werden im Hintergrund Einnahmen von den Ausgaben abgezogen: 750 €/Monat (Hausgeld,
        nicht inflationsangepasst, bis Alter 60) sowie 611 €/Monat (Netto-Rente, ab Alter 67, steigt
        mit der Inflation). Der Graph zeigt das reale (kaufkraftbereinigte) Nettovermögen.{' '}
        {whatifData && (
          <span style={{ color: '#f59e0b' }}>
            Das What-If Szenario rechnet mit {whatifExpenses.toLocaleString('de-DE')}€/Monat Ausgaben.
          </span>
        )}
      </p>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={combined} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
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
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />

          {whatifData && (
            <Line
              type="monotone"
              dataKey="whatif"
              name={`Reales Vermögen (What-If)`}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}

          <Line
            type="monotone"
            dataKey="ist"
            name="Reales Vermögen (bei Ist-Ausgaben)"
            stroke="#f472b6"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="ziel"
            name={`Reales Vermögen (bei Zielausgaben)`}
            stroke="#34d399"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        {whatifData && (
          <LegendItem color="#f59e0b" dashed label="Reales Vermögen (What-If)" />
        )}
        <LegendItem color="#f472b6" dashed label="Reales Vermögen (bei Ist-Ausgaben)" />
        <LegendItem color="#34d399" dashed={false} label="Reales Vermögen (bei Zielausgaben)" />
      </div>
    </div>
  );
}

function LegendItem({ color, dashed, label }: { color: string; dashed: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
      <svg width="28" height="10">
        <line
          x1="0" y1="5" x2="28" y2="5"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={dashed ? '5 3' : undefined}
        />
        <circle cx="14" cy="5" r="3" fill={color} />
      </svg>
      <span style={{ color }}>{label}</span>
    </div>
  );
}
