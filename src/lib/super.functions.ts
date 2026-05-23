import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: super admin only");
}

export const getSuperOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const [
      { data: schools },
      { count: students },
      { count: exams },
      { count: publishedExams },
    ] = await Promise.all([
      supabaseAdmin
        .from("schools")
        .select("id, slug, name, region, plan, status, created_at, logo_url")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("students").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("exams").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("exams")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
    ]);

    // Per-school student counts
    const counts: Record<string, number> = {};
    if (schools && schools.length) {
      const { data: rows } = await supabaseAdmin
        .from("students")
        .select("school_id");
      for (const r of rows ?? []) {
        counts[r.school_id] = (counts[r.school_id] ?? 0) + 1;
      }
    }

    return {
      stats: {
        schools: schools?.length ?? 0,
        students: students ?? 0,
        exams: exams ?? 0,
        publishedExams: publishedExams ?? 0,
      },
      schools: (schools ?? []).map((s) => ({
        ...s,
        student_count: counts[s.id] ?? 0,
      })),
    };
  });

export const setSchoolStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["active", "suspended", "pending"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("schools")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setSchoolPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        plan: z.enum(["free", "starter", "pro", "enterprise"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("schools")
      .update({ plan: data.plan })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });