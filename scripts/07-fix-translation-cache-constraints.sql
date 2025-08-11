-- Fix translation cache constraints
DROP INDEX IF EXISTS translation_cache_unique_idx;

-- Create a proper unique constraint that matches the API usage
ALTER TABLE translation_cache 
ADD CONSTRAINT translation_cache_unique_constraint 
UNIQUE (source_text, source_language, target_language);

-- Add a hash index for performance on large texts
CREATE INDEX IF NOT EXISTS translation_cache_hash_idx ON translation_cache(
  md5(source_text), source_language, target_language
);
