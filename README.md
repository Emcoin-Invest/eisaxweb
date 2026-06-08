# EisaX Website — Final Launch Package

This package is ready for Cloudflare Pages deployment.

## Upload
Upload the contents of this folder to Cloudflare Pages. The entry point is `index.html`.

## Contact form
The contact form posts to `/api/contact` using Cloudflare Pages Functions.

Recommended Cloudflare environment variables:

- `RESEND_API_KEY` — optional, enables direct email delivery through Resend.
- `LEAD_TO_EMAIL` — defaults to `partnerships@eisax.com`.
- `LEAD_FROM_EMAIL` — defaults to `EisaX Website <noreply@eisax.com>`.
- `TURNSTILE_SITE_KEY` — optional, enables Cloudflare Turnstile widget.
- `TURNSTILE_SECRET_KEY` — optional, verifies Turnstile submissions.
- `LEADS_KV` — optional KV binding to store submitted leads.
- `RATE_LIMIT_KV` — optional KV binding for rate limiting. If omitted, `LEADS_KV` is used when available.

If email delivery is not configured, the form shows a mailto fallback to `partnerships@eisax.com`.

## Included production features

- English and Arabic commercial pages with RTL support.
- WealthGate AI commercial sales page.
- Partnership contact form with honeypot, optional Turnstile, and optional KV rate limiting.
- OG/Twitter tags, JSON-LD, Article/Breadcrumb/FAQ/SoftwareApplication schema.
- Sitemap, robots, manifest, favicon, Apple icon, 404 page, security.txt, security headers.
- Legacy redirects for old file names, including URL-encoded names with spaces.
- Legal, privacy, cookies, disclaimer, and security pages.
- No public pricing, no brokerage/custody/account-opening claims, no fake social proof.
