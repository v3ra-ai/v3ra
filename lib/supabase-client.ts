import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quuuhdbozcmhkwzhamuh.supabase.co';  // Replace with your Supabase URL
const supabaseAnonKey = 'your-anon-key';                    // Replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);