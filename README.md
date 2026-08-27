# ASB Kids Tracker

A mobile app for tracking children's ASB debts and repayments. The interface, date labels, app descriptions, and new default payment notes are in English. Currency remains Malaysian ringgit (RM).

## Features

- Dashboard showing total debt, total paid, and the current balance
- Payment checklist for the current month
- Payment records by child, date, amount, and note
- Editable debts and monthly payment targets
- Delete payment records entered by mistake
- Automatic saving across phones, tablets, and computers
- A sync link for opening the same records on another device
- Backup and restore using JSON files
- Install on the home screen and reopen after the first visit
- A local copy in `localStorage` for offline use

## Initial data

- Tasneem: original debt RM4,600; recorded payments RM2,446
- Azra: original debt RM4,000; payment history not yet added
- Naurah: original debt RM8,000; recorded payments RM2,446
- Withdrawal date: 16 February 2026

These values can be edited on the **Settings** page. Existing saved names, payment notes, amounts, and dates are preserved when upgrading to the English interface.

## Run locally

Requires Node.js 22.13 or later.

```bash
npm ci
npm run dev
```

## Connect GitHub to Cloudflare

1. Upload the project contents to a GitHub repository.
2. In Cloudflare, select **Workers & Pages** and connect the repository.
3. Use `npm run build` as the build command.
4. Use `npx wrangler deploy` as the deploy command, or `npm run deploy` if Cloudflare asks for a single command.
5. Set the Node.js version to `22.13.0` or later.

The `wrangler.jsonc` file configures a Cloudflare Durable Object for persistent storage. Wrangler creates the storage namespace during the first deployment; no manual database setup or API key is required.

## Saving and backups

After opening the updated app on the original device, existing `localStorage` data is migrated to cloud storage automatically. All devices use the same shared family record. You can also open **Settings → Share sync link** to open the app on another device.

Keep the app and sync link within your family. Use **Download backup** occasionally to keep an extra copy.
