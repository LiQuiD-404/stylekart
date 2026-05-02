# StyleKart Ops Dashboard

Inventory sync & returns monitoring dashboard for StyleKart.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS v4
- **Data**: Static JSON pre-generated from Excel via Go export script

## Running locally

```bash
# Generate JSON from Excel (run whenever data changes)
cd backend && go run ./export

# Start the dashboard
cd dashboard && npm install && npm run dev
```

## Deploying to Vercel

1. Set root directory to `dashboard/`
2. Build command: `npm run build`
3. Output directory: `dist/`

No backend process needed at runtime — the app reads static JSON from `public/data/`.

## Updating data

Edit `data/StyleKart_Master_Data.xlsx`, then regenerate:

```bash
cd backend && go run ./export
```

Commit the updated JSON files in `dashboard/public/data/`.
