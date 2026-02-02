# Project Structure

```
course-feedback-platform/
├── app/                          # Next.js App Router
│   ├── auth/
│   │   ├── callback/
│   │   │   └── page.tsx         # Auth callback handler
│   │   └── signin/
│   │       └── page.tsx         # Sign in page
│   ├── course/
│   │   └── [id]/
│   │       ├── page.tsx         # Course detail page
│   │       ├── review/
│   │       │   └── page.tsx     # Review submission
│   │       └── upload/
│   │           └── page.tsx     # File upload
│   ├── faculty/
│   │   └── [id]/
│   │       └── page.tsx         # Faculty courses list
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
│
├── components/                   # React components
│   ├── AuthProvider.tsx         # Auth context provider
│   ├── CourseStatsDisplay.tsx   # Statistics visualization
│   ├── FilesList.tsx            # Files list component
│   ├── Header.tsx               # Site header
│   └── ReviewsList.tsx          # Reviews list component
│
├── lib/                         # Utilities and configurations
│   ├── auth.ts                  # Authentication utilities
│   ├── constants.ts             # App constants
│   ├── database.types.ts        # TypeScript types for database
│   ├── supabase.ts              # Supabase client
│   └── utils.ts                 # Data fetching utilities
│
├── supabase/                    # Database setup
│   ├── schema.sql               # Complete database schema + RLS
│   └── seed.sql                 # Initial data seeding
│
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── DEPLOYMENT.md                # Step-by-step deployment guide
├── LICENSE                      # MIT License
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Main documentation
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## Key Files Explained

### Authentication Flow

1. **app/auth/signin/page.tsx**
   - User enters university email
   - Validates @ogr.iuc.edu.tr domain
   - Sends magic link via Supabase

2. **app/auth/callback/page.tsx**
   - Handles magic link callback
   - Sets session cookie
   - Redirects to homepage

3. **lib/auth.ts**
   - Email validation logic
   - Sign in/out functions
   - Session management

4. **components/AuthProvider.tsx**
   - React context for auth state
   - Provides user object to all components
   - Listens to auth state changes

### Data Flow

1. **lib/supabase.ts**
   - Initializes Supabase client
   - Typed with database schema

2. **lib/utils.ts**
   - All data fetching functions
   - CRUD operations for reviews, files
   - Course statistics queries

3. **supabase/schema.sql**
   - Complete database structure
   - Row Level Security policies
   - Triggers and functions
   - Comments and documentation

### Pages Architecture

**Homepage** (`app/page.tsx`)
- Lists all faculties
- Displays feature cards
- Shows disclaimers

**Faculty Page** (`app/faculty/[id]/page.tsx`)
- Lists courses for selected faculty
- Shows instructors per course
- Links to course details

**Course Page** (`app/course/[id]/page.tsx`)
- Tabbed interface: Stats | Reviews | Files
- Shows course information
- Conditional rendering based on review count
- CTA buttons for authenticated users

**Review Page** (`app/course/[id]/review/page.tsx`)
- Rating selectors (1-5 scale)
- Categorical questions (radio buttons)
- Optional text comment
- Form validation
- Edit existing review

**Upload Page** (`app/course/[id]/upload/page.tsx`)
- File type selection
- Drag-and-drop uploader
- File validation (size, type)
- Progress indication

### Components

**CourseStatsDisplay** (`components/CourseStatsDisplay.tsx`)
- Summary cards (median scores)
- Distribution charts (horizontal bars)
- Categorical data visualization
- Only shown when ≥10 reviews

**ReviewsList** (`components/ReviewsList.tsx`)
- Individual review cards
- Rating display (1-5)
- Categorical information
- Report functionality
- Anonymous (no user info shown)

**FilesList** (`components/FilesList.tsx`)
- File metadata display
- Download links
- Delete (own files only)
- Report (other users' files)

**Header** (`components/Header.tsx`)
- Navigation bar
- Auth status display
- Sign in/out buttons
- Mobile responsive menu

### Security Implementation

**Row Level Security (RLS)**
- Defined in `supabase/schema.sql`
- Users can only insert reviews with their own user_id
- Emails never exposed in queries
- Public can only read aggregated data

**Anonymity Protection**
- Email stored only in `auth.users` table
- Reviews table has only UUID references
- No JOIN to expose emails
- Client-side never receives email in review queries

**Anti-Abuse**
- Unique constraint: (user_id, course_id)
- Rate limiting suggestions in code
- Report functionality for community moderation
- Hidden flag for reported content

### Styling System

**Tailwind CSS** (`tailwind.config.js`)
- Custom color palette (primary, neutral)
- Utility-first approach
- Responsive design built-in

**Global Styles** (`app/globals.css`)
- Custom component classes (.btn, .card, .input)
- Rating button styles
- Consistent spacing and sizing

### Type Safety

**database.types.ts**
- Generated from Supabase schema
- Type-safe queries
- Autocomplete in IDE
- Compile-time error checking

**TypeScript Configuration** (`tsconfig.json`)
- Strict mode enabled
- Path aliases configured
- Modern ES features

## Data Model

### Core Entities

1. **Faculties** - Academic departments
2. **Courses** - Individual courses
3. **Instructors** - Teaching staff
4. **Reviews** - Anonymous evaluations
5. **Files** - Shared materials

### Relationships

```
faculties (1) ─────< (many) courses
courses (many) ────< (many) instructors (via course_instructors)
courses (1) ───────< (many) reviews
courses (1) ───────< (many) files
auth.users (1) ────< (many) reviews (anonymous)
auth.users (1) ────< (many) files
```

### Privacy by Design

- Reviews linked to users only by UUID
- No email fields in public tables
- RLS prevents cross-user data access
- Aggregation functions hide individual data

## Performance Optimizations

1. **Database Indexes**
   - Foreign key indexes for joins
   - Created_at index for sorting
   - Course_id index for filtering

2. **Query Optimization**
   - Uses PostgreSQL PERCENTILE_CONT for medians
   - Pre-aggregated stats via stored function
   - Selective field retrieval

3. **Frontend Optimization**
   - React Server Components where possible
   - Client components only when needed
   - Lazy loading for heavy components

## Extensibility Points

### Easy Customizations

1. **Email Domain**
   - Edit regex in `lib/auth.ts`
   - Supports any domain pattern

2. **Rating Scale**
   - Change min/max in `lib/constants.ts`
   - Update form validation
   - Adjust display components

3. **Review Threshold**
   - Modify `MIN_REVIEWS_FOR_DISPLAY` constant
   - Affects when stats become visible

4. **File Types**
   - Update `ALLOWED_FILE_TYPES` constant
   - Modify storage bucket settings

### Advanced Extensions

1. **Add New Rating Categories**
   - Add columns to `reviews` table
   - Update form in `review/page.tsx`
   - Extend stats function
   - Update display component

2. **Multi-language Support**
   - Add i18n library
   - Create translation files
   - Wrap text in translation function

3. **Advanced Analytics**
   - Add time-series queries
   - Create dashboard page
   - Implement data export

4. **Instructor Profiles**
   - Create instructor detail page
   - Aggregate reviews per instructor
   - Add instructor search

## Security Considerations

### What's Protected

✅ User anonymity (emails never exposed)
✅ SQL injection (parameterized queries)
✅ XSS attacks (React escapes by default)
✅ CSRF (SameSite cookies)
✅ Unauthorized data access (RLS)

### What to Add

⚠️ Rate limiting (backend implementation)
⚠️ Content moderation queue
⚠️ Admin dashboard
⚠️ Audit logging
⚠️ DDoS protection (via Vercel Pro)

## Maintenance

### Regular Tasks

- Monitor Supabase logs for errors
- Review reported content
- Check storage usage
- Update dependencies monthly

### Backup Strategy

- Supabase auto-backups (daily)
- Export critical data weekly
- Version control for code

### Monitoring

- Vercel analytics (built-in)
- Supabase logs (real-time)
- Error tracking (add Sentry for production)

## Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   npm run dev  # Test locally
   git commit -m "Add new feature"
   git push origin feature/new-feature
   # Create pull request
   ```

2. **Database Changes**
   - Modify `supabase/schema.sql`
   - Test locally with Supabase CLI
   - Apply via SQL Editor
   - Update `database.types.ts` if needed

3. **Deployment**
   - Push to main branch
   - Vercel auto-deploys
   - Check deployment logs
   - Test production

## FAQ

**Q: Can I use a different database?**
A: Possible but requires significant changes. Supabase provides auth + database + storage in one.

**Q: Can I self-host?**
A: Yes! Supabase is open-source. See Supabase self-hosting docs.

**Q: How to add more security?**
A: Implement rate limiting, add CAPTCHA, enable MFA in Supabase.

**Q: Scale beyond free tier?**
A: Upgrade Supabase Pro ($25/mo) and Vercel Pro ($20/mo) as needed.

**Q: Add mobile app?**
A: Use React Native with same Supabase backend. Reuse lib/ code.
