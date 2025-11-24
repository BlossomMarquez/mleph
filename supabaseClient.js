// supabaseClient.js
// NOTE: Secrets were removed from source. Set actual values at runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = process.env.SUPABASE_URL || '<REDACTED_SUPABASE_URL>';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '<REDACTED_SUPABASE_ANON_KEY>';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// For browser builds, inject runtime values into `window.__SUPABASE_CONFIG__` and
// use a small wrapper at build/deploy time to replace placeholders.
