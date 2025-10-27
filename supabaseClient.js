// supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://saqodazywonhbxuxwfjm.supabase.co';
const SUPABASE_ANON_KEY = 'literal:[REDACTED_SUPABASE_ANON_KEY]'; // from Supabase dashboard

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
