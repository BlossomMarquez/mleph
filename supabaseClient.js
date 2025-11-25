
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = process.env.SUPABASE_URL || '<REDACTED_SUPABASE_URL>';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '<REDACTED_SUPABASE_ANON_KEY>';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
