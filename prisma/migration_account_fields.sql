-- Migration: Add birthDate and gender fields to customers
-- Run this in Railway PostgreSQL Data tab

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "gender" TEXT;
