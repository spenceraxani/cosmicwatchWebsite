// The same calculations as the CosmicWatch GUI (GUI/GUI.py in the v3X repo),
// so a file gives the same numbers here as on the desktop.
import type { Run } from './run';

export type Series = 'all' | 'non' | 'coinc';
export const SERIES: Series[] = ['all', 'non', 'coinc'];

/** Indices of the events inside the ADC window, like the GUI's ADC Min / Max cut. */
export function select(run: Run, adcMin = 0, adcMax = 4095): Uint32Array {
  const out = new Uint32Array(run.n);
  let k = 0;
  for (let i = 0; i < run.n; i++) {
    const a = run.adc.data[i];
    if (a >= adcMin && a <= adcMax) out[k++] = i;
  }
  return out.subarray(0, k);
}

const isCoinc = (run: Run, i: number) => run.flag.data[i] === 1;
const inSeries = (run: Run, i: number, s: Series) =>
  s === 'all' || (s === 'coinc') === isCoinc(run, i);

/** Round a value and its error to the error's second significant digit (GUI `round`). */
export function roundPair(x: number, err: number): [string, string] {
  if (!(err > 0) || !Number.isFinite(x)) return [String(x), String(err)];
  const digits = Math.max(0, 1 - Math.floor(Math.log10(err)));
  return [x.toFixed(digits), err.toFixed(digits)];
}

export interface Totals {
  events: number;
  coincident: number;
  duration: number; // s
  liveTime: number; // s, duration minus the detector's deadtime
  rate: Record<Series, number>;
  err: Record<Series, number>;
  temp: number;
  press: number; // Pa
}

export function totals(run: Run, idx: Uint32Array): Totals {
  const n = idx.length;
  const zero = { all: 0, non: 0, coinc: 0 };
  if (n < 2)
    return {
      events: n,
      coincident: 0,
      duration: 0,
      liveTime: 0,
      rate: { ...zero },
      err: { ...zero },
      temp: NaN,
      press: NaN,
    };
  let c = 0,
    tSum = 0,
    pSum = 0,
    tN = 0,
    pN = 0;
  let tMin = Infinity,
    tMax = -Infinity,
    dMin = Infinity,
    dMax = -Infinity;
  for (const i of idx) {
    if (isCoinc(run, i)) c++;
    const t = run.t.data[i],
      d = run.dead.data[i];
    if (t < tMin) tMin = t;
    if (t > tMax) tMax = t;
    if (d < dMin) dMin = d;
    if (d > dMax) dMax = d;
    const T = run.temp.data[i],
      P = run.press.data[i];
    if (Number.isFinite(T)) {
      tSum += T;
      tN++;
    }
    if (Number.isFinite(P)) {
      pSum += P;
      pN++;
    }
  }
  const duration = tMax - tMin;
  const live = Math.max(1e-9, duration - (dMax - dMin));
  const counts = { all: n, non: n - c, coinc: c };
  const rate = {
    all: counts.all / live,
    non: counts.non / live,
    coinc: counts.coinc / live,
  };
  const err = {
    all: Math.sqrt(counts.all) / live,
    non: Math.sqrt(counts.non) / live,
    coinc: Math.sqrt(counts.coinc) / live,
  };
  return {
    events: n,
    coincident: c,
    duration,
    liveTime: live,
    rate,
    err,
    temp: tN ? tSum / tN : NaN,
    press: pN ? pSum / pN : NaN,
  };
}

/** The GUI's default bin: the choice closest to run length / 200. */
export const BIN_CHOICES = [30, 60, 120, 180, 240, 600];
export function autoBin(duration: number) {
  const ideal = duration / 200;
  return BIN_CHOICES.reduce(
    (best, b) => (Math.abs(b - ideal) < Math.abs(best - ideal) ? b : best),
    BIN_CHOICES[0]
  );
}

export interface Binned {
  binSec: number;
  minutes: number[]; // bin centre, minutes since the first event
  counts: Record<Series, number[]>;
  rate: Record<Series, number[]>;
  rateErr: Record<Series, number[]>;
  press: number[]; // Pa
  temp: number[]; // °C
  ax: number[];
  ay: number[];
  az: number[];
  gx: number[];
  gy: number[];
  gz: number[];
}

/**
 * Fixed time bins from the first event, dropping the last partial bin (as the GUI's
 * `range(0, max_t, bin)` does). Rates divide by each bin's live time: the sum of
 * the event gaps minus the deadtime the detector reported for those events.
 */
export function binByTime(run: Run, idx: Uint32Array, binSec: number): Binned {
  const empty = (): Record<Series, number[]> => ({
    all: [],
    non: [],
    coinc: [],
  });
  const out: Binned = {
    binSec,
    minutes: [],
    counts: empty(),
    rate: empty(),
    rateErr: empty(),
    press: [],
    temp: [],
    ax: [],
    ay: [],
    az: [],
    gx: [],
    gy: [],
    gz: [],
  };
  if (idx.length < 2) return out;
  const t0 = run.t.data[idx[0]];
  let dMin = Infinity;
  for (const i of idx) dMin = Math.min(dMin, run.dead.data[i]);
  const tLast = run.t.data[idx[idx.length - 1]] - t0;
  const nb = Math.max(0, Math.ceil(Math.floor(tLast) / binSec) - 1);
  if (nb === 0) return out;

  const zeros = () => new Float64Array(nb);
  const cAll = zeros(),
    cCo = zeros(),
    live = zeros(),
    nEv = zeros();
  const sums = {
    press: zeros(),
    temp: zeros(),
    ax: zeros(),
    ay: zeros(),
    az: zeros(),
    gx: zeros(),
    gy: zeros(),
    gz: zeros(),
  };
  const nVal = {
    press: zeros(),
    temp: zeros(),
    ax: zeros(),
    ay: zeros(),
    az: zeros(),
    gx: zeros(),
    gy: zeros(),
    gz: zeros(),
  };
  const cols = {
    press: run.press,
    temp: run.temp,
    ax: run.ax,
    ay: run.ay,
    az: run.az,
    gx: run.gx,
    gy: run.gy,
    gz: run.gz,
  };
  const hi = nb * binSec;
  let prevT = 0,
    prevD = 0;
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k];
    const t = run.t.data[i] - t0;
    const d = run.dead.data[i] - dMin;
    const evDead = d - prevD;
    const evLive = t - prevT - evDead;
    prevT = t;
    prevD = d;
    if (t > hi) continue; // numpy's last bin includes its right edge
    const b = Math.min(nb - 1, Math.floor(t / binSec));
    cAll[b]++;
    if (isCoinc(run, i)) cCo[b]++;
    live[b] += evLive;
    nEv[b]++;
    for (const key of Object.keys(sums) as (keyof typeof sums)[]) {
      const v = cols[key].data[i];
      if (Number.isFinite(v)) {
        sums[key][b] += v;
        nVal[key][b]++;
      }
    }
  }
  // Mean per bin; empty bins are filled by interpolating their neighbours, as in the GUI.
  const mean = (sum: Float64Array, nv: Float64Array) => {
    const v = Array.from(sum, (s, b) => (nv[b] ? s / nv[b] : NaN));
    const good = v
      .map((x, b) => (Number.isFinite(x) ? b : -1))
      .filter(b => b >= 0);
    if (good.length > 1) {
      for (let b = 0; b < nb; b++) {
        if (Number.isFinite(v[b])) continue;
        const r = good.find(g => g > b);
        const l = [...good].reverse().find(g => g < b);
        if (l === undefined) v[b] = v[r!];
        else if (r === undefined) v[b] = v[l];
        else v[b] = v[l] + ((v[r] - v[l]) * (b - l)) / (r - l);
      }
    }
    return v;
  };
  for (let b = 0; b < nb; b++) {
    const lt = live[b] > 0 ? live[b] : NaN;
    const counts = { all: cAll[b], non: cAll[b] - cCo[b], coinc: cCo[b] };
    out.minutes.push(((b + 0.5) * binSec) / 60);
    for (const s of SERIES) {
      out.counts[s].push(counts[s]);
      out.rate[s].push(counts[s] / lt);
      out.rateErr[s].push(Math.sqrt(counts[s]) / lt);
    }
  }
  for (const key of Object.keys(sums) as (keyof typeof sums)[])
    out[key] = mean(sums[key], nVal[key]);
  return out;
}

export interface Hist {
  centres: number[];
  edges: number[];
  values: Record<Series, number[]>; // rate per bin, s⁻¹
  errs: Record<Series, number[]>;
}

/**
 * Log-spaced histogram of ADC or SiPM values, each event weighted by 1 / live time,
 * so the y axis is a rate per bin (the GUI's `NPlot`).
 */
export function logHistogram(
  run: Run,
  idx: Uint32Array,
  key: 'adc' | 'sipm',
  liveTime: number,
  nBins = 100
): Hist | null {
  const col = run[key].data;
  let lo = Infinity,
    hi = -Infinity;
  for (const i of idx) {
    const v = col[i];
    if (!Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo) || !(hi > 0)) return null;
  if (key === 'adc') lo = Math.max(lo, 1);
  else {
    lo = Math.max(lo, 1e-10) * 0.95;
    hi *= 1.05;
  }
  if (!(hi > lo)) hi = lo * 2;
  const l0 = Math.log10(lo),
    l1 = Math.log10(hi);
  const edges = Array.from(
    { length: nBins + 1 },
    (_, k) => 10 ** (l0 + ((l1 - l0) * k) / nBins)
  );
  const w = 1 / Math.max(1e-9, liveTime);
  const counts = {
    all: new Float64Array(nBins),
    non: new Float64Array(nBins),
    coinc: new Float64Array(nBins),
  };
  for (const i of idx) {
    const v = col[i];
    if (!(v >= lo && v <= hi)) continue;
    const b = Math.min(
      nBins - 1,
      Math.floor(((Math.log10(v) - l0) / (l1 - l0)) * nBins)
    );
    counts.all[b]++;
    counts[isCoinc(run, i) ? 'coinc' : 'non'][b]++;
  }
  const values = {
    all: [] as number[],
    non: [] as number[],
    coinc: [] as number[],
  };
  const errs = {
    all: [] as number[],
    non: [] as number[],
    coinc: [] as number[],
  };
  for (const s of SERIES) {
    for (let b = 0; b < nBins; b++) {
      values[s].push(counts[s][b] * w);
      errs[s].push(Math.sqrt(counts[s][b]) * w);
    }
  }
  const centres = edges.slice(0, -1).map((e, k) => Math.sqrt(e * edges[k + 1]));
  return { centres, edges, values, errs };
}

/** Median of the ADC or SiPM values of one series (NaN if there are none). */
export function median(
  run: Run,
  idx: Uint32Array,
  key: 'adc' | 'sipm',
  s: Series
): number {
  const v: number[] = [];
  for (const i of idx) {
    const x = run[key].data[i];
    if (inSeries(run, i, s) && Number.isFinite(x)) v.push(x);
  }
  if (!v.length) return NaN;
  v.sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function logFactorial(k: number) {
  if (k < 2) return 0;
  if (k < 256) {
    let s = 0;
    for (let j = 2; j <= k; j++) s += Math.log(j);
    return s;
  }
  // Stirling series
  return (
    k * Math.log(k) -
    k +
    0.5 * Math.log(2 * Math.PI * k) +
    1 / (12 * k) -
    1 / (360 * k ** 3)
  );
}
const poissonPmf = (k: number, lam: number) =>
  k < 0 ? 0 : Math.exp(k * Math.log(lam) - lam - logFactorial(k));

export interface FitCurve {
  x: number[];
  y: number[];
  chi2dof: number;
}

/**
 * Histogram of the counts per time bin with a Poisson fit (the GUI's Rate
 * Distribution). The histogram groups neighbouring count values so each bar holds
 * several time bins, the fit is scaled to the number of time bins, and χ² uses only
 * bars expected to hold at least 5, so χ²/dof near 1 means the counts are Poisson.
 */
export function rateDistribution(b: Binned) {
  const bin = b.binSec;
  const out: Partial<
    Record<
      Series,
      {
        centres: number[];
        edges: number[];
        counts: number[];
        expected: number[];
        fit: FitCurve;
      }
    >
  > = {};
  for (const s of SERIES) {
    const ks = b.counts[s].filter((_, i) => Number.isFinite(b.rate[s][i]));
    const N = ks.length;
    if (N < 3) continue;
    const lam = ks.reduce((a, v) => a + v, 0) / N;
    if (!(lam > 0)) continue;
    const sig = Math.sqrt(lam);
    const lo = Math.max(
      0,
      Math.floor(Math.min(lam - 4 * sig, Math.min(...ks)))
    );
    const hi = Math.ceil(Math.max(lam + 4 * sig, Math.max(...ks)));
    const target = Math.max(8, Math.min(40, Math.round(2 * Math.sqrt(N))));
    const w = Math.max(1, Math.ceil((hi - lo + 1) / target));
    const nb = Math.ceil((hi - lo + 1) / w);
    const counts = new Array(nb).fill(0);
    for (const k of ks) counts[Math.min(nb - 1, Math.floor((k - lo) / w))]++;
    const expected = counts.map((_, j) => {
      let p = 0;
      for (let k = lo + j * w; k < lo + (j + 1) * w; k++)
        p += poissonPmf(k, lam);
      return N * p;
    });
    // Count k covers [k - 0.5, k + 0.5); shown as a rate, counts / bin time.
    const edges = Array.from(
      { length: nb + 1 },
      (_, j) => (lo + j * w - 0.5) / bin
    );
    const centres = edges.slice(0, -1).map((e, j) => (e + edges[j + 1]) / 2);
    let chi2 = 0,
      used = 0;
    expected.forEach((e, j) => {
      if (e >= 5) {
        chi2 += (counts[j] - e) ** 2 / e;
        used++;
      }
    });
    const xs: number[] = [],
      ys: number[] = [];
    const step = Math.max(1, Math.floor((hi - lo) / 300));
    for (let k = lo; k <= hi; k += step) {
      xs.push(k / bin);
      ys.push(N * w * poissonPmf(k, lam));
    }
    out[s] = {
      centres,
      edges,
      counts,
      expected,
      fit: { x: xs, y: ys, chi2dof: used > 1 ? chi2 / (used - 1) : NaN },
    };
  }
  return Object.keys(out).length ? { series: out } : null;
}

/** Log-binned gaps between events with an exponential fit (the GUI's Δt Distribution). */
export function dtDistribution(run: Run, idx: Uint32Array, nBins = 101) {
  const gaps: Record<Series, number[]> = { all: [], non: [], coinc: [] };
  for (const s of SERIES) {
    const ts: number[] = [];
    for (const i of idx) if (inSeries(run, i, s)) ts.push(run.t.data[i]);
    ts.sort((a, b) => a - b);
    for (let k = 1; k < ts.length; k++) {
      const d = ts[k] - ts[k - 1];
      if (d > 0) gaps[s].push(d);
    }
  }
  const tMin = 0.01;
  let tMax = 0;
  for (const s of SERIES) for (const d of gaps[s]) if (d > tMax) tMax = d;
  if (!(tMax > tMin)) return null;
  const l0 = Math.log10(tMin),
    l1 = Math.log10(tMax);
  const edges = Array.from(
    { length: nBins + 1 },
    (_, k) => 10 ** (l0 + ((l1 - l0) * k) / nBins)
  );
  const centres = edges.slice(0, -1).map((e, k) => (e + edges[k + 1]) / 2);
  const out: Partial<
    Record<Series, { counts: number[]; fit: FitCurve; mean: number; n: number }>
  > = {};
  for (const s of SERIES) {
    const g = gaps[s];
    if (g.length < 2) continue;
    const counts = new Array(nBins).fill(0);
    for (const d of g) {
      if (d < tMin || d > tMax) continue;
      counts[
        Math.min(
          nBins - 1,
          Math.floor(((Math.log10(d) - l0) / (l1 - l0)) * nBins)
        )
      ]++;
    }
    const mean = g.reduce((a, v) => a + v, 0) / g.length;
    const lam = 1 / mean;
    const xs = Array.from(
      { length: 300 },
      (_, j) => 10 ** (l0 + ((l1 - l0) * j) / 299)
    );
    const ys = xs.map(
      t =>
        (g.length * lam * Math.exp(-lam * t) * t * Math.LN10 * (l1 - l0)) /
        nBins
    );
    let chi2 = 0,
      used = 0;
    centres.forEach((c, k) => {
      const e = g.length * lam * Math.exp(-lam * c) * (edges[k + 1] - edges[k]);
      if (e > 0) {
        chi2 += (counts[k] - e) ** 2 / e;
        used++;
      }
    });
    out[s] = {
      counts,
      fit: { x: xs, y: ys, chi2dof: chi2 / Math.max(1, used - 1) },
      mean,
      n: g.length,
    };
  }
  return { centres, edges, tMin, tMax, series: out };
}
