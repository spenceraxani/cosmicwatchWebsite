// Builds one Chart.js configuration per GUI plot. Used for the chart on the page
// and, with the light theme, for the pages of the PDF report.
import type { ChartConfiguration, ChartDataset } from 'chart.js';
import type { Run } from './run';
import {
  SERIES,
  binByTime,
  dtDistribution,
  logHistogram,
  median,
  rateDistribution,
  roundPair,
  totals,
  type Binned,
  type Series,
} from './analysis';

export type Tab =
  | 'rate'
  | 'adc'
  | 'sipm'
  | 'pressure'
  | 'temperature'
  | 'accel'
  | 'ratedist'
  | 'dt';

export const TAB_TITLES: Record<Tab, string> = {
  rate: 'Rate',
  adc: 'ADC',
  sipm: 'SiPM',
  pressure: 'Pressure',
  temperature: 'Temperature',
  accel: 'Linear Acceleration',
  ratedist: 'Rate Distribution',
  dt: 'Δt Distribution',
};

/**
 * Whether this run recorded what a tab plots. Sensors switched off in config.txt
 * write -999, which the parser stores as NaN, so their tabs are left out.
 */
export function available(run: Run, tab: Tab): boolean {
  const cols = {
    pressure: [run.press],
    temperature: [run.temp],
    accel: [run.ax, run.ay, run.az],
    sipm: [run.sipm],
  } as Partial<Record<Tab, { data: ArrayLike<number> }[]>>;
  const need = cols[tab];
  if (!need) return true;
  return need.some(c => {
    for (let i = 0; i < run.n; i++) if (Number.isFinite(c.data[i])) return true;
    return false;
  });
}

export interface Theme {
  text: string;
  grid: string;
  series: Record<Series, string>;
  pressure: string;
  temperature: string;
  xyz: [string, string, string];
}

export const theme = (dark: boolean): Theme => ({
  text: dark ? '#d6e0ea' : '#34465a',
  grid: dark ? 'rgba(214,224,234,0.12)' : 'rgba(27,44,61,0.09)',
  // The GUI's teal / amber / red for all, non-coincident and coincident events.
  series: {
    all: '#00a99d',
    non: dark ? '#ffc300' : '#d39e00',
    coinc: '#ff5733',
  },
  pressure: '#3fae6a',
  temperature: '#e07a1f',
  xyz: ['#e4572e', '#17a398', dark ? '#6aa5e8' : '#3b6fb6'],
});

const SERIES_NAME: Record<Series, string> = {
  all: 'All events',
  non: 'Non-coincident',
  coinc: 'Coincident',
};
const SHORT_NAME: Record<Series, string> = {
  all: 'all',
  non: 'non-coincident',
  coinc: 'coincident',
};
const BAND = '​'; // marks error-band datasets so the legend skips them

export interface Built {
  config: ChartConfiguration | null;
  csv: string[][];
  result: string;
}

export interface Options {
  binSec: number;
  adcMin: number;
  adcMax: number;
}

const n5 = (v: number) => String(+Number(v).toPrecision(6));
const alpha = (hex: string, a: string) => hex + a;

function band(
  label: string,
  color: string,
  xs: number[],
  ys: number[],
  errs: number[],
  stepped = false
): ChartDataset<'line'>[] {
  const pt = (k: number, sign: number) => ({
    x: xs[k],
    y: ys[k] + sign * errs[k],
  });
  return [
    {
      label: BAND + label + '+',
      data: xs.map((_, k) => pt(k, 1)),
      borderWidth: 0,
      pointRadius: 0,
      fill: '+1',
      backgroundColor: alpha(color, '30'),
      stepped: stepped ? 'middle' : false,
    },
    {
      label: BAND + label + '-',
      data: xs.map((_, k) => pt(k, -1)),
      borderWidth: 0,
      pointRadius: 0,
      fill: false,
      stepped: stepped ? 'middle' : false,
    },
    {
      label,
      data: xs.map((x, k) => ({ x, y: ys[k] })),
      borderColor: color,
      backgroundColor: color,
      borderWidth: 1.75,
      pointRadius: xs.length < 60 ? 2 : 0,
      stepped: stepped ? 'middle' : false,
      spanGaps: false,
    },
  ];
}

// Log axes: label only 1, 2 and 5 × 10ⁿ, like matplotlib's log ticks.
function logTick(v: number | string) {
  const n = Number(v);
  if (!(n > 0)) return '';
  const m = n / 10 ** Math.floor(Math.log10(n) + 1e-9);
  if (![1, 2, 5].some(k => Math.abs(m - k) < 1e-6)) return '';
  return n >= 1000 || n < 0.001
    ? n.toExponential(0).replace('e+', 'e')
    : String(+n.toPrecision(3));
}

function base(
  th: Theme,
  xTitle: string,
  yTitle: string,
  xLog = false,
  yLog = false
): ChartConfiguration['options'] {
  const tick = (log: boolean) =>
    log
      ? { color: th.text, autoSkip: false, callback: logTick }
      : { color: th.text, maxTicksLimit: 10 };
  return {
    parsing: false,
    normalized: true,
    animation: false,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: th.text,
          boxWidth: 12,
          filter: item => !item.text.startsWith(BAND),
        },
      },
      tooltip: { filter: item => !String(item.dataset.label).startsWith(BAND) },
    },
    scales: {
      x: {
        type: xLog ? 'logarithmic' : 'linear',
        title: { display: true, text: xTitle, color: th.text },
        ticks: tick(xLog),
        grid: { color: th.grid },
      },
      y: {
        type: yLog ? 'logarithmic' : 'linear',
        title: { display: true, text: yTitle, color: th.text },
        ticks: tick(yLog),
        grid: { color: th.grid },
      },
    },
  } as ChartConfiguration['options'];
}

function timeAxis(b: Binned) {
  const days = (b.minutes.at(-1) ?? 0) > 1440;
  return {
    xs: b.minutes.map(m => (days ? m / 1440 : m)),
    title: days ? 'Time [days]' : 'Time [min]',
    unit: days ? 'days' : 'min',
  };
}

export function build(
  tab: Tab,
  run: Run,
  idx: Uint32Array,
  o: Options,
  th: Theme
): Built {
  if (idx.length < 2) return { config: null, csv: [], result: '' };
  const tot = totals(run, idx);
  const rateText = (s: Series) => {
    const [v, e] = roundPair(tot.rate[s], tot.err[s]);
    return `${SERIES_NAME[s]}: ${v} ± ${e} Hz`;
  };
  const b = () => binByTime(run, idx, o.binSec);
  const tooShort = {
    config: null,
    csv: [],
    result: `Not enough data yet for ${o.binSec} s bins. Pick a shorter bin or wait for more events.`,
  };

  if (tab === 'rate') {
    const bn = b();
    if (bn.minutes.length < 1) return tooShort;
    const ax = timeAxis(bn);
    const datasets = SERIES.flatMap(s =>
      band(rateText(s), th.series[s], ax.xs, bn.rate[s], bn.rateErr[s])
    );
    const csv = [
      [
        `time_${ax.unit}`,
        ...SERIES.flatMap(s => [`rate_${s}_hz`, `err_${s}_hz`]),
      ],
      ...ax.xs.map((x, k) =>
        [x, ...SERIES.flatMap(s => [bn.rate[s][k], bn.rateErr[s][k]])].map(n5)
      ),
    ];
    const opts = base(th, ax.title, 'Rate [s⁻¹]') as any;
    opts.scales.y.min = 0;
    return {
      config: {
        type: 'line',
        data: { datasets: datasets as ChartDataset[] },
        options: opts,
      },
      csv,
      result: SERIES.map(rateText).join(' · '),
    };
  }

  if (tab === 'adc' || tab === 'sipm') {
    const h = logHistogram(run, idx, tab, tot.liveTime);
    if (!h)
      return {
        config: null,
        csv: [],
        result:
          tab === 'sipm'
            ? 'This file has no SiPM values.'
            : 'No ADC values in the selected range.',
      };
    const datasets = SERIES.flatMap(s =>
      band(
        rateText(s),
        th.series[s],
        h.centres,
        h.values[s],
        h.errs[s],
        true
      ).map(d => ({
        ...d,
        data: (d.data as { x: number; y: number }[]).map(p => ({
          x: p.x,
          y: p.y > 0 ? p.y : NaN,
        })),
      }))
    );
    const unit = tab === 'adc' ? 'adc' : 'sipm_mv';
    const csv = [
      [
        `${unit}_bin_low`,
        `${unit}_bin_high`,
        ...SERIES.flatMap(s => [`rate_${s}_hz`, `err_${s}_hz`]),
      ],
      ...h.centres.map((_, k) =>
        [
          h.edges[k],
          h.edges[k + 1],
          ...SERIES.flatMap(s => [h.values[s][k], h.errs[s][k]]),
        ].map(n5)
      ),
    ];
    const opts = base(
      th,
      tab === 'adc' ? 'ADC value [0–4095]' : 'SiPM [mV]',
      'Rate/bin [s⁻¹]',
      true,
      true
    ) as any;
    opts.scales.x.min = h.edges[0];
    opts.scales.x.max = h.edges.at(-1);
    const fmt = (v: number) =>
      tab === 'adc' ? String(Math.round(v)) : `${v.toFixed(1)} mV`;
    const med = SERIES.filter(s => s !== 'all')
      .map(s => [s, median(run, idx, tab, s)] as const)
      .filter(([, v]) => Number.isFinite(v))
      .map(([s, v]) => `${SERIES_NAME[s].toLowerCase()} ${fmt(v)}`);
    const result = med.length
      ? `Median ${tab === 'adc' ? 'ADC value' : 'SiPM pulse height'}: ${med.join(', ')}.`
      : '';
    return {
      config: {
        type: 'line',
        data: { datasets: datasets as ChartDataset[] },
        options: opts,
      },
      csv,
      result,
    };
  }

  if (tab === 'pressure' || tab === 'temperature') {
    const bn = b();
    if (bn.minutes.length < 1) return tooShort;
    const ax = timeAxis(bn);
    const cfg = {
      pressure: {
        ys: bn.press,
        err: 500,
        color: th.pressure,
        label: 'Pressure',
        y: 'Pressure [Pa]',
        col: 'pressure_pa',
      },
      temperature: {
        ys: bn.temp,
        err: 0.1,
        color: th.temperature,
        label: 'Temperature',
        y: 'Temperature [°C]',
        col: 'temperature_c',
      },
    }[tab];
    const datasets = band(
      cfg.label,
      cfg.color,
      ax.xs,
      cfg.ys,
      cfg.ys.map(() => cfg.err)
    );
    const csv = [
      [`time_${ax.unit}`, cfg.col],
      ...ax.xs.map((x, k) => [x, cfg.ys[k]].map(n5)),
    ];
    const fin = cfg.ys.filter(Number.isFinite);
    const mean = fin.reduce((a, v) => a + v, 0) / Math.max(1, fin.length);
    const result =
      tab === 'pressure'
        ? `Mean ${(mean / 100).toFixed(1)} hPa, range ${((Math.max(...fin) - Math.min(...fin)) / 100).toFixed(1)} hPa.`
        : `Mean ${mean.toFixed(1)} °C, range ${(Math.max(...fin) - Math.min(...fin)).toFixed(1)} °C.`;
    const opts = base(th, ax.title, cfg.y) as any;
    return {
      config: {
        type: 'line',
        data: { datasets: datasets as ChartDataset[] },
        options: opts,
      },
      csv,
      result,
    };
  }

  if (tab === 'accel') {
    const bn = b();
    if (bn.minutes.length < 1) return tooShort;
    const ax = timeAxis(bn);
    const keys = ['ax', 'ay', 'az'] as const;
    const err = 0.1;
    const name = 'Acceleration';
    const datasets = keys.flatMap((k, j) =>
      band(
        `${name} ${'XYZ'[j]}`,
        th.xyz[j],
        ax.xs,
        bn[k],
        bn[k].map(() => err)
      )
    );
    const csv = [
      [`time_${ax.unit}`, ...keys.map(k => `${k}_g`)],
      ...ax.xs.map((x, i) => [x, ...keys.map(k => bn[k][i])].map(n5)),
    ];
    return {
      config: {
        type: 'line',
        data: { datasets: datasets as ChartDataset[] },
        options: base(th, ax.title, 'Acceleration [g]'),
      },
      csv,
      result: '',
    };
  }

  if (tab === 'ratedist') {
    const bn = b();
    const rd = bn.minutes.length >= 3 ? rateDistribution(bn) : null;
    if (!rd) return tooShort;
    const datasets: ChartDataset<'line'>[] = [];
    const parts: string[] = [];
    const csv: string[][] = [
      ['series', 'rate_low_hz', 'rate_high_hz', 'bins', 'expected'],
    ];
    for (const s of SERIES) {
      const d = rd.series[s];
      if (!d) continue;
      const color = th.series[s];
      datasets.push({
        label: BAND + s,
        data: d.centres.map((x, k) => ({ x, y: d.counts[k] })),
        stepped: 'middle',
        borderWidth: 1,
        borderColor: alpha(color, '99'),
        backgroundColor: alpha(color, '40'),
        fill: 'origin',
        pointRadius: 0,
      });
      const chi = Number.isFinite(d.fit.chi2dof)
        ? d.fit.chi2dof.toPrecision(3)
        : 'n/a';
      datasets.push({
        label: `${SERIES_NAME[s]} (χ²/dof = ${chi})`,
        data: d.fit.x.map((x, k) => ({ x, y: d.fit.y[k] })),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 0,
      });
      parts.push(`${SERIES_NAME[s]} χ²/dof ${chi}`);
      d.centres.forEach((_, k) =>
        csv.push([
          s,
          ...[d.edges[k], d.edges[k + 1], d.counts[k], d.expected[k]].map(n5),
        ])
      );
    }
    const opts = base(th, 'Rate [s⁻¹]', 'Number of time bins') as any;
    opts.scales.x.min = 0;
    opts.scales.y.min = 0;
    return {
      config: {
        type: 'line',
        data: { datasets: datasets as ChartDataset[] },
        options: opts,
      },
      csv,
      result: `Poisson fit to ${bn.minutes.length} bins of ${o.binSec} s. ${parts.join(' · ')}`,
    };
  }

  if (tab === 'dt') {
    const dd = dtDistribution(run, idx);
    if (!dd) return { config: null, csv: [], result: 'Not enough events yet.' };
    const datasets: ChartDataset<'line'>[] = [];
    const parts: string[] = [];
    let peak = 1;
    for (const s of SERIES) {
      const d = dd.series[s];
      if (!d) continue;
      const color = th.series[s];
      peak = Math.max(peak, ...d.counts);
      datasets.push({
        label: BAND + s,
        data: dd.centres.map((x, k) => ({
          x,
          y: d.counts[k] > 0 ? d.counts[k] : NaN,
        })),
        stepped: 'middle',
        borderWidth: 1,
        borderColor: alpha(color, '99'),
        backgroundColor: alpha(color, '40'),
        fill: 'origin',
        pointRadius: 0,
        spanGaps: false,
      });
      datasets.push({
        label: `${SERIES_NAME[s]} (χ²/dof = ${d.fit.chi2dof.toPrecision(3)})`,
        data: d.fit.x.map((x, k) => ({ x, y: d.fit.y[k] })),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 0,
      });
      parts.push(
        `${d.mean < 1 ? (d.mean * 1000).toFixed(0) + ' ms' : d.mean.toFixed(2) + ' s'} (${SHORT_NAME[s]})`
      );
    }
    const csv = [
      [
        'dt_bin_low_s',
        'dt_bin_high_s',
        ...SERIES.filter(s => dd.series[s]).map(s => `counts_${s}`),
      ],
      ...dd.centres.map((_, k) =>
        [
          dd.edges[k],
          dd.edges[k + 1],
          ...SERIES.filter(s => dd.series[s]).map(s => dd.series[s]!.counts[k]),
        ].map(n5)
      ),
    ];
    const opts = base(th, 'Δt [s]', 'Counts', true, true) as any;
    opts.scales.x.min = dd.tMin;
    opts.scales.x.max = dd.tMax * 1.3;
    opts.scales.y.min = 0.5;
    opts.scales.y.max = peak * 3;
    return {
      config: {
        type: 'line',
        data: { datasets: datasets as ChartDataset[] },
        options: opts,
      },
      csv,
      result: `Exponential fit. Mean time between events: ${parts.join(', ')}.`,
    };
  }

  return { config: null, csv: [], result: '' };
}
