"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "./supabaseBrowser";
import type { PublicState } from "./types";

/**
 * Garde la page synchronisée avec l'état du jeu.
 *
 * Le Realtime Supabase sert uniquement de signal ("quelque chose a
 * bougé"), et c'est /api/state qui reste la source de vérité. Ça évite
 * de dupliquer la logique de filtrage côté client, et surtout ça permet
 * le filet de secours : si le WebSocket tombe pendant la soirée — réseau
 * saturé, téléphone en veille, tunnel 4G — le polling toutes les 3
 * secondes rattrape l'écran sans que personne ne s'en aperçoive.
 */
export function useGameState(opts: { playerId?: string | null; adminKey?: string | null }) {
  const { playerId, adminKey } = opts;
  const [state, setState] = useState<PublicState | null>(null);
  const [online, setOnline] = useState(true);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const params = new URLSearchParams();
      if (playerId) params.set("playerId", playerId);
      if (adminKey) params.set("key", adminKey);
      const res = await fetch(`/api/state?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        setState(await res.json());
        setOnline(true);
      }
    } catch {
      setOnline(false);
    } finally {
      inFlight.current = false;
    }
  }, [playerId, adminKey]);

  useEffect(() => {
    refresh();

    const channel = supabaseBrowser
      .channel("game")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, refresh)
      .subscribe();

    const poll = setInterval(refresh, 3000);

    // Un téléphone qui sort de veille doit se resynchroniser tout de suite,
    // pas attendre le prochain tick.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      supabaseBrowser.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { state, online, refresh };
}

/** Secondes restantes, calculées depuis l'horodatage serveur. */
export function useCountdown(startedAt: string | null, durationMs: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!startedAt || !durationMs) {
      setRemaining(0);
      return;
    }
    const end = new Date(startedAt).getTime() + durationMs;
    const tick = () => setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [startedAt, durationMs]);

  return remaining;
}
