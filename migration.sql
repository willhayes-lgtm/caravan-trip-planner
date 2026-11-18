-- Run once against your existing PRODUCTION Cloudflare D1 database.
ALTER TABLE trips ADD COLUMN image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE trips ADD COLUMN mileage REAL;
ALTER TABLE trips ADD COLUMN activities TEXT NOT NULL DEFAULT '';
