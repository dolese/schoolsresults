import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugSchema = z.string().min(3).max(40).regex(/^[a-z0-9](-?[a-z0-9])*$/);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSchool(supabase: any, slug: string) {
  const { data, error } = await supabase.from("schools").select("id, name, slug").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("School not found");
  return data as { id: string; name: string; slug: string };
}

/* ================= Attendance ================= */
export const getAttendanceDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, date: z.string().min(8), form_id: z.string().uuid().optional().nullable() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    let sq = context.supabase.from("students").select("id, full_name, admission_no, form_id").eq("school_id", school.id).order("full_name");
    if (data.form_id) sq = sq.eq("form_id", data.form_id);
    const [{ data: students }, { data: forms }, { data: records }] = await Promise.all([
      sq,
      context.supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
      context.supabase.from("attendance").select("id, student_id, status, note").eq("school_id", school.id).eq("date", data.date),
    ]);
    const byStudent = new Map((records ?? []).map((r: { student_id: string; status: string }) => [r.student_id, r.status]));
    const rows = (students ?? []).map((s: { id: string; full_name: string; admission_no: string; form_id: string | null }) => ({
      ...s,
      status: (byStudent.get(s.id) as string | undefined) ?? "present",
    }));
    const summary = { present: 0, absent: 0, late: 0, excused: 0 } as Record<string, number>;
    for (const r of rows) summary[r.status] = (summary[r.status] ?? 0) + 1;
    return { school, forms: forms ?? [], rows, summary, marked: (records ?? []).length };
  });

export const saveAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      slug: slugSchema,
      date: z.string().min(8),
      entries: z.array(z.object({ student_id: z.string().uuid(), status: z.enum(["present", "absent", "late", "excused"]) })).max(2000),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    if (!data.entries.length) return { count: 0 };
    const payload = data.entries.map((e) => ({ school_id: school.id, student_id: e.student_id, date: data.date, status: e.status }));
    const { error } = await context.supabase.from("attendance").upsert(payload, { onConflict: "student_id,date" });
    if (error) throw new Error(error.message);
    return { count: payload.length };
  });

/* ================= Timetable ================= */
export const getTimetable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, form_id: z.string().uuid().optional().nullable() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    let q = context.supabase
      .from("timetable_slots")
      .select("id, form_id, subject_id, day_of_week, start_time, end_time, teacher_name")
      .eq("school_id", school.id)
      .order("day_of_week")
      .order("start_time");
    if (data.form_id) q = q.eq("form_id", data.form_id);
    const [{ data: slots }, { data: forms }, { data: subjects }] = await Promise.all([
      q,
      context.supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
      context.supabase.from("subjects").select("id, name, code").eq("school_id", school.id).order("name"),
    ]);
    return { school, slots: slots ?? [], forms: forms ?? [], subjects: subjects ?? [] };
  });

export const addTimetableSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      slug: slugSchema,
      form_id: z.string().uuid(),
      subject_id: z.string().uuid(),
      day_of_week: z.coerce.number().int().min(1).max(7),
      start_time: z.string().min(4),
      end_time: z.string().min(4),
      teacher_name: z.string().max(120).optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("timetable_slots").insert({
      school_id: school.id,
      form_id: data.form_id,
      subject_id: data.subject_id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      teacher_name: data.teacher_name?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTimetableSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema, id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("timetable_slots").delete().eq("id", data.id).eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ================= Finance ================= */
export const getFeeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const [{ data: students }, { data: fees }, { data: payments }] = await Promise.all([
      context.supabase.from("students").select("id, full_name, admission_no, form_id, forms(name)").eq("school_id", school.id).order("full_name"),
      context.supabase.from("fees").select("id, student_id, label, amount_due, due_date").eq("school_id", school.id),
      context.supabase.from("fee_payments").select("id, student_id, amount").eq("school_id", school.id),
    ]);
    const dueBy = new Map<string, number>();
    for (const f of fees ?? []) dueBy.set(f.student_id, (dueBy.get(f.student_id) ?? 0) + Number(f.amount_due ?? 0));
    const paidBy = new Map<string, number>();
    for (const p of payments ?? []) paidBy.set(p.student_id, (paidBy.get(p.student_id) ?? 0) + Number(p.amount ?? 0));
    const rows = (students ?? [])
      .map((s: { id: string; full_name: string; admission_no: string; forms: { name: string } | null }) => {
        const due = dueBy.get(s.id) ?? 0;
        const paid = paidBy.get(s.id) ?? 0;
        return { id: s.id, full_name: s.full_name, admission_no: s.admission_no, form: s.forms?.name ?? "—", due, paid, balance: due - paid };
      })
      .filter((r: { due: number; paid: number }) => r.due > 0 || r.paid > 0);
    const totals = rows.reduce(
      (acc: { due: number; paid: number }, r: { due: number; paid: number }) => ({ due: acc.due + r.due, paid: acc.paid + r.paid }),
      { due: 0, paid: 0 },
    );
    return { school, rows, totals, cleared: rows.filter((r: { balance: number }) => r.balance <= 0).length };
  });

export const listStudentsBasic = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { data: students } = await context.supabase
      .from("students")
      .select("id, full_name, admission_no")
      .eq("school_id", school.id)
      .order("full_name")
      .limit(1000);
    return { school, students: students ?? [] };
  });

export const addFee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      slug: slugSchema,
      student_id: z.string().uuid(),
      label: z.string().min(1).max(80),
      amount_due: z.coerce.number().min(0),
      due_date: z.string().optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("fees").insert({
      school_id: school.id,
      student_id: data.student_id,
      label: data.label.trim(),
      amount_due: data.amount_due,
      due_date: data.due_date || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ slug: slugSchema }).parse(i))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { data: rows } = await context.supabase
      .from("fee_payments")
      .select("id, amount, method, reference, paid_at, students(full_name, admission_no)")
      .eq("school_id", school.id)
      .order("paid_at", { ascending: false })
      .limit(300);
    const total = (rows ?? []).reduce((a: number, r: { amount: number }) => a + Number(r.amount ?? 0), 0);
    return { school, rows: rows ?? [], total };
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      slug: slugSchema,
      student_id: z.string().uuid(),
      amount: z.coerce.number().min(0),
      method: z.enum(["cash", "bank", "mobile"]),
      reference: z.string().max(80).optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    const { error } = await context.supabase.from("fee_payments").insert({
      school_id: school.id,
      student_id: data.student_id,
      amount: data.amount,
      method: data.method,
      reference: data.reference?.trim() || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
