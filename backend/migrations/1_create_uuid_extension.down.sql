-- Migration: 1_create_uuid_extension
-- Description: Rollback initial schema setup with UUID extension
-- Direction: Down

-- Remove UUID extension (only if no tables are using it)
-- Note: This will fail if any tables are still using UUID types
DROP EXTENSION IF EXISTS "uuid-ossp";