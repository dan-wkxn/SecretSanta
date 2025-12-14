// Supabase Configuration
// Replace these with your actual Supabase project credentials
// You can find them in your Supabase project settings > API

const SUPABASE_URL = 'https://djgenlcatmxmjwlgjmto.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZ2VubGNhdG14bWp3bGdqbXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2Mzg0MDQsImV4cCI6MjA4MTIxNDQwNH0.X_zS_eTjEOTBTg9RPtSonkJSWce64jK0DIf8fh4IUdQ';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

