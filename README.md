# Gift-Shop

## Maison Aurelle

An original luxury gifting storefront concept created for SS49. Working brand only; not an established retailer. Separate from the existing SS49 website and ERP demo.

## Experience

- Responsive ivory/burgundy editorial homepage, locally hosted Cormorant Garamond and Manrope fonts.
- Four illustrative products with original AI-generated photography and sample INR prices.
- Category and occasion filters, saved products, inline collection search, price sorting and a budget-aware gift finder.
- Product details, quantity-controlled shopping bag, optional gift note, downloadable selection.
- Downloadable bespoke gifting brief. No form is submitted to a business.
- Keyboard-friendly native dialogs, reduced-motion support, accessible labels, mobile navigation.
- Readable editorial type scale, sticky navigation, visible filter counts and reset controls, larger touch targets, and immediate bag confirmation after quick-add.

## Boundaries

This is a frontend prototype, not a live store. There are no payments, authentication for buyers, inventory, fulfilment, order processing, email delivery or analytics. Bag contents and saved pieces persist in localStorage on the current origin. A clear-data control is available in the privacy dialog. All actual business policies, supplier specifications, pricing, allergens and delivery terms must be approved before launch. The demo is noindex.

## Run

Serve `dist/` with a static HTTP server, e.g. `python3 -m http.server 8781 --directory dist`. No build or installation required. Run rule tests with `node --test tests/catalog.test.cjs`.

## Host on Render

Create a **Static Site**, not a Web Service, connected to this repository.

- Branch: `main`
- Root directory: leave blank
- Build command: `echo "Static site ready"`
- Publish directory: `dist`
- Environment variables: none

All storefront assets are included in `dist/`. No backend, build tools or external asset service is required. The site intentionally retains `noindex,nofollow` while it is a fictional storefront demo. Remove that restriction only when real branding, products and store policies are ready for launch.

Local ChatGPT Sites registration metadata is excluded; it is not used by Render.

## Imagery

Original concept images generated with the built-in image generation tool, then converted to JPEG for delivery. Final project assets:

- `dist/assets/gift-atelier.jpg`: warm ivory gift boxes with burgundy ribbons, candle, ceramic cup, chocolate, flowers, travertine and warm side lighting.
- `dist/assets/amber-candle.jpg`: amber glass candle, brass lid, ribboned matches, olive branch, ivory plaster and limestone.
- `dist/assets/tea-ritual.jpg`: ivory ceramic teapot and two teacups, burgundy tea tin and natural linen on limestone.
- `dist/assets/floral-poetry.jpg`: burgundy calla lilies, cream rose and olive foliage in a ceramic vase beside a ribboned gift.

No imagery was copied from the reference retailers. Typeface licences are included in `dist/assets/`.
