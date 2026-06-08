function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
function clean(value, max = 3000) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}
async function hashText(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function enforceRateLimit(env, request, email) {
  const kv = env.RATE_LIMIT_KV || env.LEADS_KV;
  if (!kv) return { ok: true };
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  const key = 'rate:' + await hashText(`${ip}:${String(email || '').toLowerCase()}`);
  const count = Number(await kv.get(key) || '0');
  if (count >= 5) return { ok: false, error: 'Too many submissions. Please try again later.' };
  await kv.put(key, String(count + 1), { expirationTtl: 60 * 60 });
  return { ok: true };
}
async function verifyTurnstile(env, token, request) {
  if (!env.TURNSTILE_SECRET_KEY) return { ok: true, skipped: true };
  if (!token) return { ok: false, error: 'Security verification is required.' };
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set('remoteip', ip);
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const result = await verify.json().catch(() => ({}));
  if (!result.success) return { ok: false, error: 'Security verification failed.' };
  return { ok: true };
}
export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    if (clean(data.website)) return json({ ok: true }); // honeypot: pretend success
    const required = ['name', 'company', 'email', 'interest', 'message', 'consent'];
    for (const key of required) {
      if (!data[key] || String(data[key]).trim().length < 2) {
        return json({ ok: false, error: `Missing required field: ${key}` }, 400);
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return json({ ok: false, error: 'Invalid email address' }, 400);
    const limited = await enforceRateLimit(env, request, data.email);
    if (!limited.ok) return json(limited, 429);
    const turnstile = await verifyTurnstile(env, data['cf-turnstile-response'], request);
    if (!turnstile.ok) return json({ ok: false, error: turnstile.error }, 403);
    const lead = {
      name: clean(data.name, 120),
      company: clean(data.company, 160),
      email: clean(data.email, 180),
      role: clean(data.role || '', 160),
      country: clean(data.country || '', 120),
      interest: clean(data.interest, 160),
      message: clean(data.message, 3000),
      createdAt: new Date().toISOString(),
      source: request.headers.get('referer') || 'eisax.com/partnerships'
    };
    if (env.LEADS_KV) await env.LEADS_KV.put(`lead:${lead.createdAt}:${await hashText(lead.email)}`, JSON.stringify(lead), { expirationTtl: 60 * 60 * 24 * 365 });
    if (env.RESEND_API_KEY) {
      const to = env.LEAD_TO_EMAIL || 'partnerships@eisax.com';
      const from = env.LEAD_FROM_EMAIL || 'EisaX Website <noreply@eisax.com>';
      const subject = `EisaX inquiry — ${lead.interest} — ${lead.company}`;
      const text = `New EisaX website inquiry\n\nName: ${lead.name}\nCompany: ${lead.company}\nEmail: ${lead.email}\nRole: ${lead.role}\nCountry: ${lead.country}\nInterest: ${lead.interest}\nSource: ${lead.source}\n\nMessage:\n${lead.message}\n\nSubmitted: ${lead.createdAt}`;
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, text, reply_to: lead.email })
      });
      if (!r.ok) return json({ ok: false, error: 'Email delivery failed. Please email partnerships@eisax.com directly.' }, 502);
    }
    if (!env.RESEND_API_KEY && !env.LEADS_KV) return json({ ok: false, error: 'Lead delivery is not configured. Please email partnerships@eisax.com directly.' }, 503);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: 'Invalid request' }, 400);
  }
}
