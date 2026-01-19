
# Ledger PWA

A simple offline-ready PWA you can deploy to GitHub Pages and use on iPhone Safari. It tracks:

- **Payments** (Credits & Debits) per **Ledger**, with CSV export per ledger (combined credits & debits, latest → earliest).
- **Receivables** with support for up to **5 favourite customers**, ability to **filter by ledger**, **delete**, and **move** receivables between ledgers.
- **Stock** per ledger with predefined products, editable prices, quantities, and total value.
- **Dashboard** summarising Debits, Credits, Receivables, Stock Value and **Business Worth** for the selected ledger.

**Business Worth** formula:
```
Business Worth = Total Debits − (Total Credits + Total Receivables + Total Stock Value)
```
Value is **Green** if > 0, **Red** if < 0, grey if = 0.

## Deploy on GitHub Pages

1. Create a new GitHub repository (public or private).
2. Upload the contents of this folder to the repository root (files like `index.html`, `app.js`, `styles.css`, etc.).
3. Commit & push.
4. In **Settings → Pages**, set **Source** to `Deploy from a branch`, select `main` branch and `/ (root)` folder.
5. Wait for Pages to publish. Your site will be at `https://<your-username>.github.io/<repo-name>/`.

> Tip: iOS Safari requires HTTPS for service workers. GitHub Pages provides HTTPS by default.

## Install to Home Screen (iPhone)

1. Open your GitHub Pages URL in Safari.
2. Tap the **Share** icon → **Add to Home Screen**.
3. Launch from the icon. The app opens in standalone mode with **Payments** as the default tab.

## Notes
- Data is stored locally on your device (using `localStorage`). Clearing site data will remove your records.
- You can create as many **Ledgers** as you want in the **Payments** tab. These become available in **Receivables**, **Stock**, and **Dashboard**.
- CSV export appears as a file download in your browser.
- Dates are sorted from **latest to earliest** (by the `date` field, then `createdAt`).

## Development
No build tools are required. Files are vanilla HTML/CSS/JS.
