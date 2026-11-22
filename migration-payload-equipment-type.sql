ALTER TABLE caravan_payload_items ADD COLUMN equipment_type TEXT NOT NULL DEFAULT 'trip' CHECK (equipment_type IN ('fitted','stored','trip'));
