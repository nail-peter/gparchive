export const START_AGE = 48;
export const END_AGE = 100;
export const START_YEAR = 2026;
export const START_CAPITAL = 548_727;
export const IST_AUSGABEN = 979;       // actual monthly expenses (red card)
export const HAUSGELD = 750;           // monthly housing money until age 60
export const HAUSGELD_END_AGE = 60;
export const RENTE = 611;              // monthly pension from age 67 (inflation-adjusted)
export const RENTE_START_AGE = 67;

export interface YearPoint {
  age: number;
  wealth: number;
}

/**
 * Simulate real (inflation-adjusted) portfolio wealth year by year.
 *
 * We work entirely in today's purchasing power using the real return rate.
 * Hausgeld is NOT inflation-adjusted (nominal stays fixed), so its real value
 * erodes each year. Rente IS inflation-adjusted, so its real value stays constant.
 */
export function simulate(
  startCapital: number,
  monthlyExpenses: number,
  realReturnPct: number,
  inflationPct: number,
  startAge = START_AGE,
): YearPoint[] {
  const points: YearPoint[] = [];
  let portfolio = startCapital;
  const inflation = inflationPct / 100;
  const realReturn = realReturnPct / 100;

  for (let age = startAge; age <= END_AGE; age++) {
    const t = age - startAge;
    const hausgeldReal = age < HAUSGELD_END_AGE ? HAUSGELD / Math.pow(1 + inflation, t) : 0;
    const renteReal = age >= RENTE_START_AGE ? RENTE : 0;
    const netAnnual = (monthlyExpenses - hausgeldReal - renteReal) * 12;

    points.push({ age, wealth: Math.max(0, portfolio) });

    portfolio = (portfolio - netAnnual) * (1 + realReturn);
    if (portfolio < 0) portfolio = 0;
  }

  return points;
}

export function wealthAtAge(points: YearPoint[], age: number): number {
  return points.find(p => p.age === age)?.wealth ?? 0;
}

export function depletionAge(points: YearPoint[]): number | null {
  const hit = points.find(p => p.wealth <= 0);
  return hit ? hit.age : null;
}

// ---------- Monte Carlo ----------

export interface MCResult {
  age: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

function normalRandom(mean: number, std: number): number {
  // Box-Muller
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

export function monteCarlo(
  startCapital: number,
  monthlyExpenses: number,
  realReturnPct: number,
  inflationPct: number,
  runs = 1000,
  stdPct = 12,
): { results: MCResult[]; successRate: number } {
  const inflation = inflationPct / 100;
  const years = END_AGE - START_AGE + 1;

  // Store each path's value at each age
  const paths: number[][] = Array.from({ length: years }, () => []);

  let successCount = 0;

  for (let r = 0; r < runs; r++) {
    let portfolio = startCapital;
    let survived = true;

    for (let i = 0; i < years; i++) {
      const age = START_AGE + i;
      const t = i;
      const hausgeldReal = age < HAUSGELD_END_AGE ? HAUSGELD / Math.pow(1 + inflation, t) : 0;
      const renteReal = age >= RENTE_START_AGE ? RENTE : 0;
      const netAnnual = (monthlyExpenses - hausgeldReal - renteReal) * 12;
      const annualReturn = normalRandom(realReturnPct, stdPct) / 100;

      paths[i].push(Math.max(0, portfolio));

      portfolio = (portfolio - netAnnual) * (1 + annualReturn);
      if (portfolio < 0) {
        portfolio = 0;
        if (survived) survived = false;
      }
    }
    if (survived) successCount++;
  }

  function percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor((p / 100) * sorted.length);
    return sorted[Math.min(idx, sorted.length - 1)];
  }

  const results: MCResult[] = paths.map((vals, i) => ({
    age: START_AGE + i,
    p10: percentile(vals, 10),
    p25: percentile(vals, 25),
    p50: percentile(vals, 50),
    p75: percentile(vals, 75),
    p90: percentile(vals, 90),
  }));

  return { results, successRate: (successCount / runs) * 100 };
}
