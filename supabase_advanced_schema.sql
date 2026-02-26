-- ============================================================
-- BMS Dashboard – Advanced Features Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── 1. Maintenance Logs ──────────────────────────────────────────────────

CREATE TYPE bms_maintenance_type AS ENUM (
  'CELL_INSPECTION',
  'BMS_CALIBRATION',
  'COOLING_SERVICE',
  'CONNECTOR_CHECK',
  'FIRMWARE_UPDATE',
  'FULL_SERVICE',
  'OTHER'
);

CREATE TABLE bms_maintenance_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id        TEXT NOT NULL REFERENCES bms_devices(device_id) ON DELETE CASCADE,
  maintenance_type bms_maintenance_type NOT NULL,
  description      TEXT NOT NULL,
  performed_by     TEXT NOT NULL,
  performed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_due_at      TIMESTAMPTZ,
  cost             NUMERIC(12, 2),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_device ON bms_maintenance_logs(device_id, performed_at DESC);

-- RLS
ALTER TABLE bms_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON bms_maintenance_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ─── 2. Warranty Information ──────────────────────────────────────────────

CREATE TYPE bms_warranty_coverage AS ENUM (
  'FULL',
  'LIMITED',
  'CELL_ONLY',
  'ELECTRONICS_ONLY',
  'LABOR_ONLY'
);

CREATE TABLE bms_warranty_info (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id          TEXT NOT NULL REFERENCES bms_devices(device_id) ON DELETE CASCADE,
  warranty_provider  TEXT NOT NULL,
  warranty_number    TEXT,
  start_date         DATE NOT NULL,
  end_date           DATE NOT NULL,
  coverage_type      bms_warranty_coverage NOT NULL DEFAULT 'FULL',
  max_claim_amount   NUMERIC(14, 2),
  contact_email      TEXT,
  contact_phone      TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warranty_device ON bms_warranty_info(device_id, end_date DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION bms_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER warranty_updated_at
  BEFORE UPDATE ON bms_warranty_info
  FOR EACH ROW EXECUTE FUNCTION bms_set_updated_at();

-- RLS
ALTER TABLE bms_warranty_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON bms_warranty_info
  FOR ALL USING (true) WITH CHECK (true);

-- Convenience view: expiry status
CREATE VIEW vw_warranty_status AS
SELECT *,
  CASE
    WHEN end_date < CURRENT_DATE THEN 'EXPIRED'
    WHEN end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
    ELSE 'ACTIVE'
  END AS warranty_status,
  (end_date - CURRENT_DATE) AS days_remaining
FROM bms_warranty_info;

-- ─── 3. Geofence Zones ────────────────────────────────────────────────────

CREATE TABLE bms_geofence_zones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id      TEXT NOT NULL REFERENCES bms_devices(device_id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  center_lat     DOUBLE PRECISION NOT NULL,
  center_lng     DOUBLE PRECISION NOT NULL,
  radius_meters  INTEGER NOT NULL DEFAULT 500 CHECK (radius_meters > 0),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_geofence_device ON bms_geofence_zones(device_id);

-- RLS
ALTER TABLE bms_geofence_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON bms_geofence_zones
  FOR ALL USING (true) WITH CHECK (true);

-- ─── 4. Geo Alerts ────────────────────────────────────────────────────────

CREATE TYPE bms_geo_alert_type AS ENUM (
  'GEOFENCE_EXIT',
  'GEOFENCE_ENTRY',
  'UNUSUAL_MOVEMENT',
  'RAPID_DISPLACEMENT',
  'STATIONARY_TIMEOUT'
);

CREATE TABLE bms_geo_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id           TEXT NOT NULL REFERENCES bms_devices(device_id) ON DELETE CASCADE,
  alert_type          bms_geo_alert_type NOT NULL,
  triggered_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  speed_kmh           NUMERIC(8, 2),
  geofence_zone_id    UUID REFERENCES bms_geofence_zones(id) ON DELETE SET NULL,
  geofence_zone_name  TEXT,   -- denormalized for fast reads even if zone is deleted
  is_resolved         BOOLEAN NOT NULL DEFAULT false,
  resolved_at         TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_geo_alerts_device ON bms_geo_alerts(device_id, triggered_at DESC);
CREATE INDEX idx_geo_alerts_unresolved ON bms_geo_alerts(device_id) WHERE is_resolved = false;

-- RLS
ALTER TABLE bms_geo_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON bms_geo_alerts
  FOR ALL USING (true) WITH CHECK (true);

-- ─── 5. Trigger: auto-generate geo alerts from telemetry ─────────────────
-- This trigger runs on every telemetry insert and checks if the device
-- has moved outside any active geofence zone for that device.
-- Formula: Haversine approximation using degrees → meters conversion.

CREATE OR REPLACE FUNCTION bms_check_geofence()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  zone    RECORD;
  dist_m  DOUBLE PRECISION;
BEGIN
  -- Only check if lat/lng are meaningful
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RETURN NEW;
  END IF;

  FOR zone IN
    SELECT * FROM bms_geofence_zones
    WHERE device_id = NEW.device_id AND is_active = true
  LOOP
    -- Approximate distance in meters (flat-earth, fine for small radii)
    dist_m := sqrt(
      power((NEW.latitude  - zone.center_lat) * 111320.0, 2) +
      power((NEW.longitude - zone.center_lng) * 111320.0 * cos(radians(zone.center_lat)), 2)
    );

    IF dist_m > zone.radius_meters THEN
      -- Insert alert only if not already open for this zone
      INSERT INTO bms_geo_alerts (
        device_id, alert_type, triggered_at,
        latitude, longitude,
        geofence_zone_id, geofence_zone_name,
        is_resolved
      )
      SELECT
        NEW.device_id, 'GEOFENCE_EXIT', NEW.created_at,
        NEW.latitude, NEW.longitude,
        zone.id, zone.name,
        false
      WHERE NOT EXISTS (
        SELECT 1 FROM bms_geo_alerts
        WHERE device_id = NEW.device_id
          AND geofence_zone_id = zone.id
          AND alert_type = 'GEOFENCE_EXIT'
          AND is_resolved = false
          AND triggered_at > now() - INTERVAL '1 hour'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_geofence_check
  AFTER INSERT ON bms_telemetry
  FOR EACH ROW EXECUTE FUNCTION bms_check_geofence();

-- ─── 6. Rapid displacement alert trigger ─────────────────────────────────
-- Fires when device moves > 2 km in < 5 minutes (theft indicator)

CREATE OR REPLACE FUNCTION bms_check_rapid_displacement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  prev RECORD;
  dist_m DOUBLE PRECISION;
  secs   DOUBLE PRECISION;
BEGIN
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN RETURN NEW; END IF;

  SELECT latitude, longitude, created_at INTO prev
  FROM bms_telemetry
  WHERE device_id = NEW.device_id
    AND created_at < NEW.created_at
    AND latitude IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN RETURN NEW; END IF;

  secs := EXTRACT(EPOCH FROM (NEW.created_at - prev.created_at));
  IF secs <= 0 OR secs > 300 THEN RETURN NEW; END IF;  -- only check within 5 min window

  dist_m := sqrt(
    power((NEW.latitude  - prev.latitude)  * 111320.0, 2) +
    power((NEW.longitude - prev.longitude) * 111320.0 * cos(radians(prev.latitude)), 2)
  );

  IF dist_m > 2000 THEN  -- > 2 km
    INSERT INTO bms_geo_alerts (
      device_id, alert_type, triggered_at, latitude, longitude,
      speed_kmh, is_resolved
    ) VALUES (
      NEW.device_id, 'RAPID_DISPLACEMENT', NEW.created_at,
      NEW.latitude, NEW.longitude,
      round(((dist_m / secs) * 3.6)::numeric, 2),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rapid_displacement
  AFTER INSERT ON bms_telemetry
  FOR EACH ROW EXECUTE FUNCTION bms_check_rapid_displacement();

-- ─── 7. Useful views ──────────────────────────────────────────────────────

-- Next scheduled maintenance per device
CREATE VIEW vw_next_maintenance AS
SELECT DISTINCT ON (device_id)
  device_id,
  id,
  maintenance_type,
  description,
  next_due_at,
  (next_due_at - now()) AS time_until_due
FROM bms_maintenance_logs
WHERE next_due_at IS NOT NULL AND next_due_at > now()
ORDER BY device_id, next_due_at ASC;

-- Unresolved geo alerts summary per device
CREATE VIEW vw_unresolved_geo_alerts AS
SELECT
  device_id,
  count(*) FILTER (WHERE alert_type = 'GEOFENCE_EXIT')       AS geofence_exits,
  count(*) FILTER (WHERE alert_type = 'RAPID_DISPLACEMENT')  AS rapid_displacements,
  count(*) FILTER (WHERE alert_type = 'UNUSUAL_MOVEMENT')    AS unusual_movements,
  count(*)                                                    AS total_unresolved,
  max(triggered_at)                                          AS last_alert_at
FROM bms_geo_alerts
WHERE is_resolved = false
GROUP BY device_id;
