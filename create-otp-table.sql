-- Create OTP codes table for secure storage
CREATE TABLE IF NOT EXISTS otp_codes (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_expires 
ON otp_codes (phone, expires_at);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage OTP codes
CREATE POLICY "Allow service role to manage otp_codes"
  ON otp_codes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clean up expired OTP codes (optional - can be run periodically)
-- DELETE FROM otp_codes WHERE expires_at < NOW();
