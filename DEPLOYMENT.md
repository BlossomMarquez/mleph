# Deployment Instructions

This document explains how to set up and deploy the MLEPH website with Supabase secrets managed through GitHub Actions.

## Overview

The website uses Supabase for database and storage. Secrets are now managed securely through GitHub Actions secrets and injected at deployment time, rather than being committed to the repository.

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. **SUPABASE_URL** - Your Supabase project URL
2. **SUPABASE_ANON_KEY** - Your Supabase anonymous/public key

### How to Add GitHub Secrets

1. Go to your repository on GitHub: `https://github.com/BlossomMarquez/mleph`
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Click on **New repository secret**
5. Add each secret:
   - Name: `SUPABASE_URL`
   - Value: Your Supabase URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - Click **Add secret**
6. Repeat for `SUPABASE_ANON_KEY`

### Finding Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** - This is your `SUPABASE_URL`
   - **Project API keys** → **anon/public** - This is your `SUPABASE_ANON_KEY`

## GitHub Pages Configuration

Make sure GitHub Pages is enabled for your repository:

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
3. Save the settings

## Deployment Process

Once the secrets are configured:

1. Push changes to the `main` branch (or manually trigger the workflow)
2. GitHub Actions will:
   - Check out the code
   - Install dependencies
   - Inject the secrets into `supabaseClient.js`
   - Deploy to GitHub Pages
3. Your website will be live at: `https://blossommarquez.github.io/mleph/`

## Manual Deployment

You can manually trigger a deployment:

1. Go to **Actions** tab in your repository
2. Click on **pages-build-deployment** workflow
3. Click **Run workflow** → **Run workflow**

## Security Notes

- Never commit actual Supabase credentials to the repository
- The `supabaseClient.js` file contains placeholder values (`<REDACTED_SUPABASE_URL>`)
- Real credentials are only injected during deployment by GitHub Actions
- The deployed site will have the actual credentials embedded in the JavaScript files (this is safe for Supabase's anonymous/public keys which are designed to be used in browsers)

## Troubleshooting

### Website shows "Invalid API key" or similar errors

- Check that you've added both `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets to GitHub
- Verify the secret values are correct (no extra spaces, complete values)
- Re-run the workflow: **Actions** → **pages-build-deployment** → **Run workflow**

### Workflow fails with "Missing required environment variables"

- The GitHub secrets are not configured correctly
- Follow the "How to Add GitHub Secrets" section above

### Changes not appearing on the website

- Check the **Actions** tab to see if the deployment succeeded
- It can take a few minutes for GitHub Pages to update
- Try a hard refresh in your browser (Ctrl+F5 or Cmd+Shift+R)

## Local Development

For local development, you can temporarily edit `supabaseClient.js` to add your credentials directly (but never commit these changes):

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

Remember to revert these changes before committing!
