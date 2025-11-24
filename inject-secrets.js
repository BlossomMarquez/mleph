#!/usr/bin/env node

/**
 * inject-secrets.js
 * 
 * This script injects Supabase configuration at build time by replacing
 * placeholders in supabaseClient.js with actual values from environment variables.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseClientPath = path.join(__dirname, 'supabaseClient.js');
const content = fs.readFileSync(supabaseClientPath, 'utf8');

// Replace the placeholders with actual values
const updatedContent = content
  .replace(
    /const SUPABASE_URL = ['"]<REDACTED_SUPABASE_URL>['"];/,
    `const SUPABASE_URL = '${SUPABASE_URL}';`
  )
  .replace(
    /const SUPABASE_ANON_KEY = ['"]<REDACTED_SUPABASE_ANON_KEY>['"];/,
    `const SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}';`
  );

fs.writeFileSync(supabaseClientPath, updatedContent, 'utf8');

console.log('✓ Secrets injected successfully into supabaseClient.js');
console.log(`  SUPABASE_URL: ${SUPABASE_URL.substring(0, 30)}...`);
console.log(`  SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
