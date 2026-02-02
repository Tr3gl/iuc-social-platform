# Deployment Guide

This guide covers how to deploy the Course Feedback Platform to Vercel and set up the necessary environment configurations.

## 1. Prepare your Identity (First time only)

Since you are not a coder, your computer might not know who you are yet. Run these two commands first (replace with your info):

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"
```

## 2. Push to GitHub

Now, follow these steps exactly. Copy and paste them one by one:

1. **Initialize Git** (Tells the computer to track changes):
   ```bash
   git init
   ```

2. **Add all files**:
   ```bash
   git add .
   ```

3. **Save the changes** (The "Commit"):
   ```bash
   git commit -m "Initial commit"
   ```

4. **Connect to your GitHub**:
   ```bash
   git remote add origin https://github.com/Tr3gl/iuc-social-platform.git
   ```

5. **Upload the code**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

## 2. Deploy to Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your GitHub repository.
4.  **Framework Preset**: Next.js (should be auto-detected).
5.  **Root Directory**: `./` (default).
6.  **Environment Variables**: You must add the following variables from your Supabase project:
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

    > You can find these in your Supabase Dashboard under **Project Settings** > **API**.

7.  Click **Deploy**.

## 3. Configure Supabase

After your Vercel deployment is live, you need to update Supabase to allow authentication from your new domain.

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Authentication** > **URL Configuration**.
3.  **Site URL**: Set this to your main Vercel URL (e.g., `https://your-project.vercel.app`).
4.  **Redirect URLs**: Add your Vercel URL here as well. If you have a custom domain, add that too.
    *   Example: `https://your-project.vercel.app/**`

## 4. Verification

1.  Visit your Vercel URL.
2.  Try to sign in with an eligible email.
3.  Verify that you receive the magic link and can log in successfully.
