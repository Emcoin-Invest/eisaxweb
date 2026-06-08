export async function onRequestGet({ env }) {
  const config = {
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || '',
    analyticsEnabled: Boolean(env.CLOUDFLARE_WEB_ANALYTICS_TOKEN)
  };
  return new Response(JSON.stringify(config), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
