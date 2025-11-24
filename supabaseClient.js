// supabaseClient.js
// NOTE: Secrets are injected at build time by the GitHub Actions workflow.
// DO NOT commit actual secret values to this file.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = '<REDACTED_SUPABASE_URL>';
const SUPABASE_ANON_KEY = '<REDACTED_SUPABASE_ANON_KEY>';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
