// supabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://saqodazywonhbxuxwfjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcW9kYXp5d29uaGJ4dXh3ZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDI3NzQsImV4cCI6MjA3NjgxODc3NH0.2BWtPSaHCVMabhyEuAJ48brrhWOV5K-uyr7FZ8ivC1I'; // from Supabase dashboard

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
