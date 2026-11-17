# Caravan Trip Planner — Cloudflare Pages + D1

A private, mobile-friendly caravan holiday planner with CRUD editing, booking balances, annual leave, JSON import/export and a Cloudflare D1 database.

## Deploy using GitHub + Cloudflare Pages

1. Keep your GitHub repository **private**. Upload the contents of this package to the **root** of your repository. Keep `functions/`, `public/`, and `schema.sql` at the top level.
2. In Cloudflare dashboard, create a **D1 database** named `caravan-planner-db` (Workers & Pages → D1 SQL Database). Open its Console and execute the contents of `schema.sql`.
3. In Cloudflare, go to **Workers & Pages → Create → Pages → Connect to Git**, and select your GitHub repository. If the UI offers only Workers, find the Pages Git integration flow.
4. Build settings: **Framework preset: None**, **Build command: leave blank**, **Build output directory: `public`**, **Root directory: repository root**.
5. After the Pages project is created, go to **Settings → Bindings → Add → D1 database**. Set variable name exactly `DB` and choose `caravan-planner-db`. Set for **Production** and, if desired, Preview.
6. In **Settings → Variables and Secrets**, add two **encrypted secrets** for Production: `ADMIN_PASSWORD` (a strong unique password) and `SESSION_SECRET` (a random 32+ character secret). Do not commit either value to GitHub. If you have Preview deployments, configure their secrets separately.
7. **Redeploy** after adding bindings and secrets. Visit your `*.pages.dev` address, log in, and test adding a trip.
8. After logging in, select **Import changes** and upload `starter-trips.json` from your device. The starter file intentionally contains no booking reference numbers. Verify all estimated amounts and booking statuses before relying on them.

## Notes on privacy and security

- The app blocks all routes without a signed, HTTP-only session cookie. The login endpoint is public.
- HTTPS is provided by Cloudflare. Password and session secrets live in Cloudflare, not in GitHub.
- For a stronger security posture, additionally protect the Pages domain with Cloudflare Access and an identity-provider login. The included password login is a basic single-user approach, not a full identity system.
- No live ChatGPT-to-D1 integration is installed. Ask ChatGPT to prepare a `caravan-planner-v1` JSON import, then import it through the website. Import updates matching IDs; new records are added. Export a backup before importing.
- `starter-trips.json` contains travel dates and financial summaries. Keep the repository private, or keep this file **off GitHub** and only on your own device.
- Data changes on the website do not require GitHub commits or redeployment.

## File structure

- `public/`: HTML, CSS, JS and Cloudflare Pages routing
- `functions/`: Pages Functions for authentication and trip CRUD
- `schema.sql`: D1 schema, run once in Cloudflare D1 console
- `starter-trips.json`: importable 2027 trip schedule (remove before uploading to a public repository)

## Troubleshooting

- **503 Not configured**: check D1 binding `DB` and both encrypted secrets; redeploy.
- **503 Database not initialized**: execute `schema.sql` in the D1 console.
- **Login loops**: clear cookies, check `SESSION_SECRET`, and ensure the deployed Pages Functions are enabled.
- **404 on /api/trips**: check that the `functions/` directory is at the repository root and the Pages build output is `public`.
