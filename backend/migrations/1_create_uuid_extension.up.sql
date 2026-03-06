-- Migration: 1_create_uuid_extension
-- Description: Initial database schema setup with UUID extension
-- Direction: Up

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";