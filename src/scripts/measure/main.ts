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
  Tooltip,
} from 'chart.js';
import { Run, parseStream, streamFromBlob } from './run';
import { autoBin, roundPair, select, totals } from './analysis';
import { available, build, theme, type Tab } from './charts';

Chart.register(
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  LogarithmicScale,
  PointElement,
  Tooltip
);

// The connect button doubles as the connection light: blue before connecting,
// green while connected, red once the connection has ended.
const CONNECT = {
  idle: { text: 'Connect detector', cls: 'bg-[#2a618f] hover:bg-[#22527a]' },
  live: {
    text: 'Connected · Disconnect',
    cls: 'bg-green-600 hover:bg-green-700',
  },
  ended: {
    text: 'Disconnected · Reconnect',
    cls: 'bg-red-600 hover:bg-red-700',
  },
};
const CONNECT_BASE =
  'inline-flex items-center justify-center gap-x-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-bold text-white ring-zinc-500 outline-hidden transition duration-300 focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 dark:ring-zinc-200';

export function initMeasure() {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const run = new Run();
  let tab: Tab = 'rate';
  let chart: Chart | null = null;
  let csv: string[][] = [];
  let live = false;
  let rawLines: string[] = [];
  let fileLabel = '';

  // Status
  const status = (
    text: string,
    state: 'idle' | 'busy' | 'live' | 'ok' | 'error' = 'ok'
  ) => {
    const el = $('m-status');
    el.textContent = text;
    // The status row only shows once there is something to say.
    $('m-status-row').hidden = !text;
    el.classList.toggle('text-red-700', state === 'error');
  };
  const connectState = (k: keyof typeof CONNECT) => {
    const b = $<HTMLButtonElement>('m-connect');
    b.textContent = CONNECT[k].text;
    b.className = `${CONNECT_BASE} ${CONNECT[k].cls}`;
    b.dataset.state = k;
  };
  // The page title carries the detector's name once it is known, except for the
  // sample run, which is not the visitor's own detector.
  const SAMPLE = 'axlab-sample-12h.txt.gz';
  const showName = () => {
    $('m-title-name').textContent =
      run.name && fileLabel !== SAMPLE ? ` · ${run.name}` : '';
  };
  const fmtDur = (s: number) => {
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = Math.floor(s % 60);
    return h ? `${h} h ${m} min` : m ? `${m} min ${sec} s` : `${sec} s`;
  };

  // Controls, as in the GUI: bin time and ADC window.
  const binSel = $<HTMLSelectElement>('m-bin');
  const binCustom = $<HTMLInputElement>('m-bin-custom');
  const adcMinIn = $<HTMLInputElement>('m-adc-min');
  const adcMaxIn = $<HTMLInputElement>('m-adc-max');
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
    else if (binSel.value === 'custom')
      binSec = Math.max(1, Math.round(Number(binCustom.value) || 60));
    else binSec = Number(binSel.value);
    return { binSec, adcMin, adcMax };
  }
  const events = () => {
    const o = options();
    return select(run, o.adcMin, o.adcMax);
  };

  function showSummary() {
    const idx = events();
    const s = totals(run, idx);
    const ok = idx.length > 1;
    const hz = (k: 'all' | 'coinc') =>
      roundPair(s.rate[k], s.err[k]).join(' ± ') + ' Hz';
    $('s-duration').textContent = idx.length ? fmtDur(s.duration) : '–';
    $('s-events').textContent = idx.length
      ? s.events.toLocaleString('en-US')
      : '–';
    $('s-rate').textContent = ok ? hz('all') : '–';
    $('s-coinc').textContent = ok ? hz('coinc') : '–';
    $('s-temp').textContent = Number.isFinite(s.temp)
      ? `${s.temp.toFixed(1)} °C`
      : '–';
    $('s-press').textContent = Number.isFinite(s.press)
      ? `${(s.press / 100).toFixed(1)} hPa`
      : '–';
    const auto = binSel.querySelector('option[value="auto"]');
    if (auto)
      auto.textContent =
        run.n > 1 ? `Automatic (${autoBin(run.duration)} s)` : 'Automatic';
  }

  // Chart
  const dark = () => document.documentElement.classList.contains('dark');
  Chart.defaults.font.family =
    "'IBM Plex Sans Variable', 'IBM Plex Sans', system-ui, sans-serif";

  // Hide the tabs for sensors this run did not record (switched off in config.txt).
  function showTabs() {
    document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => {
      b.hidden = run.n > 0 && !available(run, b.dataset.tab as Tab);
    });
    const current = document.querySelector<HTMLButtonElement>(
      `[data-tab="${tab}"]`
    );
    if (current?.hidden)
      document.querySelector<HTMLButtonElement>('[data-tab="rate"]')?.click();
  }

  function render() {
    showName();
    const idx = events();
    const empty = idx.length < 2;
    $('m-empty').hidden = !empty;
    for (const id of ['m-csv', 'm-copy', 'm-pdf'])
      $<HTMLButtonElement>(id).disabled = empty;
    if (empty) {
      chart?.destroy();
      chart = null;
      csv = [];
      $('m-result').textContent =
        run.n > 1 ? 'No events inside this ADC window.' : '';
      return;
    }
    const built = build(tab, run, idx, options(), theme(dark()));
    csv = built.csv;
    $('m-result').textContent = built.result;
    chart?.destroy();
    chart = built.config
      ? new Chart($<HTMLCanvasElement>('m-chart'), built.config)
      : null;
  }

  // Tabs and controls
  const ctlFor: Record<Tab, string[]> = {
    rate: ['bin'],
    adc: [],
    sipm: [],
    pressure: ['bin'],
    temperature: ['bin'],
    accel: ['bin'],
    ratedist: ['bin'],
    dt: [],
  };
  function showControls() {
    document
      .querySelectorAll<HTMLElement>('[data-ctl]')
      .forEach(el => (el.hidden = !ctlFor[tab].includes(el.dataset.ctl!)));
    $('m-bin-custom-wrap').hidden =
      !ctlFor[tab].includes('bin') || binSel.value !== 'custom';
  }
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => {
    b.addEventListener('click', () => {
      tab = b.dataset.tab as Tab;
      document
        .querySelectorAll('[data-tab]')
        .forEach(o => o.setAttribute('aria-selected', String(o === b)));
      $('m-panel').setAttribute('aria-labelledby', b.id);
      document
        .querySelectorAll<HTMLElement>('[data-blurb]')
        .forEach(el => (el.hidden = el.dataset.blurb !== tab));
      showControls();
      render();
    });
  });
  binSel.addEventListener('change', () => {
    showControls();
    render();
  });
  binCustom.addEventListener('change', render);
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
  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
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
  $('m-csv').addEventListener('click', () =>
    download(
      new Blob([csvText()], { type: 'text/csv' }),
      `${run.name || 'cosmicwatch'}-${tab}.csv`
    )
  );
  $('m-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(csvText());
      $('m-result').textContent = 'CSV copied. Paste it into a spreadsheet.';
    } catch {
      $('m-result').textContent =
        'Copying is blocked here. Use Download CSV instead.';
    }
  });
  $('m-pdf').addEventListener('click', async () => {
    const btn = $<HTMLButtonElement>('m-pdf');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Making PDF…';
    try {
      const { downloadReport } = await import('./report');
      await downloadReport(
        run,
        events(),
        options(),
        fileLabel || (live ? 'live from USB' : 'data file')
      );
    } catch (e) {
      $('m-result').textContent =
        `The PDF could not be made: ${(e as Error).message}`;
    } finally {
      btn.textContent = label;
      btn.disabled = run.n < 2;
    }
  });

  // Files and the sample
  // Show the start of a loaded file in the .txt entries panel. A whole run can be
  // tens of megabytes, so only the first ~30,000 characters are shown.
  async function showFileStart(blob: Blob) {
    const el = $('m-raw');
    const reader = (await streamFromBlob(blob)).getReader();
    const dec = new TextDecoder();
    let text = '';
    while (text.length < 30000) {
      const { value, done } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
    }
    const cut = text.length >= 30000;
    reader.cancel().catch(() => {});
    const lines = text.slice(0, 30000).split('\n');
    if (cut) lines.pop();
    el.textContent =
      lines.join('\n') +
      (cut
        ? `\n… the start of the file. The plots use all ${run.n.toLocaleString('en-US')} events.`
        : '');
    el.scrollTop = 0;
  }

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
      await parseStream(
        stream,
        run,
        bytes =>
          (prog.value = Math.min(
            1,
            bytes / Math.max(1, blob.size * (label.endsWith('.gz') ? 4 : 1))
          ))
      );
      if (run.n === 0) {
        status(
          `${label} has no CosmicWatch event lines. Is it a detector data file?`,
          'error'
        );
      } else {
        const skipped = run.skipped
          ? ` ${run.skipped} lines were not events and were skipped.`
          : '';
        status(
          `${run.name || label}: ${run.n.toLocaleString('en-US')} events over ${fmtDur(run.duration)}.${skipped}`,
          'ok'
        );
        await showFileStart(blob);
      }
    } catch (e) {
      status(`Could not read ${label}: ${(e as Error).message}`, 'error');
    } finally {
      prog.classList.add('hidden');
      showSummary();
      showTabs();
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
      await loadBlob(await res.blob(), SAMPLE);
    } catch (e) {
      status(
        `The sample did not download (${(e as Error).message}). Try the download link and open the file instead.`,
        'error'
      );
    }
  }
  $('m-sample').addEventListener('click', loadSample);
  if (location.hash === '#sample') loadSample();

  // Live detector over USB
  type Port = {
    open(o: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
  };
  const serial = (
    navigator as Navigator & { serial?: { requestPort(): Promise<Port> } }
  ).serial;
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
    raw.textContent = (raw.textContent + line + '\n').slice(-30000);
    raw.scrollTop = raw.scrollHeight;
    run.addLine(line);
  }

  $('m-connect').addEventListener('click', async () => {
    if (!serial) return;
    if (live) {
      await disconnect();
      return;
    }
    try {
      port = await serial.requestPort();
      await port.open({ baudRate: 115200 });
    } catch (e) {
      status(`Not connected: ${(e as Error).message}`, 'error');
      return;
    }
    run.clear();
    rawLines = [];
    rawFresh = true; // a file shown in the panel gives way to the live lines
    fileLabel = 'live from USB';
    live = true;
    connectState('live');
    $('m-save').hidden = false;
    status('Connected. Waiting for the first event…', 'live');
    tick = window.setInterval(() => {
      if (run.n)
        status(
          `Live: ${run.n.toLocaleString('en-US')} events in ${fmtDur(run.duration)}.`,
          'live'
        );
      showSummary();
      showTabs();
      render();
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
    connectState('ended');
    status(
      run.n
        ? `Disconnected after ${run.n.toLocaleString('en-US')} events. The data stays here until you load something else.`
        : 'Disconnected.',
      'ok'
    );
    showSummary();
    showTabs();
    render();
  }

  $('m-save').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([rawLines.join('\n') + '\n'], { type: 'text/plain' })
    );
    a.download = `${run.name || 'CosmicWatch'}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  connectState('idle');
  status('', 'idle');
  showSummary();
  render();
}
