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

if (!SUPABASE_URL?.trim() || !SUPABASE_ANON_KEY?.trim()) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabaseClientPath = path.join(__dirname, 'supabaseClient.js');
const content = fs.readFileSync(supabaseClientPath, 'utf8');

// Use JSON.stringify to properly escape special characters in the values
const escapedUrl = JSON.stringify(SUPABASE_URL);
const escapedKey = JSON.stringify(SUPABASE_ANON_KEY);

// Replace the placeholders with actual values (already properly escaped)
const updatedContent = content
  .replace(
    /const SUPABASE_URL = ['"]<REDACTED_SUPABASE_URL>['"];/,
    `const SUPABASE_URL = ${escapedUrl};`
  )
  .replace(
    /const SUPABASE_ANON_KEY = ['"]<REDACTED_SUPABASE_ANON_KEY>['"];/,
    `const SUPABASE_ANON_KEY = ${escapedKey};`
  );

fs.writeFileSync(supabaseClientPath, updatedContent, 'utf8');

console.log('✓ Secrets injected successfully into supabaseClient.js');
console.log('  SUPABASE_URL: [CONFIGURED]');
console.log('  SUPABASE_ANON_KEY: [CONFIGURED]');
