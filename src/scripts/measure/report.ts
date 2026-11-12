// PDF report: a run summary followed by every plot, two per page.
// jsPDF is loaded only when someone asks for a report.
import { Chart } from 'chart.js';
import type { Run } from './run';
import { roundPair, totals } from './analysis';
import { TAB_TITLES, build, theme, type Options, type Tab } from './charts';

const PLOTS: Tab[] = ['rate', 'adc', 'sipm', 'pressure', 'temperature', 'accel', 'gyro', 'deadtime', 'ratedist', 'dt', 'corr'];

// The built-in PDF font is Latin-1 only (± ° ² · are fine), so spell out the rest.
const safe = (t: string) =>
  t.replace(/χ²/g, 'chi²').replace(/Δt/g, 'delta-t').replace(/Δ/g, 'delta ').replace(/√N/g, 'sqrt(N)').replace(/s⁻¹/g, '1/s').replace(/[–—]/g, '-');

const whiteBackground = {
  id: 'whiteBackground',
  beforeDraw(chart: Chart) {
    const { ctx, width, height } = chart;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  },
};

/** Draw one plot off screen (white background) and return it as a JPEG data URL. */
function renderPlot(tab: Tab, run: Run, idx: Uint32Array, o: Options): { png: string | null; result: string } {
  const built = build(tab, run, idx, o, theme(false));
  if (!built.config) return { png: null, result: built.result };
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:460px;';
  const canvas = document.createElement('canvas');
  holder.appendChild(canvas);
  document.body.appendChild(holder);
  const cfg = built.config;
  cfg.options = { ...(cfg.options ?? {}), responsive: false, devicePixelRatio: 2, animation: false } as typeof cfg.options;
  cfg.plugins = [whiteBackground];
  canvas.width = 900;
  canvas.height = 460;
  const chart = new Chart(canvas, cfg);
  const png = chart.toBase64Image('image/jpeg', 0.9);
  chart.destroy();
  holder.remove();
  return { png, result: built.result };
}

export async function downloadReport(run: Run, idx: Uint32Array, o: Options, fileLabel: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const tot = totals(run, idx);
  const rate = (s: 'all' | 'non' | 'coinc') => roundPair(tot.rate[s], tot.err[s]).join(' ± ') + ' Hz';
  const hms = (s: number) => `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min ${Math.floor(s % 60)} s`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CosmicWatch measurement report', M, M + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(`Made ${new Date().toLocaleString()} on the CosmicWatch Measure page`, M, M + 24);
  doc.setTextColor(20);

  const rows: [string, string][] = [
    ['Detector / file', `${run.name || 'Unnamed detector'} (${fileLabel})`],
    ['Events', `${tot.events.toLocaleString('en-US')} (${tot.coincident.toLocaleString('en-US')} coincident)`],
    ['Run length', hms(tot.duration)],
    ['Live time', hms(tot.liveTime)],
    ['Rate, all events', rate('all')],
    ['Rate, non-coincident', rate('non')],
    ['Rate, coincident', rate('coinc')],
    ['Mean temperature', Number.isFinite(tot.temp) ? `${tot.temp.toFixed(2)} °C` : 'n/a'],
    ['Mean pressure', Number.isFinite(tot.press) ? `${(tot.press / 100).toFixed(2)} hPa` : 'n/a'],
    ['Time bin', `${o.binSec} s`],
    ['ADC window', `${o.adcMin} to ${o.adcMax}`],
  ];
  let y = M + 52;
  doc.setFontSize(11);
  for (const [k, v] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(safe(k), M, y);
    doc.setFont('helvetica', 'normal');
    doc.text(safe(v), M + 150, y);
    y += 17;
  }
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(doc.splitTextToSize(safe('Rates divide by live time (run length minus the deadtime the detector reports). Errors are Poisson (√N). The calculations follow the CosmicWatch GUI in the v3X GitHub repository.'), W - 2 * M), M, y + 6);
  doc.setTextColor(20);

  // Plots, two per page, starting on page 2.
  const plotW = W - 2 * M;
  const plotH = plotW * (460 / 900);
  let slot = 2; // force a new page for the first plot
  for (const tab of PLOTS) {
    const { png, result } = renderPlot(tab, run, idx, o);
    if (!png) continue;
    if (slot === 2) {
      doc.addPage();
      slot = 0;
    }
    const top = M + slot * ((H - 2 * M) / 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(safe(TAB_TITLES[tab]), M, top + 4);
    doc.addImage(png, 'JPEG', M, top + 12, plotW, plotH, undefined, 'FAST');
    if (result) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(70);
      doc.text(doc.splitTextToSize(safe(result), plotW), M, top + plotH + 26);
      doc.setTextColor(20);
    }
    slot++;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`${run.name || 'cosmicwatch'}-report-${stamp}.pdf`);
}
