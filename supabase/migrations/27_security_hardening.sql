-- =============================================================================
-- Migration 27: Security Hardening
-- - Idempotently enable RLS on all public-facing tables
-- - Add INSERT/UPDATE/DELETE policies where missing
-- - Create a DB-level trigger to reject non-@ogr.iuc.edu.tr registrations
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE RLS ON ALL PUBLIC TABLES (idempotent — no-op if already enabled)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.faculties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.instructors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.files            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.review_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.file_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.review_tags      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_survival_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faculty_requests ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. HARDENED RLS POLICIES FOR TABLES THAT MAY BE MISSING THEM
--    (Using CREATE POLICY IF NOT EXISTS pattern via DO blocks)
-- ─────────────────────────────────────────────────────────────────────────────

-- tags: public read, authenticated insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Anyone can view tags') THEN
    CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Authenticated users can create tags') THEN
    CREATE POLICY "Authenticated users can create tags" ON public.tags FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- review_tags: public read, authenticated insert/delete own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_tags' AND policyname = 'Anyone can view review tags') THEN
    CREATE POLICY "Anyone can view review tags" ON public.review_tags FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_tags' AND policyname = 'Authenticated users can add review tags') THEN
    CREATE POLICY "Authenticated users can add review tags" ON public.review_tags FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- pending_tags: authenticated insert, select own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_tags' AND policyname = 'Users can view their own pending tags') THEN
    CREATE POLICY "Users can view their own pending tags" ON public.pending_tags FOR SELECT
      USING (auth.uid() = created_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_tags' AND policyname = 'Authenticated users can suggest tags') THEN
    CREATE POLICY "Authenticated users can suggest tags" ON public.pending_tags FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- pending_survival_guides: authenticated insert, select own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_survival_guides' AND policyname = 'Users can view their own pending guides') THEN
    CREATE POLICY "Users can view their own pending guides" ON public.pending_survival_guides FOR SELECT
      USING (auth.uid() = submitted_by);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pending_survival_guides' AND policyname = 'Authenticated users can submit guides') THEN
    CREATE POLICY "Authenticated users can submit guides" ON public.pending_survival_guides FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- faculty_requests: anyone can insert (public form), no select
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faculty_requests' AND policyname = 'Anyone can submit faculty requests') THEN
    CREATE POLICY "Anyone can submit faculty requests" ON public.faculty_requests FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. EMAIL DOMAIN VALIDATION TRIGGER
--    Rejects any user registration where email does NOT end with @ogr.iuc.edu.tr
--    This runs on auth.users BEFORE INSERT, providing a DB-level safety net
--    in addition to the client-side check in lib/auth.ts.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_university_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service-role / admin inserts that might not have an email (e.g. anonymous)
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Reject if domain does not match
  IF NOT (lower(NEW.email) LIKE '%@ogr.iuc.edu.tr') THEN
    RAISE EXCEPTION 'Registration denied: only @ogr.iuc.edu.tr email addresses are allowed. Received: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate to ensure idempotency
DROP TRIGGER IF EXISTS enforce_university_email_trigger ON auth.users;
CREATE TRIGGER enforce_university_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_university_email();


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PREVENT report_count / is_hidden TAMPERING
--    Users should not be able to modify these columns via RLS.
--    The existing UPDATE policies already restrict to auth.uid() = user_id,
--    but we add an extra guard: a trigger that prevents users from changing
--    report_count or is_hidden directly.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Preserve system-managed fields — users cannot modify them
  NEW.report_count := OLD.report_count;
  NEW.is_hidden    := OLD.is_hidden;
  RETURN NEW;
END;
$$;

-- Apply to reviews
DROP TRIGGER IF EXISTS protect_review_moderation ON public.reviews;
CREATE TRIGGER protect_review_moderation
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_moderation_fields();

-- Apply to files
DROP TRIGGER IF EXISTS protect_file_moderation ON public.files;
CREATE TRIGGER protect_file_moderation
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_moderation_fields();
