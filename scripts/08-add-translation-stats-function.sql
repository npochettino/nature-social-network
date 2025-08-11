-- Create a function to get translation statistics
CREATE OR REPLACE FUNCTION get_translation_stats()
RETURNS TABLE (
  target_language VARCHAR(10),
  translation_count BIGINT,
  total_usage BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.target_language,
    COUNT(*) as translation_count,
    SUM(tc.usage_count) as total_usage
  FROM translation_cache tc
  GROUP BY tc.target_language
  ORDER BY total_usage DESC;
END;
$$ LANGUAGE plpgsql;
