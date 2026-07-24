import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeDivision, gradeFor } from "@/lib/grading";

const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](-?[a-z0-9])*$/);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSchool(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, slug, region, motto")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("School not found");
  return data as { id: string; name: string; slug: string; region: string | null; motto: string | null };
}

/* ---------------- Assessment verification ---------------- */
export const getVerificationOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const [{ data: exams }, { data: examSubjects }, { data: marks }, { data: students }] = await Promise.all([
      supabase.from("exams").select("id, name, year, form_id, published, forms(name, level)").eq("school_id", school.id).order("created_at", { ascending: false }),
      supabase.from("exam_subjects").select("exam_id, subject_id"),
      supabase.from("marks").select("exam_id, score, student_id, subject_id"),
      supabase.from("students").select("id, form_id").eq("school_id", school.id),
    ]);
    const studentsByForm = new Map<string, number>();
    for (const s of students ?? []) if (s.form_id) studentsByForm.set(s.form_id, (studentsByForm.get(s.form_id) ?? 0) + 1);
    const subjectsPerExam = new Map<string, number>();
    for (const es of examSubjects ?? []) subjectsPerExam.set(es.exam_id, (subjectsPerExam.get(es.exam_id) ?? 0) + 1);
    const filledPerExam = new Map<string, number>();
    const blanksPerExam = new Map<string, number>();
    for (const m of marks ?? []) {
      if (m.score != null) filledPerExam.set(m.exam_id, (filledPerExam.get(m.exam_id) ?? 0) + 1);
      else blanksPerExam.set(m.exam_id, (blanksPerExam.get(m.exam_id) ?? 0) + 1);
    }
    const rows = (exams ?? []).map((e) => {
      const nSubj = subjectsPerExam.get(e.id) ?? 0;
      const nStud = e.form_id ? studentsByForm.get(e.form_id) ?? 0 : 0;
      const expected = nSubj * nStud;
      const filled = filledPerExam.get(e.id) ?? 0;
      const missing = Math.max(0, expected - filled);
      const completion = expected ? Math.round((filled / expected) * 100) : 0;
      return { id: e.id, name: e.name, year: e.year, form: (e.forms as { name: string } | null)?.name ?? "-", published: e.published, expected, filled, missing, completion };
    });
    return { school, rows };
  });

/* ---------------- Marks history ---------------- */
export const listMarkHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, limit: z.number().int().min(1).max(200).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { data: exams } = await supabase.from("exams").select("id").eq("school_id", school.id);
    const ids = (exams ?? []).map((e) => e.id);
    if (!ids.length) return { school, entries: [] };
    const { data: marks } = await supabase
      .from("marks")
      .select("id, score, updated_at, exam_id, student_id, subject_id, students(full_name, admission_no), subjects(name), exams(name)")
      .in("exam_id", ids)
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 50);
    const entries = (marks ?? []).map((m) => ({
      id: m.id,
      score: m.score,
      updated_at: m.updated_at,
      student: (m.students as { full_name: string; admission_no: string } | null)?.full_name ?? "-",
      admission: (m.students as { admission_no: string } | null)?.admission_no ?? "",
      subject: (m.subjects as { name: string } | null)?.name ?? "-",
      exam: (m.exams as { name: string } | null)?.name ?? "-",
    }));
    return { school, entries };
  });

/* ---------------- Certificate candidates (Form IV completers) ---------------- */
export const listCertificateCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { data: form4 } = await supabase.from("forms").select("id").eq("school_id", school.id).eq("level", 4).maybeSingle();
    if (!form4) return { school, candidates: [] };
    const [{ data: students }, { data: exams }] = await Promise.all([
      supabase.from("students").select("id, admission_no, full_name, gender, year").eq("school_id", school.id).eq("form_id", form4.id).order("admission_no"),
      supabase.from("exams").select("id").eq("school_id", school.id).eq("published", true).eq("form_id", form4.id),
    ]);
    const examIds = (exams ?? []).map((e) => e.id);
    const { data: marks } = examIds.length
      ? await supabase.from("marks").select("student_id, score").in("exam_id", examIds)
      : { data: [] as { student_id: string; score: number | null }[] };
    const perStudent = new Map<string, number[]>();
    for (const m of marks ?? []) {
      if (m.score == null) continue;
      const arr = perStudent.get(m.student_id) ?? [];
      arr.push(Number(m.score));
      perStudent.set(m.student_id, arr);
    }
    const candidates = (students ?? []).map((s) => {
      const scores = perStudent.get(s.id) ?? [];
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const grade = scores.length ? gradeFor(avg).grade : "-";
      const { division } = scores.length >= 4 ? computeDivision(scores) : { division: "-" };
      return { ...s, subjects: scores.length, avg, grade, division };
    });
    return { school, candidates };
  });

/* ---------------- Alumni (past Form IV students) ---------------- */
export const listAlumniStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const currentYear = new Date().getFullYear();
    const { data: students } = await supabase
      .from("students")
      .select("id, admission_no, full_name, gender, year, forms(name, level)")
      .eq("school_id", school.id)
      .lt("year", currentYear)
      .order("year", { ascending: false });
    return { school, alumni: students ?? [] };
  });

/* ---------------- Calendar (years + exam windows) ---------------- */
export const getSchoolCalendar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const [{ data: years }, { data: exams }] = await Promise.all([
      supabase.from("academic_years").select("id, year, is_current").eq("school_id", school.id).order("year", { ascending: false }),
      supabase.from("exams").select("id, name, year, opens_at, closes_at, published, forms(name)").eq("school_id", school.id).order("year", { ascending: false }),
    ]);
    return { school, years: years ?? [], exams: exams ?? [] };
  });

/* ---------------- Advanced search ---------------- */
export const advancedSearch = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, q: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const q = `%${data.q}%`;
    const [{ data: students }, { data: exams }, { data: announcements }, { data: subjects }] = await Promise.all([
      supabase.from("students").select("id, admission_no, full_name, forms(name)").eq("school_id", school.id).or(`full_name.ilike.${q},admission_no.ilike.${q}`).limit(20),
      supabase.from("exams").select("id, name, year, published").eq("school_id", school.id).ilike("name", q).limit(20),
      supabase.from("announcements").select("id, title, published_at").eq("school_id", school.id).ilike("title", q).limit(20),
      supabase.from("subjects").select("id, name, code").eq("school_id", school.id).or(`name.ilike.${q},code.ilike.${q}`).limit(20),
    ]);
    return { school, students: students ?? [], exams: exams ?? [], announcements: announcements ?? [], subjects: subjects ?? [] };
  });