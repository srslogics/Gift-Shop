# Maison Aurelle — Gifting Studio ERP demo

A buildless, browser-local demonstration of boutique operations. Access `/erp/`. Serve `dist/` with any static HTTP server. No dependencies or build step are required.

## Demonstration flows

- Create an order: availability checks reserve component quantities without deducting on-hand stock.
- Move an order through Confirmed → Packing → Ready → Dispatched. Dispatch consumes the components once; cancellation releases reservations.
- Receive component stock and see hamper capacity increase across shared recipes.
- Create a hamper from selected components with calculated material costs, margins and availability.
- Prepare corporate quotations, record sample approval and convert to an order. Insufficient stock blocks conversion.
- Search/filter orders and inventory, export CSV, review reports, and reset the sample workspace.

## Scope

All names, approvals, amounts and transactions are illustrative. State is stored only in this browser's localStorage. This is a single-browser demonstration, not a production ERP, shared database or multi-user service. Do not enter real customer information. Payment labels are simulated; no payment processing, supplier purchase, courier booking or customer communication happens. Material contribution excludes tax, labour, delivery and overhead. Dates are part of a fixed October–November 2026 sample scenario.

The storefront's original concept imagery and locally hosted fonts are reused. Font licences are included in `dist/assets`.

## Checks

Run `node --test tests/erp.test.cjs`. The model checks cover shared reservations, shortage rejection, one-time dispatch consumption, cancellation, stock receipts and new hamper costing. Browser QA additionally exercised the full order flow, quotations, downloads, persistence/reset and mobile navigation in Chromium.

Deployment: Render publishes the existing `dist/` folder. The ERP entry is `dist/erp/index.html`; `<base href="/erp/">` supports both `/erp` and `/erp/`. Existing storefront assets are shared from `/assets/`. This path is publicly accessible on Render and is sample-data only.
