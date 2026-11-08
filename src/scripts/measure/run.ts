// Event line format (tab-separated), same from microSD, import_data.py and USB:
// Event Timestamp[s] Flag ADC[12b] SiPM[mV] Deadtime[s] Temp[C] Press[Pa] Accel(X:Y:Z)[g] Gyro(X:Y:Z)[deg/sec] [Name Time Date]

class Column<T extends Float64Array | Float32Array | Uint8Array | Uint16Array> {
  data: T;
  constructor(private Ctor: { new (n: number): T }, size = 4096) {
    this.data = new Ctor(size);
  }
  ensure(n: number) {
    if (n <= this.data.length) return;
    let size = this.data.length;
    while (size < n) size *= 2;
    const next = new this.Ctor(size);
    (next as ArrayLike<number> & { set(a: ArrayLike<number>): void }).set(this.data);
    this.data = next;
  }
}

export class Run {
  name = '';
  n = 0;
  readonly t = new Column(Float64Array); // detector timestamp, s
  readonly flag = new Column(Uint8Array); // 1 = coincident
  readonly adc = new Column(Uint16Array); // 0 to 4095
  readonly dead = new Column(Float64Array); // cumulative deadtime, s
  readonly temp = new Column(Float32Array); // °C
  readonly press = new Column(Float32Array); // Pa
  readonly tilt = new Column(Float32Array); // degrees from vertical, from the accelerometer
  skipped = 0;

  clear() {
    this.n = 0;
    this.skipped = 0;
    this.name = '';
  }

  addLine(raw: string): boolean {
    const line = raw.trim();
    if (!line) return false;
    if (line.startsWith('#')) {
      const m = line.match(/Detector Name:\s*(\S+)/);
      if (m) this.name = m[1];
      return false;
    }
    const c = line.split('\t');
    if (c.length < 8 || !/^\d+$/.test(c[0])) {
      this.skipped++;
      return false;
    }
    const t = parseFloat(c[1]);
    if (!Number.isFinite(t)) {
      this.skipped++;
      return false;
    }
    const i = this.n;
    const need = i + 1;
    this.t.ensure(need);
    this.flag.ensure(need);
    this.adc.ensure(need);
    this.dead.ensure(need);
    this.temp.ensure(need);
    this.press.ensure(need);
    this.tilt.ensure(need);
    this.t.data[i] = t;
    this.flag.data[i] = c[2] === '1' ? 1 : 0;
    this.adc.data[i] = parseInt(c[3], 10) || 0;
    this.dead.data[i] = parseFloat(c[5]) || 0;
    this.temp.data[i] = parseFloat(c[6]);
    this.press.data[i] = parseFloat(c[7]);
    let tilt = NaN;
    if (c[8]) {
      const [ax, ay, az] = c[8].split(':').map(Number);
      const g = Math.hypot(ax, ay, az);
      if (g > 0.2) tilt = (Math.acos(Math.min(1, Math.abs(az) / g)) * 180) / Math.PI;
    }
    this.tilt.data[i] = tilt;
    if (!this.name && c[10] && !/^\d/.test(c[10])) this.name = c[10];
    this.n = need;
    return true;
  }

  get duration() {
    return this.n > 1 ? this.t.data[this.n - 1] - this.t.data[0] : 0;
  }
  /** Live time: duration minus the detector's reported deadtime. */
  get liveTime() {
    if (this.n < 2) return 0;
    return Math.max(1e-9, this.duration - (this.dead.data[this.n - 1] - this.dead.data[0]));
  }
}

/** Stream a File or Response body through the parser without holding the text. */
export async function parseStream(
  stream: ReadableStream<Uint8Array>,
  run: Run,
  onProgress?: (bytes: number) => void
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let rest = '';
  let bytes = 0;
  let sinceYield = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    const text = rest + decoder.decode(value, { stream: true });
    const lines = text.split('\n');
    rest = lines.pop() ?? '';
    for (const l of lines) run.addLine(l);
    sinceYield += value.byteLength;
    if (sinceYield > 4_000_000) {
      sinceYield = 0;
      onProgress?.(bytes);
      await new Promise(r => setTimeout(r, 0));
    }
  }
  rest += decoder.decode();
  if (rest) run.addLine(rest);
  onProgress?.(bytes);
}

/** Open a file that may be gzipped (checked by its first two bytes). */
export async function streamFromBlob(blob: Blob): Promise<ReadableStream<Uint8Array>> {
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  const gz = head[0] === 0x1f && head[1] === 0x8b;
  const s = blob.stream() as ReadableStream<Uint8Array>;
  if (gz && 'DecompressionStream' in window) {
    return s.pipeThrough(new DecompressionStream('gzip') as ReadableWritablePair<Uint8Array, Uint8Array>);
  }
  return s;
}
