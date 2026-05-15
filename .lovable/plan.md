# SchoolsResultsPortal — Multi-school NECTA Results SaaS

Inspired by dolese.tech (Bonde Secondary School). The goal is to turn that single-school portal into a SaaS any Tanzanian secondary school can sign up for, while keeping the student/parent results-checking experience as the front door.

## What we're building (v1)

A web app with three audiences:

1. **Students & parents** (primary) — public per-school portal to check results by admission number, see announcements, download report cards.
2. **School staff** (teachers / school admin) — log in to manage classes, students, exams, marks, publish results.
3. **Super Admin** (you) — onboard schools, manage subscriptions, monitor usage.

## Core flows

### Public results checker (per school)
- Each school gets a public page: `/{school-slug}` (e.g. `/bonde`).
- Hero with school name + logo + stats (students, classes, latest exam).
- Search form: Admission No or Name + Exam + Form + Year → returns the student's result slip with subjects, marks, NECTA grade, division, position in class.
- Downloadable PDF report card.
- Announcements feed.

### School staff dashboard
- Manage academic year, forms (I–IV), streams, subjects.
- Manage students (CSV import + manual).
- Create exams (March, Mid-term, Mock, Pre-NECTA, Terminal, Annual) and open them for mark entry.
- Teacher gradebook: enter marks per subject per class. Auto-compute NECTA grade and division.
- Publish / unpublish results (toggle visibility on the public portal).
- Post announcements.

### Super Admin
- Approve / suspend schools.
- Set plan limits (students / staff seats).
- Global stats.

## NECTA grading (built-in)

Standard O-Level secondary school grading:

```text
A: 75–100   1 point
B: 65–74    2 points
C: 45–64    3 points
D: 30–44    4 points
F:  0–29    5 points
```

Division calculation from best 7 subjects:

```text
Division I:   7–17 points
Division II: 18–21
Division III:22–25
Division IV: 26–33
Division 0:  34+
```

Editable per school (so non-NECTA schools or future syllabus changes are supported).

## Pages (TanStack Start routes)

```text
/                              Marketing landing — "Modern results portal for schools"
/pricing
/about
/contact
/login                         Single login; routes by role after auth
/signup                        School onboarding (creates school + admin user)
/{school-slug}                 Public school portal (hero, search, announcements)
/{school-slug}/results         Search-only view + slip detail by ID
/{school-slug}/announcements
/_authenticated/app            School staff dashboard
  /students /classes /subjects /exams /marks /announcements /settings
/_authenticated/super          Super Admin (gated by role)
```

## Data model (Lovable Cloud / Postgres)

- `schools` (id, slug, name, logo_url, branding json, plan, status)
- `user_roles` (user_id, school_id, role: super_admin | school_admin | teacher) — separate table, enforced via `has_role()` security-definer function
- `academic_years` (school_id, year, is_current)
- `forms` (school_id, name)
- `streams` (school_id, form_id, name)
- `subjects` (school_id, name, code)
- `students` (school_id, admission_no, full_name, form_id, stream_id, year, photo_url)
- `exams` (school_id, year, type, name, opens_at, closes_at, published)
- `exam_subjects` (exam_id, subject_id, max_marks)
- `marks` (exam_id, student_id, subject_id, score)
- `announcements` (school_id, title, body, published_at)
- `grading_scales` (school_id, json) — defaults to NECTA

RLS: every row scoped by `school_id`. Public results checker uses a security-definer server function that returns only PUBLISHED results for the requested school slug.

## Tech notes (developer section)

- TanStack Start v1 + Tailwind v4 + shadcn (already scaffolded).
- Lovable Cloud for DB, Auth (email/password + Google), Storage (logos, student photos, report PDFs).
- Server functions (`createServerFn`) for all mutations and authenticated reads. Public results checker uses a `supabaseAdmin`-elevated server fn that validates school slug + filters to `published=true`.
- Report card PDF: server function using `@react-pdf/renderer`.
- CSV import with Zod validation.
- Multi-tenant routing via `$schoolSlug` dynamic segment.

## Out of scope for v1

- Fees / payments
- Attendance
- SMS to parents (can be added later via a connector)
- Native mobile app (web is mobile-responsive)
- Custom domains per school (use `/{slug}` first)

## Suggested build order

1. Marketing landing + pricing + auth (signup creates school).
2. School staff dashboard skeleton with students, classes, subjects.
3. Exams + marks entry + NECTA grade computation.
4. Public per-school portal (hero + search + result slip).
5. PDF report cards + announcements.
6. Super Admin console.

I'd recommend tackling steps 1–2 in the first build pass so you can sign up a school and add students end-to-end, then iterate.
