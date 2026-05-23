import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](-?[a-z0-9])*$/, "Slug must be lowercase letters, numbers, and dashes");

export const createSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        name: z.string().min(2).max(120),
        region: z.string().max(80).optional().nullable(),
        motto: z.string().max(200).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: id, error } = await supabase.rpc("create_school", {
      _slug: data.slug,
      _name: data.name,
      _region: data.region ?? undefined,
      _motto: data.motto ?? undefined,
    });
    if (error) {
      if (error.message?.includes("schools_slug_key") || error.code === "23505") {
        throw new Error("That URL is already taken. Try another.");
      }
      throw new Error(error.message);
    }
    return { schoolId: id as string, slug: data.slug };
  });

export const getMySchools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, school_id, schools(id, slug, name, logo_url, status, region)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];

    return {
      isSuperAdmin: rows.some((r) => r.role === "super_admin"),
      schools: rows
        .filter((r) => r.schools)
        .map((r) => ({
          role: r.role,
          school: r.schools as {
            id: string;
            slug: string;
            name: string;
            logo_url: string | null;
            status: string;
            region: string | null;
          },
        })),
    };
  });

export const getSchoolBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data }) => {
    const { data: school, error } = await supabaseAdmin
      .from("schools")
      .select("id, slug, name, logo_url, motto, region, status")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!school) return null;

    const [
      { count: studentCount },
      { count: classCount },
      { data: publishedExams },
      { data: forms },
      { data: announcements },
    ] =
      await Promise.all([
        supabaseAdmin
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.id),
        supabaseAdmin
          .from("forms")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.id),
        supabaseAdmin
          .from("exams")
          .select("id, name, year, type, published, form_id, forms(name, level)")
          .eq("school_id", school.id)
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(20),
        supabaseAdmin
          .from("forms")
          .select("id, name, level")
          .eq("school_id", school.id)
          .order("level"),
        supabaseAdmin
          .from("announcements")
          .select("id, title, body, published_at")
          .eq("school_id", school.id)
          .order("published_at", { ascending: false })
          .limit(5),
      ]);

    const latestExam = publishedExams?.[0] ?? null;
    const years = Array.from(new Set((publishedExams ?? []).map((exam) => exam.year))).sort(
      (a, b) => b - a,
    );

    return {
      school,
      stats: {
        students: studentCount ?? 0,
        classes: classCount ?? 0,
      },
      latestExam,
      forms: forms ?? [],
      publishedExams: (publishedExams ?? []).map((exam) => ({
        id: exam.id,
        name: exam.name,
        year: exam.year,
        type: exam.type,
        form_id: exam.form_id,
        form: (exam.forms as { name: string; level: number } | null) ?? null,
      })),
      years,
      announcements: announcements ?? [],
    };
  });

export const searchPublicResults = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        query: z.string().min(1).max(120),
        examId: z.string().uuid().optional().nullable(),
        formLevel: z.coerce.number().int().min(1).max(6).optional().nullable(),
        year: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (!school) return { matches: [] };

    if (data.examId) {
      const { data: exam, error: examErr } = await supabaseAdmin
        .from("exams")
        .select("id, form_id")
        .eq("id", data.examId)
        .eq("school_id", school.id)
        .eq("published", true)
        .maybeSingle();
      if (examErr) throw new Error(examErr.message);
      if (!exam) return { matches: [] };

      const { data: marks, error: marksErr } = await supabaseAdmin
        .from("marks")
        .select("student_id")
        .eq("exam_id", exam.id);
      if (marksErr) throw new Error(marksErr.message);

      const studentIds = Array.from(new Set((marks ?? []).map((mark) => mark.student_id)));
      if (studentIds.length === 0) return { matches: [] };

      let examSearch = supabaseAdmin
        .from("students")
        .select("id, admission_no, full_name, year, forms(name, level), streams(name)")
        .eq("school_id", school.id)
        .in("id", studentIds)
        .limit(20);

      const term = data.query.trim();
      examSearch = examSearch.or(`admission_no.eq.${term},full_name.ilike.%${term}%`);
      if (data.year) examSearch = examSearch.eq("year", data.year);
      if (exam.form_id) examSearch = examSearch.eq("form_id", exam.form_id);

      const { data: examStudents, error: examSearchErr } = await examSearch;
      if (examSearchErr) throw new Error(examSearchErr.message);

      const filteredByExam = (examStudents ?? []).filter((student) =>
        data.formLevel ? (student.forms as { level: number } | null)?.level === data.formLevel : true,
      );

      return {
        matches: filteredByExam.map((student) => ({
          id: student.id,
          admission_no: student.admission_no,
          full_name: student.full_name,
          year: student.year,
          form: (student.forms as { name: string } | null)?.name ?? null,
          stream: (student.streams as { name: string } | null)?.name ?? null,
        })),
      };
    }

    let q = supabaseAdmin
      .from("students")
      .select("id, admission_no, full_name, year, forms(name, level), streams(name)")
      .eq("school_id", school.id)
      .limit(20);

    // Match by admission_no exact, or full_name ilike
    const term = data.query.trim();
    q = q.or(`admission_no.eq.${term},full_name.ilike.%${term}%`);
    if (data.year) q = q.eq("year", data.year);

    const { data: students, error } = await q;
    if (error) throw new Error(error.message);

    const filtered = (students ?? []).filter((s) =>
      data.formLevel ? (s.forms as { level: number } | null)?.level === data.formLevel : true,
    );

    return {
      matches: filtered.map((s) => ({
        id: s.id,
        admission_no: s.admission_no,
        full_name: s.full_name,
        year: s.year,
        form: (s.forms as { name: string } | null)?.name ?? null,
        stream: (s.streams as { name: string } | null)?.name ?? null,
      })),
    };
  });

export const getPublicStudentResult = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        studentId: z.string().uuid(),
        examId: z.string().uuid().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id, name, logo_url, motto")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (!school) throw new Error("School not found");

    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id, admission_no, full_name, year, form_id, forms(name, level), streams(name), school_id")
      .eq("id", data.studentId)
      .maybeSingle();
    if (!student || student.school_id !== school.id) throw new Error("Student not found");

    let examQuery = supabaseAdmin
      .from("exams")
      .select("id, name, year, type, published, form_id")
      .eq("school_id", school.id)
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (data.examId) examQuery = examQuery.eq("id", data.examId);
    else if (student.form_id) examQuery = examQuery.eq("form_id", student.form_id);
    const { data: exams } = await examQuery.limit(1);
    const exam = exams?.[0];
    if (!exam) return { school, student, exam: null, marks: [] };

    const { data: marks } = await supabaseAdmin
      .from("marks")
      .select("score, subjects(name, code)")
      .eq("exam_id", exam.id)
      .eq("student_id", student.id);

    return {
      school,
      student,
      exam,
      marks: (marks ?? []).map((m) => ({
        subject: (m.subjects as { name: string } | null)?.name ?? "",
        code: (m.subjects as { code: string | null } | null)?.code ?? null,
        score: Number(m.score ?? 0),
      })),
    };
  });
