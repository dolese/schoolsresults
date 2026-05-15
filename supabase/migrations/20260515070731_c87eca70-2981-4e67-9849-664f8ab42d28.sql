
-- =====================
-- ENUMS
-- =====================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher');
CREATE TYPE public.exam_type AS ENUM ('march','midterm','mock','pre_necta','terminal','annual','september','pre_mock');
CREATE TYPE public.school_status AS ENUM ('pending','active','suspended');

-- =====================
-- SCHOOLS
-- =====================
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  motto TEXT,
  region TEXT,
  status public.school_status NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'free',
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- USER ROLES (separate table — security definer)
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_school ON public.user_roles(school_id);

-- =====================
-- SECURITY DEFINER HELPERS
-- =====================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_school_member(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND role IN ('school_admin','teacher')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND school_id = _school_id
      AND role = 'school_admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- =====================
-- ACADEMIC YEARS
-- =====================
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  year INT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, year)
);

-- =====================
-- FORMS
-- =====================
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Form I"
  level INT NOT NULL, -- 1..6
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, level)
);

-- =====================
-- STREAMS
-- =====================
CREATE TABLE public.streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- SUBJECTS
-- =====================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, name)
);

-- =====================
-- STUDENTS
-- =====================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  admission_no TEXT NOT NULL,
  full_name TEXT NOT NULL,
  form_id UUID REFERENCES public.forms(id) ON DELETE SET NULL,
  stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  year INT NOT NULL,
  gender TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, admission_no, year)
);
CREATE INDEX idx_students_school ON public.students(school_id);
CREATE INDEX idx_students_name ON public.students(school_id, full_name);

-- =====================
-- EXAMS
-- =====================
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  year INT NOT NULL,
  type public.exam_type NOT NULL,
  name TEXT NOT NULL,
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
  opens_at DATE,
  closes_at DATE,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exams_school ON public.exams(school_id, year);

-- =====================
-- EXAM SUBJECTS
-- =====================
CREATE TABLE public.exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  max_marks INT NOT NULL DEFAULT 100,
  UNIQUE (exam_id, subject_id)
);

-- =====================
-- MARKS
-- =====================
CREATE TABLE public.marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id, subject_id)
);
CREATE INDEX idx_marks_exam_student ON public.marks(exam_id, student_id);

-- =====================
-- ANNOUNCEMENTS
-- =====================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- GRADING SCALES (per school overrides; default NECTA)
-- =====================
CREATE TABLE public.grading_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
  scale JSONB NOT NULL DEFAULT '[
    {"grade":"A","min":75,"max":100,"points":1},
    {"grade":"B","min":65,"max":74,"points":2},
    {"grade":"C","min":45,"max":64,"points":3},
    {"grade":"D","min":30,"max":44,"points":4},
    {"grade":"F","min":0,"max":29,"points":5}
  ]'::jsonb,
  divisions JSONB NOT NULL DEFAULT '[
    {"division":"I","min":7,"max":17},
    {"division":"II","min":18,"max":21},
    {"division":"III","min":22,"max":25},
    {"division":"IV","min":26,"max":33},
    {"division":"0","min":34,"max":35}
  ]'::jsonb
);

-- =====================
-- ENABLE RLS
-- =====================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_scales ENABLE ROW LEVEL SECURITY;

-- =====================
-- POLICIES
-- =====================

-- schools: anyone can view active; members can view their school; admins of school can update
CREATE POLICY "Public can view active schools"
  ON public.schools FOR SELECT
  USING (status = 'active');
CREATE POLICY "Members can view own school"
  ON public.schools FOR SELECT
  TO authenticated
  USING (public.is_school_member(auth.uid(), id));
CREATE POLICY "School admins can update own school"
  ON public.schools FOR UPDATE
  TO authenticated
  USING (public.is_school_admin(auth.uid(), id));
CREATE POLICY "Super admins can do anything on schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- user_roles: users can read their own; super admin all; school_admin can manage roles in their school
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Super admins manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins manage roles in school"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (school_id IS NOT NULL AND public.is_school_admin(auth.uid(), school_id))
  WITH CHECK (school_id IS NOT NULL AND public.is_school_admin(auth.uid(), school_id));

-- Generic helper: write a "school members manage" + "public view published" pattern
-- For tables strictly tied to a school_id

-- academic_years
CREATE POLICY "Public read academic years for active schools"
  ON public.academic_years FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.status='active'));
CREATE POLICY "School members manage academic years"
  ON public.academic_years FOR ALL
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id))
  WITH CHECK (public.is_school_member(auth.uid(), school_id));

-- forms
CREATE POLICY "Public read forms for active schools"
  ON public.forms FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.status='active'));
CREATE POLICY "School members manage forms"
  ON public.forms FOR ALL
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id))
  WITH CHECK (public.is_school_member(auth.uid(), school_id));

-- streams
CREATE POLICY "Public read streams for active schools"
  ON public.streams FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.status='active'));
CREATE POLICY "School members manage streams"
  ON public.streams FOR ALL
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id))
  WITH CHECK (public.is_school_member(auth.uid(), school_id));

-- subjects
CREATE POLICY "Public read subjects for active schools"
  ON public.subjects FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.status='active'));
CREATE POLICY "School members manage subjects"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id))
  WITH CHECK (public.is_school_member(auth.uid(), school_id));

-- students: only school members can read; results checker uses security definer fn
CREATE POLICY "School members read students"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id));
CREATE POLICY "School members manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id))
  WITH CHECK (public.is_school_member(auth.uid(), school_id));

-- exams: published exams are publicly readable; otherwise members only
CREATE POLICY "Public read published exams"
  ON public.exams FOR SELECT
  USING (published = true);
CREATE POLICY "School members read all exams"
  ON public.exams FOR SELECT
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id));
CREATE POLICY "School members manage exams"
  ON public.exams FOR ALL
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id))
  WITH CHECK (public.is_school_member(auth.uid(), school_id));

-- exam_subjects
CREATE POLICY "Public read exam_subjects via published exams"
  ON public.exam_subjects FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND e.published = true));
CREATE POLICY "School members manage exam_subjects"
  ON public.exam_subjects FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_member(auth.uid(), e.school_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_member(auth.uid(), e.school_id)));

-- marks: only school members read (public results checker uses security-definer server fn)
CREATE POLICY "School members read marks"
  ON public.marks FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_member(auth.uid(), e.school_id)));
CREATE POLICY "School members manage marks"
  ON public.marks FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_member(auth.uid(), e.school_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_id AND public.is_school_member(auth.uid(), e.school_id)));

-- announcements
CREATE POLICY "Public read announcements for active schools"
  ON public.announcements FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.status='active'));
CREATE POLICY "School members manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.is_school_member(auth.uid(), school_id))
  WITH CHECK (public.is_school_member(auth.uid(), school_id));

-- grading_scales
CREATE POLICY "Public read grading_scales for active schools"
  ON public.grading_scales FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.status='active'));
CREATE POLICY "School admins manage grading_scales"
  ON public.grading_scales FOR ALL
  TO authenticated
  USING (public.is_school_admin(auth.uid(), school_id))
  WITH CHECK (public.is_school_admin(auth.uid(), school_id));

-- =====================
-- create_school RPC: lets a signed-in user create a school + assign themselves as school_admin
-- + seed default forms, subjects, grading scale
-- =====================
CREATE OR REPLACE FUNCTION public.create_school(
  _slug TEXT,
  _name TEXT,
  _region TEXT DEFAULT NULL,
  _motto TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school_id UUID;
  v_uid UUID := auth.uid();
  v_form_id UUID;
  v_year INT := EXTRACT(YEAR FROM now())::INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _slug !~ '^[a-z0-9](-?[a-z0-9])*$' OR length(_slug) < 3 OR length(_slug) > 40 THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;

  INSERT INTO public.schools (slug, name, region, motto)
  VALUES (lower(_slug), _name, _region, _motto)
  RETURNING id INTO v_school_id;

  INSERT INTO public.user_roles (user_id, school_id, role)
  VALUES (v_uid, v_school_id, 'school_admin');

  INSERT INTO public.grading_scales (school_id) VALUES (v_school_id);

  INSERT INTO public.academic_years (school_id, year, is_current)
  VALUES (v_school_id, v_year, true);

  -- Default Tanzanian O-Level forms
  FOR i IN 1..4 LOOP
    INSERT INTO public.forms (school_id, name, level)
    VALUES (v_school_id,
      CASE i WHEN 1 THEN 'Form I' WHEN 2 THEN 'Form II' WHEN 3 THEN 'Form III' WHEN 4 THEN 'Form IV' END,
      i);
  END LOOP;

  -- Default subjects
  INSERT INTO public.subjects (school_id, name, code) VALUES
    (v_school_id, 'Mathematics', 'MATH'),
    (v_school_id, 'English', 'ENG'),
    (v_school_id, 'Kiswahili', 'KIS'),
    (v_school_id, 'Physics', 'PHY'),
    (v_school_id, 'Chemistry', 'CHE'),
    (v_school_id, 'Biology', 'BIO'),
    (v_school_id, 'Geography', 'GEO'),
    (v_school_id, 'History', 'HIS'),
    (v_school_id, 'Civics', 'CIV');

  RETURN v_school_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_school(TEXT, TEXT, TEXT, TEXT) TO authenticated;
