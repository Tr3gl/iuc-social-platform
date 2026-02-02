# Anonymous University Course Feedback Platform

A student-only, anonymous course evaluation platform built with Next.js and Supabase.

## Features

- **Anonymous Reviews**: Students can review courses without exposing their identity
- **Email Authentication**: Magic-link authentication restricted to university emails (@ogr.iuc.edu.tr)
- **Structured Feedback**: Standardized ratings for difficulty, usefulness, workload, and exam clarity
- **File Sharing**: Upload and download past exams and course materials
- **Anti-Spam Protection**: Rate limiting and one review per course per user
- **Zero Cost**: Runs entirely on free tiers (Vercel + Supabase)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Hosting**: Vercel (free tier)

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier)
- A Vercel account (free tier)

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Supabase Setup

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize
3. Note your project URL and anon key from Project Settings > API

#### Run Database Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL to create tables and policies
4. Copy and paste the contents of `supabase/seed.sql` (optional sample data)
5. Run to populate initial faculties

#### Configure Storage

1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `course-files`
3. Set bucket to **public**
4. Add the following policy for uploads:
   - Policy name: "Authenticated users can upload"
   - Allowed operations: INSERT
   - Target roles: authenticated
   - USING expression: `auth.uid() = owner_id`

#### Configure Email Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Disable "Confirm email" (we use magic links only)
4. Set up email templates (optional but recommended):
   - Customize magic link email template
   - Set site URL to your deployment URL

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deployment

#### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

See [DEPLOYMENT.md](DEPLOYMENT.md) for a detailed step-by-step guide.

**Important**: Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Update Supabase Site URL

1. Go to Authentication > URL Configuration in Supabase
2. Set Site URL to your Vercel deployment URL
3. Add your Vercel URL to Redirect URLs

## Security Features

### Row Level Security (RLS)

All tables have RLS policies enforcing:
- Users can only insert reviews with their own user_id
- Email addresses are never exposed in public queries
- Users can only edit/delete their own reviews
- Aggregated stats are public, individual reviews are protected

### Anonymity Protection

- Email addresses stored only in Supabase Auth (isolated)
- Reviews table uses only UUID references
- No email fields in application database
- Public queries never expose user identifiers

### Anti-Abuse Measures

- One review per course per user (database constraint)
- Rate limiting on submissions (24-hour cooldown recommended)
- Email verification required via magic links
- University email domain validation (@ogr.iuc.edu.tr)
- Report functionality for inappropriate content

## Database Schema

### Core Tables

- `faculties`: Academic faculties/departments
- `courses`: Course catalog with faculty relations
- `instructors`: Course instructors
- `course_instructors`: Many-to-many course-instructor relationships
- `reviews`: Anonymous course evaluations
- `files`: Uploaded course materials and exams

### Key Constraints

- Unique constraint: `(user_id, course_id)` prevents duplicate reviews
- Foreign key cascades for data integrity
- Check constraints for rating ranges (1-5)

## Usage Guidelines

### For Students

1. Sign in with your university email (@ogr.iuc.edu.tr)
2. Browse faculties and courses
3. Submit one review per course with structured ratings
4. Upload helpful materials (past exams, notes)
5. View aggregated statistics (requires ≥10 reviews per course)

### For Administrators

- No manual moderation required at MVP stage
- Monitor via Supabase dashboard
- Review reported content periodically
- Adjust rate limits via database policies if needed

## Privacy & Legal

- This is an **unofficial, student-led platform**
- Not affiliated with any university administration
- Reviews are anonymous and for informational purposes only
- Users are responsible for uploaded content
- Platform complies with email verification requirements

## Customization

### Change Email Domain

Edit `lib/auth.ts` and update the validation regex:

```typescript
const regex = /^[^\s@]+@ogr\.iuc\.edu\.tr$/;
```

### Adjust Review Threshold

Edit `lib/constants.ts`:

```typescript
export const MIN_REVIEWS_FOR_DISPLAY = 10;
```

### Modify Rating Scales

Update database schema and form validation in respective files.

## Troubleshooting

### Magic Link Not Received

- Check spam folder
- Verify email provider allows Supabase emails
- Check Supabase email rate limits (60/hour on free tier)

### RLS Policy Errors

- Ensure user is authenticated before submitting reviews
- Check Supabase logs for policy violations
- Verify policies match schema in `supabase/schema.sql`

### File Upload Failures

- Check storage bucket is public
- Verify bucket name matches code (`course-files`)
- Ensure file size is under Supabase limits (50MB on free tier)

## Contributing

This is an open-source educational project. Contributions welcome!

## License

MIT License - See LICENSE file for details

## Support

For issues and questions, please open a GitHub issue or contact the maintainers.
