-- Update handle_new_user function to include health parameters
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, age, weight, height, allergies)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'age')::integer,
    (NEW.raw_user_meta_data->>'weight')::numeric,
    (NEW.raw_user_meta_data->>'height')::numeric,
    NEW.raw_user_meta_data->>'allergies'
  );
  RETURN NEW;
END;
$$;