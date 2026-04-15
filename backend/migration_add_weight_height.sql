-- AyuAdhar: Add weight_kg and height_cm columns to patients table
-- Run this in your Supabase SQL editor

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS weight_kg FLOAT,
  ADD COLUMN IF NOT EXISTS height_cm FLOAT;
