-- Create translations cache table
CREATE TABLE IF NOT EXISTS translation_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_text TEXT NOT NULL,
  source_language VARCHAR(10) NOT NULL DEFAULT 'auto',
  target_language VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  usage_count INTEGER DEFAULT 1
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS translation_cache_lookup_idx ON translation_cache(source_text, source_language, target_language);
CREATE INDEX IF NOT EXISTS translation_cache_expires_idx ON translation_cache(expires_at);
CREATE INDEX IF NOT EXISTS translation_cache_usage_idx ON translation_cache(usage_count DESC);

-- Create unique constraint to prevent duplicate translations
CREATE UNIQUE INDEX IF NOT EXISTS translation_cache_unique_idx ON translation_cache(
  md5(source_text), source_language, target_language
);
