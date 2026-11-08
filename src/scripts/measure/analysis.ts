import type { Run } from './run';

export interface Binned {
  x: number[]; // bin centre, hours since the first event
  rate: number[]; // events per second
  err: number[]; // Poisson error on the rate
  temp: number[]; // mean °C in the bin
  press: number[]; // mean hPa in the bin
  counts: number[];
}

const sel = (run: Run, coinc: boolean, i: number) => !coinc || run.flag.data[i] === 1;

/** Rate in fixed time bins. The last, partial bin is dropped unless `keepPartial`. */
export function binByTime(run: Run, binSec: number, coinc: boolean, keepPartial = false): Binned {
  const out: Binned = { x: [], rate: [], err: [], temp: [], press: [], counts: [] };
  if (run.n < 2) return out;
  const t0 = run.t.data[0];
  const tEnd = run.t.data[run.n - 1];
  const nb = Math.max(1, Math.floor((tEnd - t0) / binSec) + (keepPartial ? 1 : 0));
  const counts = new Float64Array(nb);
  const tSum = new Float64Array(nb);
  const pSum = new Float64Array(nb);
  const all = new Float64Array(nb);
  for (let i = 0; i < run.n; i++) {
    const b = Math.floor((run.t.data[i] - t0) / binSec);
    if (b >= nb) continue;
    all[b]++;
    tSum[b] += run.temp.data[i];
    pSum[b] += run.press.data[i];
    if (sel(run, coinc, i)) counts[b]++;
  }
  for (let b = 0; b < nb; b++) {
    const width = keepPartial && b === nb - 1 ? Math.max(1e-6, tEnd - t0 - b * binSec) : binSec;
    out.x.push(((b + 0.5) * binSec) / 3600);
    out.counts.push(counts[b]);
    out.rate.push(counts[b] / width);
    out.err.push(Math.sqrt(counts[b]) / width);
    out.temp.push(all[b] ? tSum[b] / all[b] : NaN);
    out.press.push(all[b] ? pSum[b] / all[b] / 100 : NaN);
  }
  return out;
}

/** Weighted straight-line fit y = a + b·x with 1/σ² weights. */
export function fitLine(x: number[], y: number[], s: number[]) {
  let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
  for (let i = 0; i < x.length; i++) {
    if (!Number.isFinite(x[i]) || !Number.isFinite(y[i]) || !(s[i] > 0)) continue;
    const w = 1 / (s[i] * s[i]);
    S += w; Sx += w * x[i]; Sy += w * y[i]; Sxx += w * x[i] * x[i]; Sxy += w * x[i] * y[i];
  }
  const D = S * Sxx - Sx * Sx;
  if (!(D > 0)) return null;
  const a = (Sxx * Sy - Sx * Sxy) / D;
  const b = (S * Sxy - Sx * Sy) / D;
  return { a, b, sa: Math.sqrt(Sxx / D), sb: Math.sqrt(S / D) };
}

/** Rate against an environmental variable, plus the fitted slope in % per unit. */
export function correlate(bins: Binned, key: 'press' | 'temp') {
  const x = bins[key];
  const fit = fitLine(x, bins.rate, bins.err);
  const mean = bins.rate.reduce((s, v) => s + v, 0) / (bins.rate.length || 1);
  return {
    points: x.map((v, i) => ({ x: v, y: bins.rate[i] })).filter(p => Number.isFinite(p.x)),
    fit,
    percentPerUnit: fit ? (fit.b / mean) * 100 : NaN,
    percentErr: fit ? (fit.sb / mean) * 100 : NaN,
  };
}

/** Pulse-height (ADC) histogram for all events and for coincident events. */
export function spectrum(run: Run, nBins = 64, max = 4096) {
  const all = new Array(nBins).fill(0);
  const coinc = new Array(nBins).fill(0);
  const w = max / nBins;
  for (let i = 0; i < run.n; i++) {
    const b = Math.min(nBins - 1, Math.floor(run.adc.data[i] / w));
    all[b]++;
    if (run.flag.data[i]) coinc[b]++;
  }
  const centres = all.map((_, b) => Math.round((b + 0.5) * w));
  return { centres, all, coinc, width: w };
}

// For a Poisson process the gaps are exponential with the same mean rate.
export function intervals(run: Run, coinc: boolean, nBins = 50) {
  const dts: number[] = [];
  let last = NaN;
  for (let i = 0; i < run.n; i++) {
    if (!sel(run, coinc, i)) continue;
    const t = run.t.data[i];
    if (Number.isFinite(last)) dts.push(t - last);
    last = t;
  }
  if (!dts.length) return null;
  const mean = dts.reduce((s, v) => s + v, 0) / dts.length;
  const max = mean * 6;
  const w = max / nBins;
  const hist = new Array(nBins).fill(0);
  for (const d of dts) if (d < max) hist[Math.floor(d / w)]++;
  const rate = 1 / mean;
  const expected = hist.map((_, b) => dts.length * (Math.exp(-rate * b * w) - Math.exp(-rate * (b + 1) * w)));
  return { centres: hist.map((_, b) => (b + 0.5) * w), hist, expected, mean, n: dts.length, width: w };
}

// Time at each angle is the sum of event gaps while the detector sat there.
export function tilt(run: Run, coinc: boolean, step = 10) {
  const nb = Math.ceil(90 / step);
  const counts = new Array(nb).fill(0);
  const time = new Array(nb).fill(0);
  for (let i = 1; i < run.n; i++) {
    const a = run.tilt.data[i];
    if (!Number.isFinite(a)) continue;
    const b = Math.min(nb - 1, Math.floor(a / step));
    time[b] += run.t.data[i] - run.t.data[i - 1];
    if (sel(run, coinc, i)) counts[b]++;
  }
  const rows = counts
    .map((c, b) => ({
      angle: (b + 0.5) * step,
      rate: time[b] > 60 ? c / time[b] : NaN,
      err: time[b] > 60 ? Math.sqrt(c) / time[b] : NaN,
      minutes: time[b] / 60,
    }))
    .filter(r => r.minutes > 1);
  const ref = rows.find(r => Number.isFinite(r.rate));
  const cos2 = rows.map(r => {
    if (!ref) return NaN;
    const rad = (r.angle * Math.PI) / 180;
    const rad0 = (ref.angle * Math.PI) / 180;
    return (ref.rate * Math.cos(rad) ** 2) / Math.cos(rad0) ** 2;
  });
  return { rows, cos2 };
}

export function summary(run: Run) {
  const n = run.n;
  let c = 0, t = 0, p = 0;
  for (let i = 0; i < n; i++) {
    c += run.flag.data[i];
    t += run.temp.data[i];
    p += run.press.data[i];
  }
  const live = run.liveTime;
  return {
    events: n,
    coincident: c,
    duration: run.duration,
    rate: live ? n / live : 0,
    rateErr: live ? Math.sqrt(n) / live : 0,
    coincRate: live ? c / live : 0,
    coincErr: live ? Math.sqrt(c) / live : 0,
    temp: n ? t / n : NaN,
    pressHPa: n ? p / n / 100 : NaN,
  };
}
