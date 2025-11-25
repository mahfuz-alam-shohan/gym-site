# Gym Site

A lightweight gym management dashboard built for Cloudflare Workers and D1. The worker serves a single-page UI for tracking members, attendance, and payments without any external frontend framework.

## Features
- **Member management:** add members with plan and contact details, update status automatically based on expiry, and remove records when needed.
- **Attendance tracking:** fast daily check-ins with duplicate prevention and quick search suggestions.
- **Billing and dues:** record payments, calculate overdue months, and flag inactive or due members.
- **Dashboard insights:** summary cards for active members, revenue, attendance today, due and inactive counts, plus tables for attendance history and member list.
- **Configurable settings:** set gym name, welcome message, membership plans, attendance threshold, and inactivity rules via the UI.

## Technology
- **Cloudflare Workers** for the serverless runtime.
- **D1** for persistence (tables for config, users, members, attendance, payments, sessions) created automatically on first request.
- **Chart.js** for lightweight visualizations inside the HTML.

## Running locally
1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and log in.
2. Ensure your `wrangler.toml` has a D1 binding named `DB` (already present in this repo).
3. Start the dev server:
   ```bash
   wrangler dev
   ```
4. Open the printed local URL. The worker seeds tables on demand, so you can begin adding members and recording attendance immediately.

## Deploying
Deploy to Cloudflare with:
```bash
wrangler deploy
```
The bound D1 database will be used in production as configured in `wrangler.toml`.
