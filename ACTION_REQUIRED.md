# IMPORTANT: Action Required to Get Your Website Back Online

## Summary

Your website is currently non-functional because the Supabase secrets were removed from the source code but no replacement mechanism was in place. This PR fixes that by implementing a secure deployment process using GitHub Actions secrets.

## What Was Changed

### 1. Created `inject-secrets.js`
A Node.js script that runs during deployment to inject your Supabase credentials into the code. This script:
- Replaces placeholder values with your actual credentials
- Validates that secrets are properly configured
- Uses secure practices to prevent injection attacks

### 2. Updated `supabaseClient.js`
Simplified the file to use placeholder values that get replaced during deployment:
```javascript
const SUPABASE_URL = '<REDACTED_SUPABASE_URL>';
const SUPABASE_ANON_KEY = '<REDACTED_SUPABASE_ANON_KEY>';
```

### 3. Updated GitHub Actions Workflow
The workflow now:
- Reads secrets from GitHub repository settings
- Injects them into your code
- Deploys to GitHub Pages automatically

### 4. Created Documentation
- `DEPLOYMENT.md` - Comprehensive deployment guide with troubleshooting

## What You Need to Do (REQUIRED)

To get your website back online, you MUST add your Supabase credentials to GitHub secrets:

### Step 1: Find Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy these two values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **Project API keys** → **anon/public** (a long string starting with `eyJ...`)

### Step 2: Add Secrets to GitHub

1. Go to your repository: https://github.com/BlossomMarquez/mleph
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add the first secret:
   - **Name:** `SUPABASE_URL`
   - **Secret:** Paste your Supabase Project URL
   - Click **Add secret**
6. Click **New repository secret** again
7. Add the second secret:
   - **Name:** `SUPABASE_ANON_KEY`
   - **Secret:** Paste your Supabase anon/public key
   - Click **Add secret**

### Step 3: Enable GitHub Pages with Actions

1. While still in **Settings**, click **Pages** in the left sidebar
2. Under **Source**, select **GitHub Actions** (NOT "Deploy from a branch")
3. Save the settings

### Step 4: Trigger Deployment

Option A: Merge this PR to main branch
- Once merged, GitHub Actions will automatically deploy your site

Option B: Manual trigger
1. Go to the **Actions** tab
2. Click **pages-build-deployment** in the left sidebar
3. Click **Run workflow** button
4. Click **Run workflow** in the dropdown
5. Wait for it to complete (should take 1-2 minutes)

### Step 5: Verify It Works

1. After the workflow completes, visit: https://blossommarquez.github.io/mleph/
2. Your website should be back online!
3. Test uploading an image to ensure Supabase connection works

## Troubleshooting

### "Invalid API key" or similar errors
- Double-check that both secrets are added correctly
- Make sure there are no extra spaces in the secret values
- Verify you copied the correct values from Supabase

### Workflow fails with "Missing required environment variables"
- The GitHub secrets were not configured
- Go back to Step 2 and add both secrets

### Changes not appearing
- Wait a few minutes for GitHub Pages to update
- Try a hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Check the Actions tab to ensure deployment succeeded

## Security Notes

✅ **Safe:** Your Supabase credentials are stored securely in GitHub secrets
✅ **Safe:** Credentials are only injected during deployment, never committed to code
✅ **Safe:** The anon/public key is designed to be used in browser JavaScript
✅ **Safe:** Row Level Security (RLS) in Supabase protects your data

## Questions?

See `DEPLOYMENT.md` for more detailed information, or check the PR description for technical details.

---

**Remember:** Your website will NOT work until you complete the steps above!
