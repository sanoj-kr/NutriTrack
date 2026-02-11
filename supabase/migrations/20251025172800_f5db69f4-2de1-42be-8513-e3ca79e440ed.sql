-- Add health parameters to profiles table
ALTER TABLE public.profiles
ADD COLUMN age INTEGER,
ADD COLUMN weight NUMERIC(5,2),
ADD COLUMN height NUMERIC(5,2),
ADD COLUMN bmi NUMERIC(4,2),
ADD COLUMN allergies TEXT;

-- Create function to calculate BMI
CREATE OR REPLACE FUNCTION public.calculate_bmi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL AND NEW.height > 0 THEN
    -- BMI = weight(kg) / (height(m))^2
    -- height is stored in cm, so divide by 100 to convert to meters
    NEW.bmi := ROUND((NEW.weight / POWER(NEW.height / 100, 2))::numeric, 2);
  ELSE
    NEW.bmi := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate BMI on insert/update
CREATE TRIGGER calculate_bmi_trigger
BEFORE INSERT OR UPDATE OF weight, height ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.calculate_bmi();