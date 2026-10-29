import type { createClient } from "@/lib/supabase/server";

// Internal products (projects with type "Internal Product"), for product
// pickers on leads and customers.
export async function fetchProducts(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .eq("project_type", "internal")
    .order("name");
  return error ? [] : (data ?? []);
}
