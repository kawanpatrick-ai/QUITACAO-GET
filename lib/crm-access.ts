import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

// O acesso ao CRM depende exclusivamente de uma membership ativa no banco.
export async function checkCrmAccess(
  db: SupabaseClient<Database> | null | undefined,
  user: Pick<User, "id" | "email"> | null | undefined,
): Promise<boolean> {
  if (!db || !user?.id || !user.email) return false;
  try {
    const { data, error } = await db
      .from("crm_memberships")
      .select("enabled, role")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .maybeSingle();

    return (
      !error &&
      data?.enabled === true &&
      (data.role === "admin" || data.role === "operator")
    );
  } catch {
    return false;
  }
}
