import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugSchema = z
  .string()
  .min(3)
  .max(40)
  .regex(/^[a-z0-9](-?[a-z0-9])*$/);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSchoolId(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from("schools")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("School not found or no access");
  return data.id as string;
}

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: slugSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const schoolId = await resolveSchoolId(supabase, data.slug);
    const { data: rows, error } = await supabase
      .from("announcements")
      .select("id, title, body, published_at, created_at")
      .eq("school_id", schoolId)
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { announcements: rows ?? [] };
  });

export const upsertAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        slug: slugSchema,
        id: z.string().uuid().optional().nullable(),
        title: z.string().min(2).max(200),
        body: z.string().min(2).max(5000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const schoolId = await resolveSchoolId(supabase, data.slug);
    if (data.id) {
      const { error } = await supabase
        .from("announcements")
        .update({ title: data.title, body: data.body })
        .eq("id", data.id)
        .eq("school_id", schoolId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await supabase
      .from("announcements")
      .insert({ school_id: schoolId, title: data.title, body: data.body })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ slug: slugSchema, id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const schoolId = await resolveSchoolId(supabase, data.slug);
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", data.id)
      .eq("school_id", schoolId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });