-- Create enum types for alerts and patterns
CREATE TYPE public.alert_type AS ENUM ('theft', 'geofence', 'jamming', 'tamper', 'anomaly', 'battery_low', 'sos');
CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.device_status AS ENUM ('online', 'offline', 'maintenance');

-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imei TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  battery_percentage INTEGER DEFAULT 100 CHECK (battery_percentage >= 0 AND battery_percentage <= 100),
  tamper_status BOOLEAN DEFAULT false,
  jamming_status BOOLEAN DEFAULT false,
  status device_status DEFAULT 'offline',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create locations table for GPS tracking data
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  altitude DECIMAL(8, 2),
  heading DECIMAL(5, 2),
  accuracy DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geofences table
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  polygon JSONB NOT NULL, -- GeoJSON polygon
  on_enter TEXT, -- action to take when entering
  on_exit TEXT, -- action to take when exiting
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patterns table for AI learning
CREATE TABLE public.patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  weekday INTEGER CHECK (weekday >= 0 AND weekday <= 6), -- 0 = Sunday
  time_range TSRANGE,
  route_summary JSONB,
  frequency INTEGER DEFAULT 1,
  anomaly_score DECIMAL(3, 2) DEFAULT 0.0 CHECK (anomaly_score >= 0.0 AND anomaly_score <= 1.0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for devices
CREATE POLICY "Users can view their own devices" 
ON public.devices 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own devices" 
ON public.devices 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own devices" 
ON public.devices 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own devices" 
ON public.devices 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Create RLS policies for locations
CREATE POLICY "Users can view locations for their devices" 
ON public.locations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.devices 
  WHERE devices.id = locations.device_id 
  AND devices.owner_id = auth.uid()
));

CREATE POLICY "System can insert location data" 
ON public.locations 
FOR INSERT 
WITH CHECK (true); -- Allow system to insert location data

-- Create RLS policies for alerts
CREATE POLICY "Users can view alerts for their devices" 
ON public.alerts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.devices 
  WHERE devices.id = alerts.device_id 
  AND devices.owner_id = auth.uid()
));

CREATE POLICY "Users can update alerts for their devices" 
ON public.alerts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.devices 
  WHERE devices.id = alerts.device_id 
  AND devices.owner_id = auth.uid()
));

CREATE POLICY "System can create alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for geofences
CREATE POLICY "Users can manage their own geofences" 
ON public.geofences 
FOR ALL 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Create RLS policies for patterns
CREATE POLICY "Users can view patterns for their devices" 
ON public.patterns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.devices 
  WHERE devices.id = patterns.device_id 
  AND devices.owner_id = auth.uid()
));

CREATE POLICY "System can manage patterns" 
ON public.patterns 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_devices_owner_id ON public.devices(owner_id);
CREATE INDEX idx_locations_device_id ON public.locations(device_id);
CREATE INDEX idx_locations_timestamp ON public.locations(timestamp DESC);
CREATE INDEX idx_alerts_device_id ON public.alerts(device_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_geofences_owner_id ON public.geofences(owner_id);
CREATE INDEX idx_patterns_device_id ON public.patterns(device_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON public.geofences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patterns_updated_at
  BEFORE UPDATE ON public.patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for live updates
ALTER TABLE public.locations REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;