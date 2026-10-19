# Client preview audit

Date: 19 October 2026 (Asia/Kolkata)

## Intended handoff

This is a **design and interactive shopping-flow prototype**, not an operational ecommerce store. Maison Aurelle is a working name. Products, images and prices are illustrative. Do not present it as ready to receive customer orders.

## Verified

- 25 automated checks cover catalogue rules, quantities, totals, storage sanitisation, storage-unavailable fallback, search, sorting, saved pieces, gift finder, gift-note escaping, selection downloads, bespoke brief validation, static links/assets, accessibility foundations and sharing metadata.
- Application tests execute the real application script in an isolated document stub. They test logic and generated markup, not real browser behaviour or rendering.
- Live homepage responds with HTTP 200. Plain HTTP redirects to HTTPS. HTTPS has HSTS and MIME-sniffing protection.
- All 16 published files responded successfully in the pre-fix live audit. The live sharing image is JPEG, 1200 x 630. Cloudflare recompresses that JPEG; its different byte hash is expected and confirmed by `cf-polished`.
- Unknown page, `.git/HEAD`, `.env`, `.openai/hosting.json`, and the artwork source script return 404 on the public host. These are limited exposure checks, not a comprehensive penetration test.
- No third-party scripts, analytics, payment collection, network form submissions, or embedded credentials were found in the storefront source. Gift notes are escaped before HTML insertion.
- Native dialogs, input labels, visible focus styles, reduced-motion support, image alternatives, mobile breakpoints and a skip link exist in source.
- Earlier hands-on checks covered 1440px desktop and 390px/320px mobile layouts, filters, search, sorting, product details and shopping bag behaviour.

## Fixed during final review

- Status messages now appear inside an open dialog rather than only behind its modal backdrop.
- Empty-bag browsing clears prior filters and search so the customer can actually see gifts.
- Mobile navigation restores focus to the destination rather than to the menu trigger; clearing an occasion returns focus to a stable control.
- Correct singular/plural wording after adding one item.
- Privacy copy now describes the public Render deployment and warns about shared-device storage.
- Explicit referrer policy added to the page.

## Remaining verification limits

- Fresh browser automation is disabled in Work settings. The final fixes have automated logic checks, but have not had a new interactive browser pass.
- No fresh Safari/Firefox/device matrix, screen-reader test, keyboard-only end-to-end test, Lighthouse score, or measured Core Web Vitals result is claimed.
- Actual WhatsApp presentation/cache behaviour has not been tested in WhatsApp. Open Graph source and image availability are verified.
- The full static bundle includes roughly 2.6 MB of original product imagery and fonts. Lazy-loading is used for lower-page imagery, but mobile network performance remains unmeasured. WOFF2 fonts and responsive WebP images are sensible production optimisations.
- There is no backend to audit for account access, order authorisation, SQL injection, payment webhooks or personal-data retention. Those must be assessed when implemented.

## Hosting hardening before a production launch

The current response lacks a Content-Security-Policy, framing restriction and Permissions-Policy. These are defence-in-depth gaps, not evidence of a confirmed exploit in this static demo. Set them in Render's **Headers** settings; a `_headers` file is not the Render configuration mechanism.

Suggested values to test first on a preview deployment:

| Header | Value |
| --- | --- |
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` |
| X-Frame-Options | `DENY` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=()` |
| Referrer-Policy | `strict-origin-when-cross-origin` |

Inline style attributes currently require `style-src 'unsafe-inline'`. Review the policy again when checkout, analytics, external assets or integrations are added. Framing restrictions intentionally prevent embedding the store elsewhere.

Reference: https://render.com/docs/static-site-headers

## Before sending the preview

1. Wait for Render to deploy the latest commit; run `node tools/audit-live.cjs` to compare it with the local files.
2. Open the live link in an incognito window and briefly try search, add/remove, the gift finder and a download. This remains the manual handoff gate while browser automation is disabled.
3. Describe it as a bespoke boutique concept with working local interactions. Do not promise checkout, delivery, inventory or an enquiry inbox.

## Before accepting real customers

Approve the final brand and catalogue, product specifications, images, prices, taxes, shipping, returns and contact policies. Add inventory/order persistence, payment handling, transactional communications and appropriate privacy/security controls. The demo deliberately remains `noindex,nofollow` until a real launch is approved.
