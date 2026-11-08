import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  LogarithmicScale,
  PointElement,
  ScatterController,
  Tooltip,
  type ChartConfiguration,
  type ChartDataset,
} from 'chart.js';
import { Run, parseStream, streamFromBlob } from './run';
import { binByTime, correlate, intervals, spectrum, summary, tilt } from './analysis';
import { loadConfig, saveConfig, send, body, type Report, type WebhookConfig, type WebhookFormat } from './webhook';

Chart.register(BarController, BarElement, CategoryScale, Filler, Legend, LinearScale, LineController, LineElement, LogarithmicScale, PointElement, ScatterController, Tooltip);

type Tab = 'rate' | 'spectrum' | 'pressure' | 'temperature' | 'intervals' | 'tilt';

const BLUE = '#2a618f';
const SKY = '#53a1d8';

export function initMeasure() {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const run = new Run();
  let tab: Tab = 'rate';
  let chart: Chart | null = null;
  let csv: string[][] = [];
  let live = false;
  let rawLines: string[] = [];

  // Status
  const status = (text: string, state: 'idle' | 'busy' | 'live' | 'ok' | 'error' = 'ok') => {
    $('m-status').textContent = text;
    const led = $('m-led');
    led.className = 'size-2.5 rounded-full ' + {
      idle: 'bg-neutral-300 dark:bg-neutral-600',
      busy: 'bg-yellow-400 animate-pulse',
      live: 'bg-yellow-400',
      ok: 'bg-orange-400 dark:bg-yellow-400',
      error: 'bg-red-600',
    }[state];
  };
  const fmtDur = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h ? `${h} h ${m} min` : m ? `${m} min ${sec} s` : `${sec} s`;
  };
  const pm = (v: number, e: number, unit: string) => `${v.toFixed(v < 1 ? 3 : 2)} ± ${e.toFixed(e < 0.01 ? 4 : 3)} ${unit}`;

  function showSummary() {
    const s = summary(run);
    $('s-duration').textContent = run.n ? fmtDur(s.duration) : '–';
    $('s-events').textContent = run.n ? s.events.toLocaleString('en-US') : '–';
    $('s-rate').textContent = run.n > 1 ? `${s.rate.toFixed(2)} Hz` : '–';
    $('s-coinc').textContent = run.n > 1 ? `${s.coincRate.toFixed(3)} Hz` : '–';
    $('s-temp').textContent = Number.isFinite(s.temp) ? `${s.temp.toFixed(1)} °C` : '–';
    $('s-press').textContent = Number.isFinite(s.pressHPa) ? `${s.pressHPa.toFixed(1)} hPa` : '–';
  }

  // Chart
  const dark = () => document.documentElement.classList.contains('dark');
  const theme = () => ({
    text: dark() ? '#d6e0ea' : '#34465a',
    grid: dark() ? 'rgba(214,224,234,0.12)' : 'rgba(27,44,61,0.08)',
    main: dark() ? SKY : BLUE,
    second: dark() ? '#bcdcf3' : SKY,
  });
  Chart.defaults.font.family = "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, sans-serif";

  function draw(config: ChartConfiguration) {
    const th = theme();
    type Scale = { ticks?: object; grid?: object; title?: object };
    type Opts = { scales?: Record<string, Scale>; plugins?: object; maintainAspectRatio?: boolean; animation?: boolean };
    const opts = (config.options ??= {}) as Opts;
    const scales = opts.scales ?? {};
    for (const k of Object.keys(scales)) {
      scales[k].ticks = { color: th.text, ...(scales[k].ticks ?? {}) };
      scales[k].grid = { color: th.grid, ...(scales[k].grid ?? {}) };
      if (scales[k].title) scales[k].title = { display: true, color: th.text, ...scales[k].title };
    }
    opts.plugins = {
      legend: { labels: { color: th.text, boxWidth: 12 } },
      tooltip: { intersect: false, mode: 'nearest' },
      ...(opts.plugins ?? {}),
    };
    opts.maintainAspectRatio = false;
    opts.animation = false;
    chart?.destroy();
    chart = new Chart($<HTMLCanvasElement>('m-chart'), config);
  }

  function autoBin() {
    const d = run.duration;
    if (d < 20 * 60) return 10;
    if (d < 3 * 3600) return 60;
    if (d < 24 * 3600) return 600;
    return 3600;
  }

  function render() {
    const empty = run.n < 2;
    $('m-empty').hidden = !empty;
    $<HTMLButtonElement>('m-csv').disabled = empty;
    $<HTMLButtonElement>('m-copy').disabled = empty;
    if (empty) {
      chart?.destroy();
      chart = null;
      $('m-result').textContent = '';
      return;
    }
    const coinc = (document.querySelector('input[name="m-sel"]:checked') as HTMLInputElement).value === 'coinc';
    const binSel = $<HTMLSelectElement>('m-bin').value;
    const binSec = binSel === 'auto' ? autoBin() : Number(binSel);
    const th = theme();
    const which = coinc ? 'Coincident' : 'All';
    let result = '';

    if (tab === 'rate') {
      const b = binByTime(run, binSec, coinc, live);
      csv = [['hours', 'rate_hz', 'error_hz', 'counts', 'temp_c', 'pressure_hpa'], ...b.x.map((x, i) => [x, b.rate[i], b.err[i], b.counts[i], b.temp[i], b.press[i]].map(v => String(+Number(v).toFixed(5))))];
      draw({
        type: 'line',
        data: {
          datasets: [
            { label: '+1σ', data: b.x.map((x, i) => ({ x, y: b.rate[i] + b.err[i] })), borderWidth: 0, pointRadius: 0, fill: '+1', backgroundColor: th.main + '22' },
            { label: '−1σ', data: b.x.map((x, i) => ({ x, y: b.rate[i] - b.err[i] })), borderWidth: 0, pointRadius: 0, fill: false },
            { label: `${which} events`, data: b.x.map((x, i) => ({ x, y: b.rate[i] })), borderColor: th.main, borderWidth: 2, pointRadius: b.x.length < 80 ? 2 : 0, tension: 0 },
          ],
        },
        options: {
          parsing: false,
          plugins: { legend: { labels: { filter: (i: any) => !i.text.includes('σ'), color: th.text } } },
          scales: {
            x: { type: 'linear', title: { text: `Hours since start (bins of ${binSec >= 3600 ? binSec / 3600 + ' h' : binSec >= 60 ? binSec / 60 + ' min' : binSec + ' s'})` } },
            y: { title: { text: 'Rate (events per second)' } },
          },
        },
      } as ChartConfiguration);
      const s = summary(run);
      result = coinc ? `Coincident rate: ${pm(s.coincRate, s.coincErr, 'Hz')}` : `Average rate: ${pm(s.rate, s.rateErr, 'Hz')}`;
    }

    if (tab === 'spectrum') {
      const full = spectrum(run);
      let last = full.all.length - 1;
      while (last > 8 && full.all[last] === 0) last--;
      const sp = { ...full, centres: full.centres.slice(0, last + 2), all: full.all.slice(0, last + 2), coinc: full.coinc.slice(0, last + 2) };
      const log = $<HTMLInputElement>('m-log').checked;
      csv = [['adc_bin_centre', 'all_events', 'coincident_events'], ...sp.centres.map((c, i) => [c, sp.all[i], sp.coinc[i]].map(String))];
      const datasets: any[] = [];
      if (!coinc) datasets.push({ label: 'All events', data: sp.all, backgroundColor: th.second, borderWidth: 0, barPercentage: 1, categoryPercentage: 1 });
      datasets.push({ label: 'Coincident events', data: sp.coinc, backgroundColor: th.main, borderWidth: 0, barPercentage: 1, categoryPercentage: 1 });
      draw({
        type: 'bar',
        data: { labels: sp.centres, datasets },
        options: {
          scales: {
            x: { stacked: false, title: { text: 'Pulse height (ADC counts, 0 to 4095)' }, ticks: { maxTicksLimit: 9 } },
            y: { type: log ? 'logarithmic' : 'linear', title: { text: 'Events per bin' } },
          },
        },
      } as ChartConfiguration);
      const total = sp.all.reduce((a, b) => a + b, 0);
      const c = sp.coinc.reduce((a, b) => a + b, 0);
      result = `${(100 * c / Math.max(1, total)).toFixed(1)}% of events were coincident.`;
    }

    if (tab === 'pressure' || tab === 'temperature') {
      const key = tab === 'pressure' ? 'press' : 'temp';
      const b = binByTime(run, Math.max(binSec, 600), coinc);
      const r = correlate(b, key);
      const unit = key === 'press' ? 'hPa' : '°C';
      csv = [[key === 'press' ? 'pressure_hpa' : 'temp_c', 'rate_hz', 'error_hz'], ...r.points.map((p, i) => [p.x, p.y, b.err[i]].map(v => String(+Number(v).toFixed(5))))];
      const xs = r.points.map(p => p.x);
      const lo = Math.min(...xs), hi = Math.max(...xs);
      const fitLine = r.fit ? [{ x: lo, y: r.fit.a + r.fit.b * lo }, { x: hi, y: r.fit.a + r.fit.b * hi }] : [];
      draw({
        type: 'scatter',
        data: {
          datasets: [
            { label: `${which} events, one point per ${Math.max(binSec, 600) >= 3600 ? 'hour' : '10 minutes'}`, data: r.points, backgroundColor: th.main, pointRadius: 3 },
            { type: 'line', label: 'Straight-line fit', data: fitLine, borderColor: th.text, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 },
          ],
        },
        options: {
          scales: {
            x: { type: 'linear', title: { text: key === 'press' ? 'Air pressure (hPa)' : 'Temperature in the case (°C)' } },
            y: { title: { text: 'Rate (events per second)' } },
          },
        },
      } as ChartConfiguration);
      const range = hi - lo;
      const narrow = key === 'press' ? range < 4 : range < 2;
      result = r.fit && r.points.length > 2
        ? `Slope: ${r.percentPerUnit.toFixed(3)} ± ${r.percentErr.toFixed(3)} % per ${unit}, from ${r.points.length} points.` +
          (narrow ? ` The ${key === 'press' ? 'pressure' : 'temperature'} only changed by ${range.toFixed(1)} ${unit} in this run, so the slope is mostly noise. Runs of a few days through a weather change work best.` : '')
        : 'Needs a longer run: at least three 10-minute bins with different readings.';
    }

    if (tab === 'intervals') {
      const iv = intervals(run, coinc);
      if (!iv) {
        result = 'Not enough events yet.';
      } else {
        const unit = iv.mean < 1 ? 'ms' : 's';
        const k = unit === 'ms' ? 1000 : 1;
        csv = [[`interval_${unit}`, 'observed', 'expected_exponential'], ...iv.centres.map((c, i) => [c * k, iv.hist[i], iv.expected[i]].map(v => String(+Number(v).toFixed(4))))];
        draw({
          type: 'bar',
          data: {
            labels: iv.centres.map(c => (c * k).toFixed(unit === 'ms' ? 0 : 1)),
            datasets: [
              { type: 'line', label: 'Expected if arrivals are random', data: iv.expected, borderColor: th.text, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 } as unknown as ChartDataset<'bar'>,
              { label: `${which} events`, data: iv.hist, backgroundColor: th.main, borderWidth: 0, barPercentage: 1, categoryPercentage: 1 },
            ],
          },
          options: {
            scales: {
              x: { title: { text: `Time since the previous event (${unit})` }, ticks: { maxTicksLimit: 10 } },
              y: { type: 'logarithmic', title: { text: 'Number of gaps' } },
            },
          },
        } as ChartConfiguration);
        result = `Mean gap ${(iv.mean * k).toFixed(unit === 'ms' ? 0 : 2)} ${unit} over ${iv.n.toLocaleString('en-US')} gaps.`;
      }
    }

    if (tab === 'tilt') {
      const step = Number($<HTMLSelectElement>('m-step').value);
      const tl = tilt(run, coinc, step);
      csv = [['angle_deg', 'rate_hz', 'error_hz', 'minutes_at_angle', 'cos2_reference_hz'], ...tl.rows.map((r, i) => [r.angle, r.rate, r.err, r.minutes, tl.cos2[i]].map(v => String(+Number(v).toFixed(5))))];
      draw({
        type: 'scatter',
        data: {
          datasets: [
            { label: `${which} events`, data: tl.rows.map(r => ({ x: r.angle, y: r.rate })), backgroundColor: th.main, pointRadius: 4 },
            { type: 'line', label: 'cos²θ, scaled to the first point', data: tl.rows.map((r, i) => ({ x: r.angle, y: tl.cos2[i] })), borderColor: th.text, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 },
          ],
        },
        options: {
          scales: {
            x: { type: 'linear', min: 0, max: 90, title: { text: 'Tilt from vertical (degrees)' } },
            y: { min: 0, title: { text: 'Rate (events per second)' } },
          },
        },
      } as ChartConfiguration);
      result = tl.rows.length > 1
        ? `Data at ${tl.rows.length} angles. Spend at least an hour at each angle for clear coincident results.`
        : 'This run stayed at one angle. Tip the detector during a run (or record several runs) to measure the angular dependence.';
    }

    $('m-result').textContent = result;
  }

  // Tabs and controls
  const ctlFor: Record<Tab, string[]> = { rate: ['bin'], spectrum: ['log'], pressure: ['bin'], temperature: ['bin'], intervals: [], tilt: ['step'] };
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => {
    b.addEventListener('click', () => {
      tab = b.dataset.tab as Tab;
      document.querySelectorAll('[data-tab]').forEach(o => o.setAttribute('aria-selected', String(o === b)));
      $('m-panel').setAttribute('aria-labelledby', b.id);
      document.querySelectorAll<HTMLElement>('[data-blurb]').forEach(el => (el.hidden = el.dataset.blurb !== tab));
      document.querySelectorAll<HTMLElement>('[data-ctl]').forEach(el => (el.hidden = !ctlFor[tab].includes(el.dataset.ctl!)));
      render();
    });
  });
  ['m-bin', 'm-log', 'm-step'].forEach(id => $(id).addEventListener('change', render));
  document.querySelectorAll('input[name="m-sel"]').forEach(r => r.addEventListener('change', render));
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // CSV
  const csvText = () => csv.map(r => r.join(',')).join('\n') + '\n';
  $('m-csv').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csvText()], { type: 'text/csv' }));
    a.download = `${run.name || 'cosmicwatch'}-${tab}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('m-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(csvText());
      $('m-result').textContent = 'CSV copied. Paste it into a spreadsheet.';
    } catch {
      $('m-result').textContent = 'Copying is blocked here. Use Download CSV instead.';
    }
  });

  // Files and the sample
  async function loadBlob(blob: Blob, label: string) {
    if (live) await disconnect();
    run.clear();
    rawLines = [];
    status(`Reading ${label}…`, 'busy');
    const prog = $<HTMLProgressElement>('m-progress');
    prog.classList.remove('hidden');
    prog.value = 0;
    try {
      const stream = await streamFromBlob(blob);
      await parseStream(stream, run, bytes => (prog.value = Math.min(1, bytes / Math.max(1, blob.size * (label.endsWith('.gz') ? 4 : 1)))));
      if (run.n === 0) {
        status(`${label} has no CosmicWatch event lines. Is it a detector data file?`, 'error');
      } else {
        const skipped = run.skipped ? ` ${run.skipped} lines were not events and were skipped.` : '';
        status(`${run.name || label}: ${run.n.toLocaleString('en-US')} events over ${fmtDur(run.duration)}.${skipped}`, 'ok');
      }
    } catch (e) {
      status(`Could not read ${label}: ${(e as Error).message}`, 'error');
    } finally {
      prog.classList.add('hidden');
      showSummary();
      render();
    }
  }

  $<HTMLInputElement>('m-file').addEventListener('change', e => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) loadBlob(f, f.name);
  });
  const drop = $('m-drop');
  drop.addEventListener('dragover', e => {
    e.preventDefault();
    drop.classList.add('ring-2');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('ring-2'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('ring-2');
    const f = e.dataTransfer?.files?.[0];
    if (f) loadBlob(f, f.name);
  });

  async function loadSample() {
    const url = $<HTMLAnchorElement>('m-sample-file').href;
    status('Downloading the sample run…', 'busy');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      await loadBlob(await res.blob(), 'axlab-sample-12h.txt.gz');
    } catch (e) {
      status(`The sample did not download (${(e as Error).message}). Try the download link and open the file instead.`, 'error');
    }
  }
  $('m-sample').addEventListener('click', loadSample);
  if (location.hash === '#sample') loadSample();

  // Live detector over USB
  type Port = { open(o: { baudRate: number }): Promise<void>; close(): Promise<void>; readable: ReadableStream<Uint8Array> | null };
  const serial = (navigator as Navigator & { serial?: { requestPort(): Promise<Port> } }).serial;
  let port: Port | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let tick: number | undefined;

  if (!serial) {
    $('m-noserial').classList.remove('hidden');
    $<HTMLButtonElement>('m-connect').disabled = true;
  }

  const raw = $('m-raw');
  let rawFresh = true;
  function onLine(line: string) {
    rawLines.push(line);
    if (rawFresh) {
      raw.textContent = '';
      rawFresh = false;
    }
    raw.textContent = (raw.textContent + line + '\n').slice(-8000);
    raw.scrollTop = raw.scrollHeight;
    if (run.addLine(line)) {
      const led = $('m-led');
      led.animate([{ backgroundColor: SKY }, { backgroundColor: '#f2e05a' }], { duration: 250 });
    }
  }

  $('m-connect').addEventListener('click', async () => {
    if (!serial) return;
    try {
      port = await serial.requestPort();
      await port.open({ baudRate: 115200 });
    } catch (e) {
      status(`Not connected: ${(e as Error).message}`, 'error');
      return;
    }
    run.clear();
    rawLines = [];
    live = true;
    $('m-connect').hidden = true;
    $('m-disconnect').hidden = false;
    $('m-save').hidden = false;
    status('Connected. Waiting for the first event…', 'live');
    tick = window.setInterval(() => {
      if (run.n) status(`Live: ${run.n.toLocaleString('en-US')} events in ${fmtDur(run.duration)}.`, 'live');
      showSummary();
      render();
      webhookTick();
    }, 1000);
    const decoder = new TextDecoder();
    let rest = '';
    reader = port.readable!.getReader();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = rest + decoder.decode(value, { stream: true });
        const lines = text.split(/\r?\n/);
        rest = lines.pop() ?? '';
        lines.forEach(onLine);
      }
    } catch (e) {
      status(`Connection lost: ${(e as Error).message}`, 'error');
    } finally {
      await disconnect();
    }
  });

  async function disconnect() {
    if (!live) return;
    live = false;
    window.clearInterval(tick);
    try {
      await reader?.cancel();
      reader?.releaseLock();
      await port?.close();
    } catch {
      /* already closed */
    }
    reader = null;
    port = null;
    $('m-connect').hidden = false;
    $('m-disconnect').hidden = true;
    status(run.n ? `Disconnected after ${run.n.toLocaleString('en-US')} events. The data stays here until you load something else.` : 'Disconnected.', 'ok');
    showSummary();
    render();
  }
  $('m-disconnect').addEventListener('click', disconnect);

  $('m-save').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rawLines.join('\n') + '\n'], { type: 'text/plain' }));
    a.download = `${run.name || 'CosmicWatch'}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // Webhooks
  const cfg: WebhookConfig = loadConfig();
  const urlIn = $<HTMLInputElement>('wh-url');
  const fmtIn = $<HTMLSelectElement>('wh-format');
  const everyIn = $<HTMLSelectElement>('wh-every');
  const toggle = $('wh-toggle');
  urlIn.value = cfg.url;
  fmtIn.value = cfg.format;
  everyIn.value = String(cfg.everySec);
  let lastSentAt = 0; // detector time of the last report
  let lastSentIndex = 0;
  let lastWall = 0;

  function report(): Report {
    const end = run.n;
    const startIdx = Math.min(lastSentIndex, end);
    const from = startIdx > 0 ? lastSentAt : end ? run.t.data[0] : 0;
    const t1 = end ? run.t.data[end - 1] : 0;
    let c = 0;
    for (let i = startIdx; i < end; i++) c += run.flag.data[i];
    const window = Math.max(1e-6, t1 - from);
    const s = summary(run);
    const n = end - startIdx;
    return {
      detector: run.name || 'CosmicWatch',
      sent_at: new Date().toISOString(),
      window_seconds: +window.toFixed(1),
      events: n,
      coincident: c,
      rate_hz: +(n / window).toFixed(4),
      coincident_rate_hz: +(c / window).toFixed(4),
      temperature_c: end ? +run.temp.data[end - 1].toFixed(2) : null,
      pressure_hpa: end ? +(run.press.data[end - 1] / 100).toFixed(2) : null,
      run_events: s.events,
      run_seconds: +s.duration.toFixed(1),
    };
  }
  function preview() {
    $('wh-preview').textContent = JSON.stringify(JSON.parse(body(fmtIn.value as WebhookFormat, report())), null, 2);
  }
  function persist() {
    cfg.url = urlIn.value.trim();
    cfg.format = fmtIn.value as WebhookConfig['format'];
    cfg.everySec = Number(everyIn.value);
    saveConfig(cfg);
    preview();
  }
  [urlIn, fmtIn, everyIn].forEach(el => el.addEventListener('change', persist));
  preview();

  const log = (text: string, ok = true) => {
    const li = document.createElement('li');
    li.textContent = `${new Date().toLocaleTimeString()}  ${text}`;
    if (!ok) li.className = 'text-red-700 dark:text-red-400';
    const ol = $('wh-log');
    ol.prepend(li);
    while (ol.children.length > 8) ol.lastChild?.remove();
  };

  async function sendNow() {
    persist();
    if (!cfg.url) {
      log('Add a webhook URL first.', false);
      return;
    }
    if (!run.n) {
      log('No data yet. Connect a detector or load a file first.', false);
      return;
    }
    const r = report();
    try {
      log(await send(cfg, r));
      lastSentIndex = run.n;
      lastSentAt = run.t.data[run.n - 1];
      lastWall = Date.now();
    } catch (e) {
      log((e as Error).message, false);
    }
  }
  $('wh-test').addEventListener('click', sendNow);
  toggle.addEventListener('click', () => {
    persist();
    const on = toggle.getAttribute('aria-pressed') !== 'true';
    if (on && !cfg.url) {
      log('Add a webhook URL first.', false);
      return;
    }
    toggle.setAttribute('aria-pressed', String(on));
    cfg.enabled = on;
    lastWall = Date.now();
    lastSentIndex = run.n;
    lastSentAt = run.n ? run.t.data[run.n - 1] : 0;
    log(on ? `Will send every ${everyIn.selectedOptions[0].text} while a detector is connected.` : 'Stopped sending.');
  });
  function webhookTick() {
    preview();
    if (!cfg.enabled || !live) return;
    if (Date.now() - lastWall >= cfg.everySec * 1000) sendNow();
  }

  status('No data yet.', 'idle');
  showSummary();
  render();
}
