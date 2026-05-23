import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](-?[a-z0-9])*$/);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSchool(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, slug, motto, logo_url, region, status, plan")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("School not found or you do not have access");
  return data as {
    id: string;
    name: string;
    slug: string;
    motto: string | null;
    logo_url: string | null;
    region: string | null;
    status: string;
    plan: string;
  };
}

export const getSchoolSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const school = await resolveSchool(context.supabase, data.slug);
    return { school };
  });

export const updateSchoolSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        name: z.string().min(2).max(120),
        region: z.string().max(80).nullable(),
        motto: z.string().max(200).nullable(),
        logo_url: z.string().url().max(500).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { error } = await supabase
      .from("schools")
      .update({
        name: data.name.trim(),
        region: data.region?.trim() || null,
        motto: data.motto?.trim() || null,
        logo_url: data.logo_url?.trim() || null,
      })
      .eq("id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAcademicStructure = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const [{ data: forms, error: formsErr }, { data: subjects, error: subjectsErr }] =
      await Promise.all([
        supabase.from("forms").select("id, name, level").eq("school_id", school.id).order("level"),
        supabase
          .from("subjects")
          .select("id, name, code")
          .eq("school_id", school.id)
          .order("name"),
      ]);
    if (formsErr) throw new Error(formsErr.message);
    if (subjectsErr) throw new Error(subjectsErr.message);
    return { school, forms: forms ?? [], subjects: subjects ?? [] };
  });

export const upsertForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        id: z.string().uuid().optional().nullable(),
        name: z.string().min(2).max(40),
        level: z.coerce.number().int().min(1).max(6),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const row = {
      school_id: school.id,
      name: data.name.trim(),
      level: data.level,
    };

    if (data.id) {
      const { error } = await supabase
        .from("forms")
        .update(row)
        .eq("id", data.id)
        .eq("school_id", school.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: inserted, error } = await supabase
      .from("forms")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ slug: slugSchema, id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { error } = await supabase
      .from("forms")
      .delete()
      .eq("id", data.id)
      .eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        id: z.string().uuid().optional().nullable(),
        name: z.string().min(2).max(80),
        code: z.string().max(20).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const row = {
      school_id: school.id,
      name: data.name.trim(),
      code: data.code?.trim().toUpperCase() || null,
    };

    if (data.id) {
      const { error } = await supabase
        .from("subjects")
        .update(row)
        .eq("id", data.id)
        .eq("school_id", school.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: inserted, error } = await supabase
      .from("subjects")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ slug: slugSchema, id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const school = await resolveSchool(supabase, data.slug);
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", data.id)
      .eq("school_id", school.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
