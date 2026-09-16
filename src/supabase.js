import { createClient } from '@supabase/supabase-js';

// Access environment variables using import.meta.env for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; 
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("https://umyqolmkfuwajfjswdlj.supabase.co:", supabaseUrl);
  console.error("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteXFvbG1rZnV3YWpmanN3ZGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyODk2MjMsImV4cCI6MjEwNDg2NTYyM30.D2GWLR8LMDP4r3Tqh_aAuvx2aYhAo3hOLnLIvhyKOu8:", supabaseKey);
  throw new Error("Supabase URL and Anon Key are required. Check your .env file and ensure they are prefixed with VITE_ and the dev server was restarted.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);