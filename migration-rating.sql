-- Run once in Cloudflare D1 production console.
ALTER TABLE trips ADD COLUMN rating INTEGER NOT NULL DEFAULT 0;
