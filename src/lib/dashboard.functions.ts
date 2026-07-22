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
    .select("id, name, slug, motto, region, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("School not found or you don't have access");
  return data as { id: string; name: string; slug: string; motto: string | null; region: string | null; status: string };
}

/* ---------------- Analytics ---------------- */
export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const [
      { count: students },
      { count: exams },
      { count: published },
      { count: announcements },
      { data: forms },
      { count: subjects },
      { count: marks },
    ] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", school.id),
      supabase.from("exams").select("id", { count: "exact", head: true }).eq("school_id", school.id),
      supabase.from("exams").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("published", true),
      supabase.from("announcements").select("id", { count: "exact", head: true }).eq("school_id", school.id),
      supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
      supabase.from("subjects").select("id", { count: "exact", head: true }).eq("school_id", school.id),
      supabase.from("marks").select("id", { count: "exact", head: true }),
    ]);

    // gender split
    const { data: genders } = await supabase
      .from("students")
      .select("gender")
      .eq("school_id", school.id);
    const gCounts = { M: 0, F: 0, U: 0 };
    for (const g of genders ?? []) {
      if (g.gender === "M") gCounts.M++;
      else if (g.gender === "F") gCounts.F++;
      else gCounts.U++;
    }

    // per-form student counts
    const { data: perForm } = await supabase
      .from("students")
      .select("form_id")
      .eq("school_id", school.id);
    const formCount = new Map<string, number>();
    for (const r of perForm ?? []) if (r.form_id) formCount.set(r.form_id, (formCount.get(r.form_id) ?? 0) + 1);
    const formsWithCount = (forms ?? []).map((f) => ({ id: f.id, name: f.name, level: f.level, count: formCount.get(f.id) ?? 0 }));

    return {
      school,
      totals: {
        students: students ?? 0,
        exams: exams ?? 0,
        published: published ?? 0,
        announcements: announcements ?? 0,
        subjects: subjects ?? 0,
        marks: marks ?? 0,
      },
      genders: gCounts,
      forms: formsWithCount,
    };
  });

/* ---------------- Rankings ---------------- */
export const getRankings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, examId: z.string().uuid().optional().nullable() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { data: exams } = await supabase
      .from("exams")
      .select("id, name, year, form_id, published, forms(name, level)")
      .eq("school_id", school.id)
      .eq("published", true)
      .order("created_at", { ascending: false });

    const examList = exams ?? [];
    const selected = data.examId ?? examList[0]?.id ?? null;
    if (!selected) return { school, exams: examList, examId: null, rows: [] };

    const exam = examList.find((e) => e.id === selected);
    if (!exam) return { school, exams: examList, examId: selected, rows: [] };

    const [{ data: students }, { data: marks }] = await Promise.all([
      supabase.from("students").select("id, admission_no, full_name, gender").eq("school_id", school.id).eq("form_id", exam.form_id!),
      supabase.from("marks").select("student_id, subject_id, score").eq("exam_id", selected),
    ]);

    const byStudent = new Map<string, number[]>();
    for (const m of marks ?? []) {
      if (m.score == null) continue;
      const arr = byStudent.get(m.student_id) ?? [];
      arr.push(Number(m.score));
      byStudent.set(m.student_id, arr);
    }

    const rows = (students ?? []).map((s) => {
      const scores = byStudent.get(s.id) ?? [];
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const { points, division } = scores.length >= 4 ? computeDivision(scores) : { points: 0, division: "-" };
      return { id: s.id, admission_no: s.admission_no, full_name: s.full_name, gender: s.gender, subjects: scores.length, avg, points, division };
    });
    rows.sort((a, b) => b.avg - a.avg);
    let position = 0;
    let last = -1;
    let same = 0;
    const ranked = rows.map((r, idx) => {
      if (r.avg !== last) {
        position = idx + 1;
        last = r.avg;
        same = 1;
      } else {
        same++;
      }
      return { ...r, position };
    });
    return { school, exams: examList, examId: selected, rows: ranked };
  });

/* ---------------- Merit list (top across published exams) ---------------- */
export const getMeritList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, formId: z.string().uuid().optional().nullable(), limit: z.number().int().min(1).max(200).optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    let examsQ = supabase
      .from("exams")
      .select("id, name, year, form_id, forms(name, level)")
      .eq("school_id", school.id)
      .eq("published", true);
    if (data.formId) examsQ = examsQ.eq("form_id", data.formId);
    const { data: exams } = await examsQ;
    const examIds = (exams ?? []).map((e) => e.id);
    if (!examIds.length) return { school, forms: [], entries: [] };

    const [{ data: students }, { data: marks }, { data: forms }] = await Promise.all([
      supabase.from("students").select("id, admission_no, full_name, gender, form_id, forms(name, level)").eq("school_id", school.id),
      supabase.from("marks").select("student_id, exam_id, score").in("exam_id", examIds),
      supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
    ]);

    type Acc = { total: number; count: number; exams: Set<string> };
    const acc = new Map<string, Acc>();
    for (const m of marks ?? []) {
      if (m.score == null) continue;
      const cur = acc.get(m.student_id) ?? { total: 0, count: 0, exams: new Set() };
      cur.total += Number(m.score);
      cur.count += 1;
      cur.exams.add(m.exam_id);
      acc.set(m.student_id, cur);
    }
    const entries = (students ?? [])
      .map((s) => {
        const a = acc.get(s.id);
        if (!a || a.count === 0) return null;
        return {
          id: s.id,
          admission_no: s.admission_no,
          full_name: s.full_name,
          gender: s.gender,
          form_id: s.form_id,
          form: (s.forms as { name: string } | null)?.name ?? "-",
          avg: a.total / a.count,
          examCount: a.exams.size,
        };
      })
      .filter(Boolean) as Array<{ id: string; admission_no: string; full_name: string; gender: string | null; form_id: string | null; form: string; avg: number; examCount: number }>;
    entries.sort((a, b) => b.avg - a.avg);
    const limited = entries.slice(0, data.limit ?? 100);
    return { school, forms: forms ?? [], entries: limited };
  });

/* ---------------- Report cards list ---------------- */
export const listReportCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, examId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { data: exam } = await supabase
      .from("exams")
      .select("id, name, year, form_id, published, forms(name, level)")
      .eq("id", data.examId)
      .eq("school_id", school.id)
      .maybeSingle();
    if (!exam) throw new Error("Exam not found");

    const [{ data: students }, { data: marks }] = await Promise.all([
      supabase.from("students").select("id, admission_no, full_name, gender").eq("school_id", school.id).eq("form_id", exam.form_id!).order("admission_no"),
      supabase.from("marks").select("student_id, score").eq("exam_id", data.examId),
    ]);

    const byStudent = new Map<string, number[]>();
    for (const m of marks ?? []) {
      if (m.score == null) continue;
      const arr = byStudent.get(m.student_id) ?? [];
      arr.push(Number(m.score));
      byStudent.set(m.student_id, arr);
    }
    const rows = (students ?? []).map((s) => {
      const scores = byStudent.get(s.id) ?? [];
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const grade = scores.length ? gradeFor(avg).grade : "-";
      const { division } = scores.length >= 4 ? computeDivision(scores) : { division: "-" };
      return { id: s.id, admission_no: s.admission_no, full_name: s.full_name, gender: s.gender, subjects: scores.length, avg, grade, division };
    });
    return { school, exam, rows };
  });

/* ---------------- Users in this school ---------------- */
export const listSchoolUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("id, user_id, role, created_at")
      .eq("school_id", school.id)
      .order("created_at");

    // Try to resolve emails via admin (best-effort, requires service_role)
    const emails = new Map<string, { email: string | null; name: string | null }>();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const r of roles ?? []) {
        if (emails.has(r.user_id)) continue;
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        emails.set(r.user_id, {
          email: u?.user?.email ?? null,
          name: (u?.user?.user_metadata as { display_name?: string } | undefined)?.display_name ?? null,
        });
      }
    } catch {
      // ignore
    }
    const users = (roles ?? []).map((r) => ({
      id: r.id,
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      email: emails.get(r.user_id)?.email ?? null,
      display_name: emails.get(r.user_id)?.name ?? null,
    }));
    return { school, users };
  });

/* ---------------- Recent activity feed ---------------- */
export const listRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const [{ data: exams }, { data: anns }, { data: students }] = await Promise.all([
      supabase.from("exams").select("id, name, created_at, published").eq("school_id", school.id).order("created_at", { ascending: false }).limit(15),
      supabase.from("announcements").select("id, title, published_at").eq("school_id", school.id).order("published_at", { ascending: false }).limit(15),
      supabase.from("students").select("id, full_name, admission_no, created_at").eq("school_id", school.id).order("created_at", { ascending: false }).limit(15),
    ]);
    const items: { kind: string; title: string; at: string; id: string }[] = [];
    for (const e of exams ?? []) items.push({ kind: e.published ? "exam-published" : "exam", title: e.name, at: e.created_at, id: e.id });
    for (const a of anns ?? []) items.push({ kind: "announcement", title: a.title, at: a.published_at, id: a.id });
    for (const s of students ?? []) items.push({ kind: "student", title: `${s.full_name} (${s.admission_no})`, at: s.created_at, id: s.id });
    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { school, items: items.slice(0, 30) };
  });
