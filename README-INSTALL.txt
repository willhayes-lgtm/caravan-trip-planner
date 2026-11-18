CARAVAN PLANNER UPDATE — PHOTOS, MILEAGE & THINGS TO DO

IMPORTANT: Back up your data first (Export backup in the existing planner).
This update requires a one-time migration of the existing Cloudflare D1 database.
Do not replace or delete your D1 database. Do not rerun migration.sql after it succeeds.

1. In Cloudflare dashboard, find the D1 database bound as DB to your Pages project.
   Choose the PRODUCTION database and its SQL console.
   Run each of the three ALTER TABLE statements from migration.sql ONCE.
   If you see "duplicate column name", that particular statement was already applied.
   These commands add empty fields; they do not delete existing trip records.

2. In GitHub repository willhayes-lgtm/caravan-trip-planner, replace:
   public/index.html
   public/app.js
   public/style.css
   functions/api/trips.js
   Keep all other files, folders, Pages Functions, secrets and settings unchanged.
   Preserve the folder structure exactly. Commit the changes.

3. In Cloudflare Pages, deploy the latest main commit.
   The Pages build output directory should be public, not /.
   Open the website and refresh; index.html now uses versioned JS/CSS URLs.

4. Edit a trip and paste a direct public HTTPS photo URL, one-way road mileage
   from Lymm Marina, and one activity per line. Save the trip.
   Mileage is manually entered; the website does NOT calculate towing routes.
   Images are URL-linked, not uploaded or automatically sourced.
   Activities are user-entered, not automatically researched.

5. Existing trips initially show a photo placeholder, mileage 'Not set',
   and an empty expandable ideas section until you fill them in.

Note: The annual-leave tile is retained. The app uses an 8-hour working day.
For 2.5 hours of leave, enter 0.3125 days.
