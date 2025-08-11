-- Add language preference to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- Create index for language queries
CREATE INDEX IF NOT EXISTS profiles_preferred_language_idx ON profiles(preferred_language);

-- Update existing profiles to have default language
UPDATE profiles SET preferred_language = 'en' WHERE preferred_language IS NULL;
