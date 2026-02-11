-- Add nutrition goals to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS calorie_goal numeric(6,2) DEFAULT 2000,
ADD COLUMN IF NOT EXISTS protein_goal numeric(5,2) DEFAULT 50,
ADD COLUMN IF NOT EXISTS carbs_goal numeric(6,2) DEFAULT 250,
ADD COLUMN IF NOT EXISTS fats_goal numeric(5,2) DEFAULT 70;