-- Migration: Add ProductBadge enum and badge field to products
-- Run this in Railway PostgreSQL Data tab

-- 1. Create the enum type
DO $$ BEGIN
  CREATE TYPE "ProductBadge" AS ENUM ('NONE', 'MAIS_VENDIDO', 'NOVIDADE', 'PROMOCAO', 'EXCLUSIVO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add the badge column with default NONE
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badge" "ProductBadge" NOT NULL DEFAULT 'NONE';
