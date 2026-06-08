export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const event = { event: String(data.event || 'event').slice(0,80), path: String(data.path || '').slice(0,200), meta: data.meta || {}, createdAt: new Date().toISOString() };
    if (env.ANALYTICS_KV) await env.ANALYTICS_KV.put(`event:${event.createdAt}:${crypto.randomUUID()}`, JSON.stringify(event));
  } catch (e) {}
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
