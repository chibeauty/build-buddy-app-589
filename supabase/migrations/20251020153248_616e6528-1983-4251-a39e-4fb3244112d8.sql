-- Create AI credit packages table
CREATE TABLE public.ai_credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_credit_packages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active packages
CREATE POLICY "Active credit packages are viewable by everyone"
ON public.ai_credit_packages
FOR SELECT
USING (is_active = true);

-- Add updated_at trigger
CREATE TRIGGER update_ai_credit_packages_updated_at
BEFORE UPDATE ON public.ai_credit_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default credit packages
INSERT INTO public.ai_credit_packages (name, description, credits, price, currency) VALUES
('Starter Pack', '100 AI credits for quick top-ups', 100, 999, 'NGN'),
('Power Pack', '500 AI credits - Best value!', 500, 3999, 'NGN'),
('Pro Pack', '1000 AI credits for heavy users', 1000, 6999, 'NGN'),
('Enterprise Pack', '5000 AI credits for teams', 5000, 29999, 'NGN');