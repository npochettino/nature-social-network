-- Insert sample profiles (these will be created when users sign up)
-- This is just for reference - actual profiles are created via the trigger

-- Sample posts (you can run this after creating some test users)
-- Note: Replace the user_id values with actual user IDs from your auth.users table

/*
INSERT INTO posts (user_id, image_url, image_path, species_name, scientific_name, category, habitat, description, conservation_status, confidence, caption) VALUES
(
  'your-user-id-here',
  'https://example.com/cardinal.jpg',
  'posts/cardinal.jpg',
  'Northern Cardinal',
  'Cardinalis cardinalis',
  'bird',
  'Woodlands, gardens, shrublands, and wetlands',
  'A vibrant red songbird native to North America. Males are bright red while females are brown with red tinges.',
  'Least Concern',
  0.92,
  'Beautiful cardinal spotted in my backyard this morning! 🐦'
);
*/
