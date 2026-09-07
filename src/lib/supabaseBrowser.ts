"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client navigateur : clé anon, lecture seule (voir les policies RLS).
 *
 * Initialisation paresseuse pour la même raison que `supabaseAdmin` :
 * ne pas appeler `createClient` pendant le build de Next.js.
 */
let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  cached = createClient(url, anonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return cached;
}

export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
