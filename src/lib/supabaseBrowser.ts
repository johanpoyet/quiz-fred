"use client";

import { createClient } from "@supabase/supabase-js";

/** Client navigateur : clé anon, lecture seule (voir les policies RLS). */
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { realtime: { params: { eventsPerSecond: 10 } } }
);
