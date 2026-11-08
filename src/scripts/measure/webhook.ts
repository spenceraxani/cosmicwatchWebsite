// If CORS blocks the JSON POST, resend as a no-cors text/plain request; the reply is then unreadable.

export type WebhookFormat = 'json' | 'discord' | 'slack';

export interface WebhookConfig {
  url: string;
  format: WebhookFormat;
  everySec: number;
  enabled: boolean;
}

export interface Report {
  detector: string;
  sent_at: string;
  window_seconds: number;
  events: number;
  coincident: number;
  rate_hz: number;
  coincident_rate_hz: number;
  temperature_c: number | null;
  pressure_hpa: number | null;
  run_events: number;
  run_seconds: number;
}

const KEY = 'cw-webhook';

export function loadConfig(): WebhookConfig {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && typeof c.url === 'string') return { ...c, enabled: false };
  } catch {
    /* no saved settings */
  }
  return { url: '', format: 'json', everySec: 60, enabled: false };
}

export function saveConfig(c: WebhookConfig) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...c, enabled: false }));
  } catch {
    /* storage unavailable */
  }
}

function sentence(r: Report) {
  const env =
    r.temperature_c != null && r.pressure_hpa != null
      ? `, ${r.temperature_c.toFixed(1)} °C, ${r.pressure_hpa.toFixed(1)} hPa`
      : '';
  return `${r.detector || 'CosmicWatch'}: ${r.rate_hz.toFixed(2)} Hz (${r.events} events in ${Math.round(r.window_seconds)} s), ${r.coincident_rate_hz.toFixed(2)} Hz coincident${env}`;
}

export function body(format: WebhookFormat, r: Report) {
  if (format === 'discord') return JSON.stringify({ content: sentence(r) });
  if (format === 'slack') return JSON.stringify({ text: sentence(r) });
  return JSON.stringify({ source: 'CosmicWatch', ...r });
}

export async function send(c: WebhookConfig, r: Report): Promise<string> {
  let url: URL;
  try {
    url = new URL(c.url);
  } catch {
    throw new Error('That is not a full web address. It should start with https://');
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('Use an https:// address so the data is encrypted on the way.');
  }
  const payload = body(c.format, r);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
    if (!res.ok) throw new Error(`The server answered ${res.status} ${res.statusText}.`);
    return `Sent. Server answered ${res.status}.`;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('The server answered')) throw e;
    // Readable request refused (usually CORS). Send as a simple request.
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: payload });
    return 'Sent. This server does not let pages read its reply, so check the receiving end to confirm.';
  }
}
