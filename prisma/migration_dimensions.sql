-- Migration: Add default dimension fields to categories
-- Run this in Railway PostgreSQL Data tab

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "defaultWeight" INTEGER NOT NULL DEFAULT 300;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "defaultHeight" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "defaultWidth" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "defaultLength" INTEGER NOT NULL DEFAULT 20;
