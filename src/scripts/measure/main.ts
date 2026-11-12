import {
  Chart,
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
} from 'chart.js';
import { Run, parseStream, streamFromBlob } from './run';
import { autoBin, roundPair, select, totals } from './analysis';
import { build, theme, type CorrVar, type Tab } from './charts';
import { loadConfig, saveConfig, send, body, type Report, type WebhookConfig, type WebhookFormat } from './webhook';

Chart.register(CategoryScale, Filler, Legend, LinearScale, LineController, LineElement, LogarithmicScale, PointElement, ScatterController, Tooltip);

const SKY = '#53a1d8';

export function initMeasure() {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const run = new Run();
  let tab: Tab = 'rate';
  let chart: Chart | null = null;
  let csv: string[][] = [];
  let live = false;
  let rawLines: string[] = [];
  let fileLabel = '';

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

  // Controls, as in the GUI: bin time, ADC window, and the correlation pair.
  const binSel = $<HTMLSelectElement>('m-bin');
  const binCustom = $<HTMLInputElement>('m-bin-custom');
  const adcMinIn = $<HTMLInputElement>('m-adc-min');
  const adcMaxIn = $<HTMLInputElement>('m-adc-max');
  const corrXIn = $<HTMLSelectElement>('m-corr-x');
  const corrYIn = $<HTMLSelectElement>('m-corr-y');
  const clampAdc = (v: string, d: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(4095, Math.max(0, n)) : d;
  };
  function options() {
    let adcMin = clampAdc(adcMinIn.value, 0);
    let adcMax = clampAdc(adcMaxIn.value, 4095);
    if (adcMin > adcMax) [adcMin, adcMax] = [adcMax, adcMin];
    let binSec: number;
    if (binSel.value === 'auto') binSec = autoBin(run.duration);
    else if (binSel.value === 'custom') binSec = Math.max(1, Math.round(Number(binCustom.value) || 60));
    else binSec = Number(binSel.value);
    return { binSec, adcMin, adcMax, corrX: corrXIn.value as CorrVar, corrY: corrYIn.value as CorrVar };
  }
  const events = () => {
    const o = options();
    return select(run, o.adcMin, o.adcMax);
  };

  function showSummary() {
    const idx = events();
    const s = totals(run, idx);
    const ok = idx.length > 1;
    const hz = (k: 'all' | 'coinc') => roundPair(s.rate[k], s.err[k]).join(' ± ') + ' Hz';
    $('s-duration').textContent = idx.length ? fmtDur(s.duration) : '–';
    $('s-events').textContent = idx.length ? s.events.toLocaleString('en-US') : '–';
    $('s-rate').textContent = ok ? hz('all') : '–';
    $('s-coinc').textContent = ok ? hz('coinc') : '–';
    $('s-temp').textContent = Number.isFinite(s.temp) ? `${s.temp.toFixed(1)} °C` : '–';
    $('s-press').textContent = Number.isFinite(s.press) ? `${(s.press / 100).toFixed(1)} hPa` : '–';
    const auto = binSel.querySelector('option[value="auto"]');
    if (auto) auto.textContent = run.n > 1 ? `Automatic (${autoBin(run.duration)} s)` : 'Automatic';
  }

  // Chart
  const dark = () => document.documentElement.classList.contains('dark');
  Chart.defaults.font.family = "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, sans-serif";

  function render() {
    const idx = events();
    const empty = idx.length < 2;
    $('m-empty').hidden = !empty;
    for (const id of ['m-csv', 'm-copy', 'm-pdf']) $<HTMLButtonElement>(id).disabled = empty;
    if (empty) {
      chart?.destroy();
      chart = null;
      csv = [];
      $('m-result').textContent = run.n > 1 ? 'No events inside this ADC window.' : '';
      return;
    }
    const built = build(tab, run, idx, options(), theme(dark()));
    csv = built.csv;
    $('m-result').textContent = built.result;
    chart?.destroy();
    chart = built.config ? new Chart($<HTMLCanvasElement>('m-chart'), built.config) : null;
  }

  // Tabs and controls
  const ctlFor: Record<Tab, string[]> = {
    rate: ['bin'], adc: [], sipm: [], pressure: ['bin'], temperature: ['bin'], accel: ['bin'], gyro: ['bin'],
    deadtime: ['bin'], ratedist: ['bin'], dt: [], corr: ['bin', 'corr'],
  };
  function showControls() {
    document.querySelectorAll<HTMLElement>('[data-ctl]').forEach(el => (el.hidden = !ctlFor[tab].includes(el.dataset.ctl!)));
    $('m-bin-custom-wrap').hidden = !ctlFor[tab].includes('bin') || binSel.value !== 'custom';
  }
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => {
    b.addEventListener('click', () => {
      tab = b.dataset.tab as Tab;
      document.querySelectorAll('[data-tab]').forEach(o => o.setAttribute('aria-selected', String(o === b)));
      $('m-panel').setAttribute('aria-labelledby', b.id);
      document.querySelectorAll<HTMLElement>('[data-blurb]').forEach(el => (el.hidden = el.dataset.blurb !== tab));
      showControls();
      render();
    });
  });
  binSel.addEventListener('change', () => {
    showControls();
    render();
  });
  [binCustom, corrXIn, corrYIn].forEach(el => el.addEventListener('change', render));
  [adcMinIn, adcMaxIn].forEach(el =>
    el.addEventListener('change', () => {
      showSummary();
      render();
    })
  );
  $('m-adc-reset').addEventListener('click', () => {
    adcMinIn.value = '0';
    adcMaxIn.value = '4095';
    showSummary();
    render();
  });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  showControls();

  // Exports
  const csvText = () => csv.map(r => r.join(',')).join('\n') + '\n';
  const download = (blob: Blob, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('m-csv').addEventListener('click', () => download(new Blob([csvText()], { type: 'text/csv' }), `${run.name || 'cosmicwatch'}-${tab}.csv`));
  $('m-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(csvText());
      $('m-result').textContent = 'CSV copied. Paste it into a spreadsheet.';
    } catch {
      $('m-result').textContent = 'Copying is blocked here. Use Download CSV instead.';
    }
  });
  $('m-pdf').addEventListener('click', async () => {
    const btn = $<HTMLButtonElement>('m-pdf');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Making PDF…';
    try {
      const { downloadReport } = await import('./report');
      await downloadReport(run, events(), options(), fileLabel || (live ? 'live from USB' : 'data file'));
    } catch (e) {
      $('m-result').textContent = `The PDF could not be made: ${(e as Error).message}`;
    } finally {
      btn.textContent = label;
      btn.disabled = run.n < 2;
    }
  });

  // Files and the sample
  async function loadBlob(blob: Blob, label: string) {
    if (live) await disconnect();
    run.clear();
    rawLines = [];
    fileLabel = label;
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
    fileLabel = 'live from USB';
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
    const s = totals(run, select(run));
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
