import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](-?[a-z0-9])*$/);

const examTypes = [
  "march",
  "midterm",
  "mock",
  "pre_necta",
  "terminal",
  "annual",
  "september",
  "pre_mock",
] as const;

async function resolveSchoolId(
  supabase: Awaited<ReturnType<typeof getCtx>>["supabase"],
  slug: string,
) {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, slug, motto, logo_url, region, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("School not found or you don't have access");
  return data;
}

// Helper type for context (not used at runtime)
function getCtx() {
  return null as unknown as {
    supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>;
  };
}

/* ---------------- Overview ---------------- */

export const getManageOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);

    const [{ count: students }, { count: exams }, { count: published }, { data: forms }] =
      await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase.from("exams").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase
          .from("exams")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.id)
          .eq("published", true),
        supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
      ]);

    return {
      school,
      stats: {
        students: students ?? 0,
        exams: exams ?? 0,
        published: published ?? 0,
        forms: forms?.length ?? 0,
      },
      forms: forms ?? [],
    };
  });

/* ---------------- Forms / Subjects ---------------- */

export const listFormsAndSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    const [{ data: forms }, { data: subjects }] = await Promise.all([
      supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
      supabase.from("subjects").select("id, name, code").eq("school_id", school.id).order("name"),
    ]);
    return { schoolId: school.id, forms: forms ?? [], subjects: subjects ?? [] };
  });

/* ---------------- Students ---------------- */

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        formId: z.string().uuid().optional().nullable(),
        search: z.string().max(120).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    let q = supabase
      .from("students")
      .select("id, admission_no, full_name, year, gender, form_id, forms(name, level)")
      .eq("school_id", school.id)
      .order("admission_no")
      .limit(500);
    if (data.formId) q = q.eq("form_id", data.formId);
    if (data.search?.trim()) {
      const term = data.search.trim();
      q = q.or(`admission_no.ilike.%${term}%,full_name.ilike.%${term}%`);
    }
    const { data: students, error } = await q;
    if (error) throw new Error(error.message);
    return { schoolId: school.id, students: students ?? [] };
  });

export const upsertStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        id: z.string().uuid().optional().nullable(),
        admission_no: z.string().min(1).max(40),
        full_name: z.string().min(2).max(120),
        form_id: z.string().uuid().optional().nullable(),
        year: z.coerce.number().int().min(2000).max(2100),
        gender: z.enum(["M", "F"]).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    const row = {
      school_id: school.id,
      admission_no: data.admission_no.trim(),
      full_name: data.full_name.trim(),
      form_id: data.form_id || null,
      year: data.year,
      gender: data.gender || null,
    };
    if (data.id) {
      const { error } = await supabase.from("students").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabase
      .from("students")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ slug: slugSchema, id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", data.id)
      .eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Exams ---------------- */

export const listExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    const { data: exams, error } = await supabase
      .from("exams")
      .select("id, name, type, year, published, form_id, forms(name, level), created_at")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { schoolId: school.id, exams: exams ?? [] };
  });

export const createExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        name: z.string().min(2).max(120),
        type: z.enum(examTypes),
        year: z.coerce.number().int().min(2000).max(2100),
        form_id: z.string().uuid(),
        subject_ids: z.array(z.string().uuid()).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    const { data: exam, error } = await supabase
      .from("exams")
      .insert({
        school_id: school.id,
        name: data.name,
        type: data.type,
        year: data.year,
        form_id: data.form_id,
        published: false,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const examSubjects = data.subject_ids.map((sid) => ({
      exam_id: exam.id,
      subject_id: sid,
      max_marks: 100,
    }));
    const { error: esErr } = await supabase.from("exam_subjects").insert(examSubjects);
    if (esErr) throw new Error(esErr.message);
    return { id: exam.id };
  });

export const setExamPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ slug: slugSchema, id: z.string().uuid(), published: z.boolean() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    const { error } = await supabase
      .from("exams")
      .update({ published: data.published })
      .eq("id", data.id)
      .eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ slug: slugSchema, id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    await supabase.from("exam_subjects").delete().eq("exam_id", data.id);
    await supabase.from("marks").delete().eq("exam_id", data.id);
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", data.id)
      .eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Marks grid ---------------- */

export const getExamMarksGrid = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ slug: slugSchema, examId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);

    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .select("id, name, type, year, form_id, published, forms(name, level)")
      .eq("id", data.examId)
      .eq("school_id", school.id)
      .maybeSingle();
    if (examErr) throw new Error(examErr.message);
    if (!exam) throw new Error("Exam not found");

    const [{ data: examSubjects }, { data: students }, { data: marks }] = await Promise.all([
      supabase
        .from("exam_subjects")
        .select("id, subject_id, max_marks, subjects(id, name, code)")
        .eq("exam_id", exam.id),
      supabase
        .from("students")
        .select("id, admission_no, full_name")
        .eq("school_id", school.id)
        .eq("form_id", exam.form_id!)
        .order("admission_no"),
      supabase
        .from("marks")
        .select("id, student_id, subject_id, score")
        .eq("exam_id", exam.id),
    ]);

    return {
      school,
      exam,
      subjects: (examSubjects ?? []).map((es) => ({
        id: (es.subjects as { id: string } | null)?.id ?? es.subject_id,
        name: (es.subjects as { name: string } | null)?.name ?? "",
        code: (es.subjects as { code: string | null } | null)?.code ?? null,
        max_marks: es.max_marks,
      })),
      students: students ?? [],
      marks: (marks ?? []).map((m) => ({
        student_id: m.student_id,
        subject_id: m.subject_id,
        score: m.score == null ? null : Number(m.score),
      })),
    };
  });

export const saveMarksBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        examId: z.string().uuid(),
        entries: z
          .array(
            z.object({
              student_id: z.string().uuid(),
              subject_id: z.string().uuid(),
              score: z.number().min(0).max(100).nullable(),
            }),
          )
          .max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchoolId(supabase, data.slug);
    // Verify exam belongs to school
    const { data: exam } = await supabase
      .from("exams")
      .select("id")
      .eq("id", data.examId)
      .eq("school_id", school.id)
      .maybeSingle();
    if (!exam) throw new Error("Exam not found");

    // Delete cleared entries (score null) then upsert valid ones
    const toClear = data.entries.filter((e) => e.score === null);
    const toUpsert = data.entries.filter((e) => e.score !== null);

    for (const c of toClear) {
      await supabase
        .from("marks")
        .delete()
        .eq("exam_id", data.examId)
        .eq("student_id", c.student_id)
        .eq("subject_id", c.subject_id);
    }

    if (toUpsert.length) {
      // Manual upsert: try update, then insert if no row
      for (const e of toUpsert) {
        const { data: existing } = await supabase
          .from("marks")
          .select("id")
          .eq("exam_id", data.examId)
          .eq("student_id", e.student_id)
          .eq("subject_id", e.subject_id)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("marks")
            .update({ score: e.score, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("marks").insert({
            exam_id: data.examId,
            student_id: e.student_id,
            subject_id: e.subject_id,
            score: e.score,
          });
        }
      }
    }
    return { saved: toUpsert.length, cleared: toClear.length };
  });
