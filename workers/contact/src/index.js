// CosmicWatch contact form → Prof. Axani's inbox, with no spam getting through.
//
// The Contact page posts the form here (PUBLIC_CONTACT_ENDPOINT). A message is
// emailed only if it passes every check, in this order:
//   1. it comes from the website (Origin is in ALLOWED_ORIGINS);
//   2. this visitor's IP has not sent too many messages (rate limit);
//   3. the hidden "website_check" box is empty (bots fill every field);
//   4. the form was on screen for at least MIN_SECONDS (bots post instantly);
//   5. Cloudflare Turnstile confirms a human, for this site and this form
//      (checked here with the secret key, so it cannot be skipped);
//   6. the fields look like a real message (lengths, a valid email, few links).
// Then it is handed to FormSubmit (formsubmit.co), which emails TO_EMAIL with
// Reply-To set to the visitor. Nothing is stored.
//
// Settings (workers/contact/wrangler.toml and `wrangler secret put`):
//   TURNSTILE_SECRET  secret  Turnstile secret key
//   TO_EMAIL          var     where messages go
//   ALLOWED_ORIGINS   var     comma-separated site origins
//   SITE_URL          var     the site's address (sent to FormSubmit)
//   LIMITER           binding Workers rate limit (optional)
//   DRY_RUN           var     "1" for local tests: run every check, send nothing

const MIN_SECONDS = 4;
const MAX_LINKS = 2;

const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });

// Bots get a plain "ok" so they learn nothing; nothing is sent.
const silentlyDrop = origin => json({ ok: true }, 200, origin);

export default {
  async fetch(request, env) {
    const origins = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const origin = request.headers.get('Origin') || '';
    const allowed = origins.includes(origin);

    if (request.method === 'OPTIONS')
      return allowed
        ? json(null, 204, origin)
        : new Response(null, { status: 403 });
    if (request.method !== 'POST')
      return new Response('Method not allowed', { status: 405 });
    if (!allowed) return json({ ok: false, error: 'origin' }, 403, '');

    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: ip || 'unknown' });
      if (!success) return json({ ok: false, error: 'rate' }, 429, origin);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ ok: false, error: 'form' }, 400, origin);
    }
    const get = k => String(form.get(k) ?? '').trim();

    if (get('website_check')) return silentlyDrop(origin);
    const started = Number(get('started'));
    if (!started || Date.now() - started < MIN_SECONDS * 1000)
      return silentlyDrop(origin);

    // Turnstile, verified server-side with the secret key.
    const token = get('cf-turnstile-response');
    if (!token) return json({ ok: false, error: 'captcha' }, 400, origin);
    const verify = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
          remoteip: ip,
        }),
      }
    ).then(r => r.json());
    const hosts = origins.map(o => new URL(o).hostname);
    // Cloudflare's test keys report example.com; accept them only in DRY_RUN.
    const testKey =
      env.DRY_RUN === '1' && verify.metadata?.result_with_testing_key === true;
    if (
      !verify.success ||
      (!testKey &&
        (verify.action !== 'contact' || !hosts.includes(verify.hostname)))
    )
      return json(
        {
          ok: false,
          error: 'captcha',
          // Only while testing: say why Cloudflare refused it.
          ...(env.DRY_RUN === '1' && {
            debug: {
              codes: verify['error-codes'],
              hostname: verify.hostname,
              action: verify.action,
            },
          }),
        },
        400,
        origin
      );

    const first = get('first').slice(0, 80);
    const last = get('last').slice(0, 80);
    const email = get('email');
    const message = get('message');
    const links = (message.match(/https?:\/\/|www\./gi) || []).length;
    if (
      !/^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(email) ||
      email.length > 200 ||
      message.length < 5 ||
      message.length > 5000 ||
      links > MAX_LINKS ||
      /<\s*(a|script|iframe)\b/i.test(message)
    )
      return json({ ok: false, error: 'content' }, 400, origin);

    const name = `${first} ${last}`.trim() || 'Website visitor';
    if (env.DRY_RUN === '1')
      return json(
        { ok: true, dryRun: true, name, email, hostname: verify.hostname },
        200,
        origin
      );
    const sent = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(env.TO_EMAIL)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: env.SITE_URL,
          Referer: `${env.SITE_URL}/contact/`,
        },
        body: JSON.stringify({
          _subject: `CosmicWatch website: message from ${name}`,
          _replyto: email,
          _template: 'table',
          _captcha: 'false',
          Name: name,
          Email: email,
          Message: message,
        }),
      }
    )
      .then(r => r.json())
      .catch(() => ({ success: 'false' }));

    if (String(sent.success) !== 'true')
      return json(
        { ok: false, error: 'send', detail: sent.message },
        502,
        origin
      );
    return json({ ok: true }, 200, origin);
  },
};
