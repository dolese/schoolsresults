import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeDivision, gradeFor, NECTA_SCALE, NECTA_DIVISIONS } from "@/lib/grading";

const slugSchema = z.string().min(3).max(40).regex(/^[a-z0-9](-?[a-z0-9])*$/);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSchool(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("School not found");
  return data as { id: string; name: string; slug: string };
}

/* ============ Academic Years ============ */
export const listAcademicYears = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { data: years, error } = await context.supabase
      .from("academic_years")
      .select("id, year, is_current, created_at")
      .eq("school_id", school.id)
      .order("year", { ascending: false });
    if (error) throw new Error(error.message);
    return { school, years: years ?? [] };
  });

export const addAcademicYear = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, year: z.coerce.number().int().min(2000).max(2100) }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("academic_years").insert({ school_id: school.id, year: data.year, is_current: false });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setCurrentAcademicYear = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    await context.supabase.from("academic_years").update({ is_current: false }).eq("school_id", school.id);
    const { error } = await context.supabase.from("academic_years").update({ is_current: true }).eq("id", data.id).eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAcademicYear = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("academic_years").delete().eq("id", data.id).eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Classes & Streams ============ */
export const listClassesAndStreams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const [{ data: forms }, { data: streams }, { data: students }] = await Promise.all([
      context.supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
      context.supabase.from("streams").select("id, form_id, name").eq("school_id", school.id).order("name"),
      context.supabase.from("students").select("id, form_id, stream_id").eq("school_id", school.id),
    ]);
    const countsByForm = new Map<string, number>();
    const countsByStream = new Map<string, number>();
    for (const s of students ?? []) {
      if (s.form_id) countsByForm.set(s.form_id, (countsByForm.get(s.form_id) ?? 0) + 1);
      if (s.stream_id) countsByStream.set(s.stream_id, (countsByStream.get(s.stream_id) ?? 0) + 1);
    }
    return {
      school,
      forms: (forms ?? []).map((f: { id: string; name: string; level: number }) => ({ ...f, count: countsByForm.get(f.id) ?? 0 })),
      streams: (streams ?? []).map((s: { id: string; form_id: string; name: string }) => ({ ...s, count: countsByStream.get(s.id) ?? 0 })),
    };
  });

export const addStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, form_id: z.string().uuid(), name: z.string().min(1).max(40) }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("streams").insert({ school_id: school.id, form_id: data.form_id, name: data.name.trim() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStream = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("streams").delete().eq("id", data.id).eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Grading Scale ============ */
export const getGradingScale = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { data: gs } = await context.supabase.from("grading_scales").select("id, scale, divisions").eq("school_id", school.id).maybeSingle();
    return {
      school,
      id: gs?.id ?? null,
      scale: (gs?.scale as typeof NECTA_SCALE | null) ?? NECTA_SCALE,
      divisions: (gs?.divisions as typeof NECTA_DIVISIONS | null) ?? NECTA_DIVISIONS,
    };
  });

export const resetGradingScale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { data: existing } = await context.supabase.from("grading_scales").select("id").eq("school_id", school.id).maybeSingle();
    if (existing) {
      await context.supabase.from("grading_scales").update({ scale: NECTA_SCALE, divisions: NECTA_DIVISIONS }).eq("id", existing.id);
    } else {
      await context.supabase.from("grading_scales").insert({ school_id: school.id, scale: NECTA_SCALE, divisions: NECTA_DIVISIONS });
    }
    return { ok: true };
  });

/* ============ Reports ============ */
type MarkRow = { student_id: string; subject_id: string; exam_id: string; score: number | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadReportData(supabase: any, slug: string, formId?: string | null) {
  const school = await resolveSchool(supabase, slug);
  let examsQ = supabase.from("exams").select("id, name, year, form_id, published").eq("school_id", school.id).eq("published", true);
  if (formId) examsQ = examsQ.eq("form_id", formId);
  const { data: exams } = await examsQ;
  const examIds = (exams ?? []).map((e: { id: string }) => e.id);
  const [{ data: students }, { data: subjects }, { data: forms }, marksRes] = await Promise.all([
    supabase.from("students").select("id, full_name, admission_no, gender, form_id").eq("school_id", school.id),
    supabase.from("subjects").select("id, name, code").eq("school_id", school.id),
    supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
    examIds.length ? supabase.from("marks").select("student_id, subject_id, exam_id, score").in("exam_id", examIds) : Promise.resolve({ data: [] }),
  ]);
  return { school, exams: exams ?? [], students: students ?? [], subjects: subjects ?? [], forms: forms ?? [], marks: (marksRes.data ?? []) as MarkRow[] };
}

export const getClassPerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const d = await loadReportData(context.supabase, data.slug);
    const studentForm = new Map<string, string | null>(
      d.students.map((s: { id: string; form_id: string | null }) => [s.id, s.form_id] as [string, string | null]),
    );
    const perForm = new Map<string, { total: number; count: number; students: Set<string> }>();
    for (const m of d.marks) {
      if (m.score == null) continue;
      const fid = studentForm.get(m.student_id);
      if (!fid) continue;
      const cur = perForm.get(fid) ?? { total: 0, count: 0, students: new Set<string>() };
      cur.total += Number(m.score);
      cur.count += 1;
      cur.students.add(m.student_id);
      perForm.set(fid, cur);
    }
    const rows: Array<{ id: string; name: string; level: number; avg: number; students: number; entries: number }> = d.forms.map((f: { id: string; name: string; level: number }) => {
      const a = perForm.get(f.id);
      return { id: f.id, name: f.name, level: f.level, avg: a && a.count ? a.total / a.count : 0, students: a?.students.size ?? 0, entries: a?.count ?? 0 };
    });
    return { school: d.school, rows };
  });

export const getSubjectAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const d = await loadReportData(context.supabase, data.slug);
    const perSubject = new Map<string, { total: number; count: number; pass: number }>();
    for (const m of d.marks) {
      if (m.score == null) continue;
      const cur = perSubject.get(m.subject_id) ?? { total: 0, count: 0, pass: 0 };
      cur.total += Number(m.score);
      cur.count += 1;
      if (Number(m.score) >= 30) cur.pass += 1;
      perSubject.set(m.subject_id, cur);
    }
    const rows: Array<{ id: string; name: string; code: string | null; avg: number; entries: number; passRate: number; grade: string }> = d.subjects.map((s: { id: string; name: string; code: string | null }) => {
      const a = perSubject.get(s.id);
      const avg = a && a.count ? a.total / a.count : 0;
      return { id: s.id, name: s.name, code: s.code, avg, entries: a?.count ?? 0, passRate: a && a.count ? (a.pass / a.count) * 100 : 0, grade: a && a.count ? gradeFor(avg).grade : "-" };
    });
    rows.sort((a: { avg: number }, b: { avg: number }) => b.avg - a.avg);
    return { school: d.school, rows };
  });

export const getGenderAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const d = await loadReportData(context.supabase, data.slug);
    const genderMap = new Map(d.students.map((s: { id: string; gender: string | null }) => [s.id, (s.gender as "M" | "F" | null) ?? "U"]));
    const buckets: Record<string, { total: number; count: number; students: Set<string> }> = {
      M: { total: 0, count: 0, students: new Set() },
      F: { total: 0, count: 0, students: new Set() },
      U: { total: 0, count: 0, students: new Set() },
    };
    for (const m of d.marks) {
      if (m.score == null) continue;
      const g = (genderMap.get(m.student_id) as string | undefined) ?? "U";
      buckets[g].total += Number(m.score);
      buckets[g].count += 1;
      buckets[g].students.add(m.student_id);
    }
    const rows = (["M", "F", "U"] as const).map((g) => ({
      gender: g === "M" ? "Male" : g === "F" ? "Female" : "Unspecified",
      students: buckets[g].students.size,
      entries: buckets[g].count,
      avg: buckets[g].count ? buckets[g].total / buckets[g].count : 0,
    }));
    return { school: d.school, rows };
  });

export const getSchoolPerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const d = await loadReportData(context.supabase, data.slug);
    let total = 0, count = 0, pass = 0;
    const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const m of d.marks) {
      if (m.score == null) continue;
      total += Number(m.score);
      count += 1;
      if (Number(m.score) >= 30) pass += 1;
      gradeCounts[gradeFor(Number(m.score)).grade] += 1;
    }
    return {
      school: d.school,
      overallAvg: count ? total / count : 0,
      entries: count,
      passRate: count ? (pass / count) * 100 : 0,
      publishedExams: d.exams.length,
      studentsAssessed: new Set(d.marks.filter((m) => m.score != null).map((m) => m.student_id)).size,
      gradeCounts,
    };
  });

export const getNectaAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const d = await loadReportData(context.supabase, data.slug);
    const byStudent = new Map<string, number[]>();
    for (const m of d.marks) {
      if (m.score == null) continue;
      const arr = byStudent.get(m.student_id) ?? [];
      arr.push(Number(m.score));
      byStudent.set(m.student_id, arr);
    }
    const divCounts: Record<string, number> = { I: 0, II: 0, III: 0, IV: 0, "0": 0 };
    let assessed = 0;
    for (const [, scores] of byStudent) {
      if (scores.length < 4) continue;
      assessed += 1;
      const { division } = computeDivision(scores);
      divCounts[division] = (divCounts[division] ?? 0) + 1;
    }
    return { school: d.school, assessed, divisions: divCounts };
  });

/* ============ Search ============ */
export const searchStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, q: z.string().max(120).optional().nullable() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    let q = context.supabase
      .from("students")
      .select("id, admission_no, full_name, gender, form_id, forms(name, level)")
      .eq("school_id", school.id)
      .order("full_name")
      .limit(200);
    if (data.q?.trim()) {
      const term = data.q.trim();
      q = q.or(`admission_no.ilike.%${term}%,full_name.ilike.%${term}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { school, rows: rows ?? [] };
  });

/* ============ Students: Promotion ============ */
export const promoteStudents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, from_form_id: z.string().uuid(), to_form_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { data: updated, error } = await context.supabase
      .from("students")
      .update({ form_id: data.to_form_id })
      .eq("school_id", school.id)
      .eq("form_id", data.from_form_id)
      .select("id");
    if (error) throw new Error(error.message);
    return { count: updated?.length ?? 0 };
  });
