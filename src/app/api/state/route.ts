import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, checkAdminKey } from "@/lib/supabaseAdmin";
import { questions, getQuestion, durationMs } from "@/lib/questions";
import type { PublicState, Phase } from "@/lib/types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

/**
 * Renvoie l'état complet du jeu.
 *
 * Le filtrage est la partie importante : tant qu'on est en phase
 * "question", la bonne réponse et la photo ne sortent pas du serveur
 * vers les téléphones. Sinon il suffirait d'ouvrir l'onglet réseau
 * pour gagner.
 *
 *   ?playerId=<uuid>   vue joueur
 *   ?key=<ADMIN_KEY>   vue mur / régie (photo + bonne réponse toujours)
 */
export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  const isPresenter = checkAdminKey(req.nextUrl.searchParams.get("key"));

  const { data: state, error } = await supabaseAdmin
    .from("game_state")
    .select("phase, current_index, question_started_at")
    .eq("id", 1)
    .single();

  if (error || !state) {
    return NextResponse.json({ error: "État introuvable" }, { status: 500 });
  }

  const phase = state.phase as Phase;
  const index = state.current_index as number;
  const q = getQuestion(index);
  const revealed = phase === "reveal" || phase === "leaderboard" || phase === "finished";

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id, pseudo, score")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true });

  const roster = players ?? [];

  // Réponses de la question en cours : le compteur sert à savoir quand
  // tout le monde a voté et qu'on peut couper sans attendre le chrono.
  let counts: number[] | null = null;
  let answerCount = 0;
  let myAnswer: { choice: number; points: number } | null = null;

  if (q && index >= 0) {
    const { data: rows } = await supabaseAdmin
      .from("answers")
      .select("player_id, choice, points")
      .eq("question_index", index);

    const all = rows ?? [];
    answerCount = all.length;

    if (revealed || isPresenter) {
      counts = [0, 0, 0, 0];
      for (const r of all) {
        if (r.choice >= 0 && r.choice < 4) counts[r.choice]++;
      }
    }
    if (playerId) {
      const mine = all.find((r) => r.player_id === playerId);
      if (mine) myAnswer = { choice: mine.choice, points: mine.points };
    }
  }

  let you: PublicState["you"] = null;
  if (playerId) {
    const idx = roster.findIndex((p) => p.id === playerId);
    if (idx !== -1) {
      you = {
        pseudo: roster[idx].pseudo,
        score: roster[idx].score,
        rank: idx + 1,
        choice: myAnswer?.choice ?? null,
        lastPoints: revealed ? myAnswer?.points ?? 0 : null,
      };
    }
  }

  const payload: PublicState = {
    phase,
    questionIndex: index,
    total: questions.length,
    startedAt: state.question_started_at,
    durationMs: q ? durationMs(q) : 0,
    playerCount: roster.length,
    answerCount,
    question: q
      ? {
          text: q.text,
          options: q.options,
          ...(q.photo ? { photo: q.photo } : {}),
          // Bonus qui n'apparaît qu'au reveal : jamais avant, même côté
          // régie, pour ne pas la griller sur le mur avant le moment venu.
          ...(q.revealPhoto && revealed ? { revealPhoto: q.revealPhoto } : {}),
        }
      : null,
    correct: q && (revealed || isPresenter) ? q.correct : null,
    counts,
    leaderboard: roster.slice(0, 10),
    you,
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
