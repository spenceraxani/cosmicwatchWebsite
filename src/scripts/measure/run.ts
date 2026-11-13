// Event line format (tab-separated), same from microSD, import_data.py and USB:
// Event Timestamp[s] Flag ADC[12b] SiPM[mV] Deadtime[s] Temp[C] Press[Pa] Accel(X:Y:Z)[g] Gyro(X:Y:Z)[deg/sec] [Name Time Date]

class Column<T extends Float64Array | Float32Array | Uint8Array | Uint16Array> {
  data: T;
  constructor(
    private Ctor: { new (n: number): T },
    size = 4096
  ) {
    this.data = new Ctor(size);
  }
  ensure(n: number) {
    if (n <= this.data.length) return;
    let size = this.data.length;
    while (size < n) size *= 2;
    const next = new this.Ctor(size);
    (next as ArrayLike<number> & { set(a: ArrayLike<number>): void }).set(
      this.data
    );
    this.data = next;
  }
}

export class Run {
  name = '';
  n = 0;
  readonly t = new Column(Float64Array); // detector timestamp, s
  readonly flag = new Column(Uint8Array); // 1 = coincident
  readonly adc = new Column(Uint16Array); // 0 to 4095
  readonly sipm = new Column(Float32Array); // SiPM peak, mV
  readonly dead = new Column(Float64Array); // cumulative deadtime since the detector started, s
  readonly temp = new Column(Float32Array); // °C
  readonly press = new Column(Float32Array); // Pa
  readonly ax = new Column(Float32Array); // acceleration, g
  readonly ay = new Column(Float32Array);
  readonly az = new Column(Float32Array);
  readonly gx = new Column(Float32Array); // angular velocity, deg/s
  readonly gy = new Column(Float32Array);
  readonly gz = new Column(Float32Array);
  skipped = 0;

  private readonly cols = [
    this.t,
    this.flag,
    this.adc,
    this.sipm,
    this.dead,
    this.temp,
    this.press,
    this.ax,
    this.ay,
    this.az,
    this.gx,
    this.gy,
    this.gz,
  ];

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
    for (const col of this.cols) col.ensure(need);
    this.t.data[i] = t;
    // Same rule as the GUI: anything other than 0/false/empty counts as coincident.
    this.flag.data[i] = ['0', 'false', 'False', ''].includes(c[2].trim())
      ? 0
      : 1;
    this.adc.data[i] = parseInt(c[3], 10) || 0;
    this.sipm.data[i] = parseFloat(c[4]);
    this.dead.data[i] = parseFloat(c[5]) || 0;
    // Sensors switched off in config.txt report -999; store those as missing.
    const val = (x: number) => (x === -999 ? NaN : x);
    this.temp.data[i] = val(parseFloat(c[6]));
    this.press.data[i] = val(parseFloat(c[7]));
    const xyz = (s: string | undefined) =>
      s ? s.split(':').map(v => val(Number(v))) : [NaN, NaN, NaN];
    const [ax, ay, az] = xyz(c[8]);
    const [gx, gy, gz] = xyz(c[9]);
    this.ax.data[i] = ax;
    this.ay.data[i] = ay;
    this.az.data[i] = az;
    this.gx.data[i] = gx;
    this.gy.data[i] = gy;
    this.gz.data[i] = gz;
    if (!this.name && c[10] && !/^\d/.test(c[10])) this.name = c[10];
    this.n = need;
    return true;
  }

  get duration() {
    return this.n > 1 ? this.t.data[this.n - 1] - this.t.data[0] : 0;
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
export async function streamFromBlob(
  blob: Blob
): Promise<ReadableStream<Uint8Array>> {
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  const gz = head[0] === 0x1f && head[1] === 0x8b;
  const s = blob.stream() as ReadableStream<Uint8Array>;
  if (gz && 'DecompressionStream' in window) {
    return s.pipeThrough(
      new DecompressionStream('gzip') as ReadableWritablePair<
        Uint8Array,
        Uint8Array
      >
    );
  }
  return s;
}
