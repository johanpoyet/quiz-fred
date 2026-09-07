import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client serveur uniquement. Utilise la clé service_role, qui contourne
 * RLS — elle ne doit jamais atteindre le navigateur, donc ce module ne
 * doit être importé que depuis des route handlers.
 *
 * L'initialisation est paresseuse : `createClient` n'est appelé qu'à la
 * première requête, pas au chargement du module. Sinon `next build`
 * plante en collectant les pages quand les variables ne sont pas encore
 * définies (typiquement au premier déploiement Vercel).
 */
let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Variables Supabase manquantes : renseigne NEXT_PUBLIC_SUPABASE_URL et " +
        "SUPABASE_SERVICE_ROLE_KEY (dans .env.local en local, dans les " +
        "Environment Variables du projet sur Vercel)."
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * Proxy vers le vrai client : `supabaseAdmin.from(...)` fonctionne comme
 * avant, mais le client n'est construit qu'au premier accès.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function checkAdminKey(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  return key === expected;
}
