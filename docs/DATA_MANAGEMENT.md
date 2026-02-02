# Data Management Guide

## 🚨 Troubleshooting Import Errors

If you see **"new row violates row-level security policy"**, it means your script is trying to write data as an anonymous user, but only Admins are allowed to create Faculties/Courses.

### ✅ Solution 1: Fix the Script (Recommended)
This is the best method because it automatically:
1.  Creats Faculties (Departments) from filenames.
2.  Creates Instructors if they don't exist.
3.  Links Instructors to Courses.

**How to Fix:**
1.  Go to [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > API.
2.  In the "Project API keys" section, find the **`service_role`** key (it says "secret").
3.  Copy that key.
4.  Open your `.env.local` file and add a new line:
    ```env
    SUPABASE_SERVICE_ROLE_KEY=eyJh... (paste full key here)
    ```
5.  Run the script again: `node scripts/import_courses.js`

---

## 📋 Solution 2: Manual Import (Table Editor)

You asked: *"Can I paste them manually?"*
**Yes, but with limitations.**

You cannot simple "copy-paste" everything because your CSV has **Instructor Names**, but the `courses` table expects **Instructor IDs**.

### If you want to do it manually:
1.  **Import Instructors First**:
    *   Create a CSV with just one column: `name` (list of all unique instructor names).
    *   Import this into the `instructors` table.
2.  **Import Courses**:
    *   Delete the "Instructor Name" column from your Course CSV.
    *   Add a `faculty_id` column (get the UUID from `faculties` table).
    *   Import this into the `courses` table.
3.  **Link Them (The Hard Part)**:
    *   You will have to manually go to `course_instructors` table.
    *   Find the ID of "Calculus".
    *   Find the ID of "Prof. Dr. Uğur".
    *   Add a row linking them.
    *   *Repeat for every single course.* 😫

**Conclusion**: Manual import works fine for simple data, but for relational data (like Courses linked to Instructors), the script (Solution 1) saves you hours of work.

---

## 🛠️ Method 3: SQL Import

If you really hate the script, you can convert your CSV to SQL Insert statements.
Tools like [CSV to SQL Converter](https://www.convertcsv.com/csv-to-sql.htm) can help, but you still face the "Instructor ID" problem.
