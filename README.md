# Virgin Money–inspired mobile banking UI (unofficial)

High-fidelity, **unofficial** recreation of a mobile banking account interface for demonstration and UI practice.

This project is **not affiliated with, endorsed by, or operated by Virgin Money**. It uses fictionalised account and transaction data only. No real banking authentication, payments, or account connections are included.

## Visual reference

- Live layout reference: [frame-and-font-fidelity.lovable.app](https://frame-and-font-fidelity.lovable.app/)
- Prior agent brief: [Virgin cloud agent](https://cursor.com/agents/bc-01a182a4-120b-7573-8e66-ec974590b0ce)

## Stack

- Vite
- React 19
- TypeScript

## Run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Features

- Splash / login shell
- Home, Accounts, Pay, Rewards, Profile tabs with bottom navigation
- Go Account screen with red header, balances, expandable account details
- Searchable, date-grouped transaction history
- Transaction detail sheet
- Overflow menu (account info, display preferences, application information)
- Centralised fictional account + transaction models and currency/date helpers

## Project layout

- `src/data` — account and transaction models
- `src/utils` — currency, dates, grouping, search
- `src/components` — reusable UI pieces
- `src/screens` — top-level views
