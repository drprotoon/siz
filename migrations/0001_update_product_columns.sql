-- Migration to update product table column names to match database structure
-- This migration renames columns to match the lowercase naming convention

-- Rename compareatprice to compareatprice
ALTER TABLE "products" RENAME COLUMN "compareatprice" TO "compareatprice";

-- Rename how_to_use to howtouse
ALTER TABLE "products" RENAME COLUMN "how_to_use" TO "howtouse";

-- Rename reviewcount to reviewcount
ALTER TABLE "products" RENAME COLUMN "reviewcount" TO "reviewcount";

-- Rename created_at to createdat
ALTER TABLE "products" RENAME COLUMN "created_at" TO "createdat";
