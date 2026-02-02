# Deployment Guide

## Quick Start (Under 1 Hour)

This guide will help you deploy the platform from scratch in under one hour.

### Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account (free tier)
- [ ] Vercel account (free tier)
- [ ] Git installed
- [ ] Domain name (optional)

---

## Part 1: Supabase Setup (20 minutes)

### Step 1: Create Supabase Project (5 min)

1. Go to https://supabase.com
2. Click "Start your project"
3. Create a new organization (if needed)
4. Click "New Project"
5. Fill in:
   - Name: `course-feedback` (or your choice)
   - Database Password: (generate strong password, save it!)
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for database provisioning

### Step 2: Get API Credentials (2 min)

1. Go to Project Settings (gear icon) > API
2. Copy and save:
   - `Project URL` (looks like: https://xxxxx.supabase.co)
   - `anon public` key (long string starting with eyJ...)
3. Keep these safe - you'll need them later

### Step 3: Run Database Schema (10 min)

1. Go to SQL Editor (left sidebar)
2. Click "New query"
3. Copy entire contents of `supabase/schema.sql`
4. Paste into SQL editor
5. Click "Run" (bottom right)
6. Wait for "Success" message
7. Verify tables created:
   - Go to Table Editor
   - You should see: faculties, courses, instructors, course_instructors, reviews, files

### Step 4: Seed Initial Data (3 min)

1. In SQL Editor, create new query
2. Copy contents of `supabase/seed.sql`
3. Paste and run
4. Verify: Go to Table Editor > faculties
5. You should see 10 sample faculties

### Step 5: Configure Storage (5 min)

1. Go to Storage (left sidebar)
2. Click "Create new bucket"
3. Name: `course-files`
4. Make it **public**
5. Click "Create bucket"
6. Go to bucket > Policies
7. Add policy for uploads:
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'course-files'
   );
   ```

### Step 6: Configure Authentication (5 min)

1. Go to Authentication > Providers
2. Enable "Email" provider
3. Disable "Confirm email" (we use magic links only)
4. Save changes
5. Go to Authentication > Email Templates
6. Customize "Magic Link" template (optional):
   - Make it university-themed
   - Add university logo
7. In URL Configuration:
   - Site URL: `http://localhost:3000` (for now)
   - Redirect URLs: `http://localhost:3000/auth/callback`

**Supabase setup complete!** ✓

---

## Part 2: Local Development (15 minutes)

### Step 1: Clone/Setup Project (5 min)

```bash
# If from GitHub
git clone <your-repo-url>
cd course-feedback-platform

# Install dependencies
npm install
```

### Step 2: Configure Environment (2 min)

1. Create `.env.local` file in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

2. Replace with YOUR Supabase credentials from Part 1, Step 2

### Step 3: Test Locally (8 min)

```bash
npm run dev
```

1. Open http://localhost:3000
2. You should see the homepage with faculties
3. Test authentication:
   - Click "Giriş Yap"
   - Enter: `test@ogr.iuc.edu.tr`
   - Check Supabase logs: Authentication > Logs
   - You should see magic link sent
4. Click link in email (check spam if not in inbox)
5. You should be signed in!

**Local development working!** ✓

---

## Part 3: Vercel Deployment (15 minutes)

### Step 1: Prepare for Deployment (3 min)

1. Commit all changes:
```bash
git add .
git commit -m "Initial deployment"
```

2. Push to GitHub:
```bash
git push origin main
```

### Step 2: Deploy to Vercel (7 min)

1. Go to https://vercel.com
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: (your Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (your Supabase key)
6. Click "Deploy"
7. Wait 2-3 minutes for build

### Step 3: Configure Production URLs (5 min)

1. Once deployed, copy your Vercel URL (e.g., `your-app.vercel.app`)
2. Go back to Supabase
3. Authentication > URL Configuration:
   - Site URL: `https://your-app.vercel.app`
   - Add to Redirect URLs: `https://your-app.vercel.app/auth/callback`
4. Save changes

### Step 4: Test Production (3 min)

1. Visit your Vercel URL
2. Test sign in with university email
3. Check magic link works
4. Browse faculties and courses
5. Create a test review

**Production deployment complete!** ✓

---

## Part 4: Customization (10 minutes)

### Customize for Your University

1. **Update Faculties**:
   - Go to Supabase > Table Editor > faculties
   - Edit/add your actual faculties
   - Or run custom SQL:
   ```sql
   DELETE FROM faculties;
   INSERT INTO faculties (name) VALUES
       ('Your Faculty 1'),
       ('Your Faculty 2');
   ```

2. **Add Courses**:
   - Table Editor > courses
   - Add your courses with faculty_id, name, code

3. **Email Domain**:
   - Edit `lib/auth.ts`
   - Change regex: `/^[^\s@]+@ogr\.iuc\.edu\.tr$/`
   - To your domain: `/^[^\s@]+@youruniversity\.edu$/`

4. **Branding**:
   - Edit `app/page.tsx` - change title and description
   - Edit `app/layout.tsx` - update metadata
   - Replace colors in `tailwind.config.js`

**Customization complete!** ✓

---

## Part 5: Going Live (5 minutes)

### Final Checklist

- [ ] All faculties added
- [ ] Sample courses added (at least 3-5)
- [ ] Email domain restriction updated
- [ ] Magic link emails working
- [ ] Test user can sign in
- [ ] Test user can create review
- [ ] Test user can upload file
- [ ] Storage bucket is public
- [ ] No console errors
- [ ] Mobile responsive (test on phone)

### Launch!

1. Share URL with beta testers
2. Monitor Supabase logs for errors
3. Check Vercel analytics for traffic
4. Gather feedback

---

## Troubleshooting

### Magic Links Not Working

**Problem**: Email not received
- Check Supabase email rate limit (60/hour free tier)
- Check spam folder
- Verify email provider allows Supabase
- Check Supabase > Authentication > Logs

**Problem**: Link expired
- Magic links expire in 1 hour
- Request new link

### Database Errors

**Problem**: "permission denied" or RLS errors
- Verify RLS policies are created
- Check user is authenticated
- Review Supabase logs

**Problem**: "duplicate key violation"
- User already reviewed this course
- Check unique constraint on (user_id, course_id)

### File Upload Issues

**Problem**: Upload fails
- Verify bucket name is `course-files`
- Check bucket is public
- Verify file size < 50MB
- Check file type is allowed

### Deployment Issues

**Problem**: Build fails on Vercel
- Check environment variables are set
- Verify TypeScript has no errors
- Check Node.js version (18+)

**Problem**: Site loads but features broken
- Check browser console for errors
- Verify environment variables in Vercel
- Check Supabase URL is correct

---

## Monitoring & Maintenance

### Weekly Tasks

1. Check Supabase > Authentication > Users for spam accounts
2. Review reported content: Table Editor > review_reports, file_reports
3. Check storage usage: Storage > course-files
4. Monitor error logs: Supabase > Logs

### Monthly Tasks

1. Review analytics: Vercel > Analytics
2. Check database size: Supabase > Settings > Usage
3. Update dependencies: `npm outdated` and `npm update`
4. Backup database: Supabase > Database > Backups

### Scaling

**When you hit free tier limits:**

1. **Supabase Free → Pro** ($25/month):
   - 8GB database → 100GB
   - 60 emails/hour → unlimited
   - 2GB storage → 100GB

2. **Vercel Free → Pro** ($20/month):
   - 100GB bandwidth → 1TB
   - Unlimited deployments
   - Advanced analytics

---

## Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Support: https://vercel.com/support
- Issues: Open GitHub issue in your repository

---

**Total Time: ~55 minutes** ✓

You're live! 🎉
