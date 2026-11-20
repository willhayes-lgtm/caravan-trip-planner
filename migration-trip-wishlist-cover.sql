-- Run once on production D1, after backup.
ALTER TABLE trips ADD COLUMN checkin_time TEXT DEFAULT '';
ALTER TABLE trips ADD COLUMN checkout_time TEXT DEFAULT '';
ALTER TABLE wishlist ADD COLUMN address TEXT DEFAULT '';
ALTER TABLE wishlist ADD COLUMN distance_miles REAL;
ALTER TABLE wishlist ADD COLUMN drive_minutes REAL;
ALTER TABLE caravan_profile ADD COLUMN insurance_provider TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN insurance_policy_number TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN insurance_start_date TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN insurance_expiry_date TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN insurance_contact TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN insurance_details TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN breakdown_provider TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN breakdown_policy_number TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN breakdown_start_date TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN breakdown_expiry_date TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN breakdown_contact TEXT DEFAULT '';
ALTER TABLE caravan_profile ADD COLUMN breakdown_details TEXT DEFAULT '';
