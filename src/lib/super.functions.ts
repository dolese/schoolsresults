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

export const getSchoolDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);

    const { data: school, error: schoolErr } = await supabaseAdmin
      .from("schools")
      .select("id, slug, name, region, motto, plan, status, created_at, logo_url")
      .eq("id", data.id)
      .maybeSingle();
    if (schoolErr) throw new Error(schoolErr.message);
    if (!school) throw new Error("School not found");

    const [
      { data: roles },
      { count: students },
      { count: exams },
      { count: publishedExams },
      { count: announcements },
    ] = await Promise.all([
      supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .eq("school_id", data.id),
      supabaseAdmin
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", data.id),
      supabaseAdmin
        .from("exams")
        .select("id", { count: "exact", head: true })
        .eq("school_id", data.id),
      supabaseAdmin
        .from("exams")
        .select("id", { count: "exact", head: true })
        .eq("school_id", data.id)
        .eq("published", true),
      supabaseAdmin
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("school_id", data.id),
    ]);

    // Hydrate member emails via admin auth API
    const members: { user_id: string; role: string; email: string | null }[] = [];
    for (const r of roles ?? []) {
      let email: string | null = null;
      try {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        email = u?.user?.email ?? null;
      } catch {
        email = null;
      }
      members.push({ user_id: r.user_id, role: r.role, email });
    }

    return {
      school,
      stats: {
        students: students ?? 0,
        exams: exams ?? 0,
        publishedExams: publishedExams ?? 0,
        announcements: announcements ?? 0,
      },
      members,
    };
  });

export const getRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const [
      { data: recentSchools },
      { data: recentAnnouncementsRaw },
      { data: recentExamsRaw },
      { data: allSchools },
    ] = await Promise.all([
      supabaseAdmin
        .from("schools")
        .select("id, slug, name, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("announcements")
        .select("id, title, created_at, school_id")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("exams")
        .select("id, name, created_at, published, school_id")
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin.from("schools").select("id, name, slug"),
    ]);

    const schoolMap = new Map<string, { name: string; slug: string }>();
    for (const s of allSchools ?? []) {
      schoolMap.set(s.id, { name: s.name, slug: s.slug });
    }

    return {
      recentSchools: recentSchools ?? [],
      recentAnnouncements: (recentAnnouncementsRaw ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        created_at: a.created_at,
        school_name: schoolMap.get(a.school_id)?.name ?? null,
        school_slug: schoolMap.get(a.school_id)?.slug ?? null,
      })),
      recentExams: (recentExamsRaw ?? []).map((e) => ({
        id: e.id,
        name: e.name,
        created_at: e.created_at,
        published: e.published,
        school_name: schoolMap.get(e.school_id)?.name ?? null,
        school_slug: schoolMap.get(e.school_id)?.slug ?? null,
      })),
    };
  });