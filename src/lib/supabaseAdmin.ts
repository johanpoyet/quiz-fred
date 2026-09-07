import { createClient } from "@supabase/supabase-js";

/**
 * Client serveur uniquement. Utilise la clé service_role, qui contourne
 * RLS — elle ne doit jamais atteindre le navigateur, donc ce module ne
 * doit être importé que depuis des route handlers.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export function checkAdminKey(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  return key === expected;
}
