import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getQuestion, durationMs } from "@/lib/questions";
import { computePoints, GRACE_MS } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/**
 * Enregistre une réponse et calcule les points.
 *
 * Tout est validé côté serveur — la phase, l'horloge, l'unicité. Le
 * téléphone envoie seulement "j'ai cliqué sur le bouton 2" ; il ne dit
 * ni quand, ni combien ça vaut.
 */
export async function POST(req: NextRequest) {
  let body: { playerId?: string; questionIndex?: number; choice?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible" }, { status: 400 });
  }

  const { playerId, questionIndex, choice } = body;

  if (!playerId || typeof questionIndex !== "number" || typeof choice !== "number") {
    return NextResponse.json({ error: "Requête incomplète" }, { status: 400 });
  }
  if (choice < 0 || choice > 3) {
    return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
  }

  const { data: state } = await supabaseAdmin
    .from("game_state")
    .select("phase, current_index, question_started_at")
    .eq("id", 1)
    .single();

  if (!state) {
    return NextResponse.json({ error: "État introuvable" }, { status: 500 });
  }

  // On refuse une réponse à une question qui n'est plus à l'écran :
  // sans ça, un téléphone en retard marquerait des points sur l'ancienne.
  if (state.phase !== "question" || state.current_index !== questionIndex) {
    return NextResponse.json({ error: "Les votes sont fermés" }, { status: 409 });
  }

  const q = getQuestion(questionIndex);
  if (!q || !state.question_started_at) {
    return NextResponse.json({ error: "Question introuvable" }, { status: 400 });
  }

  const limit = durationMs(q);
  const elapsed = Date.now() - new Date(state.question_started_at).getTime();

  if (elapsed > limit + GRACE_MS) {
    return NextResponse.json({ error: "Trop tard !" }, { status: 409 });
  }

  const isCorrect = q.correct.includes(choice);
  const points = computePoints(isCorrect, elapsed, limit);

  // La contrainte d'unicité (player_id, question_index) fait le travail :
  // si le joueur a déjà voté, l'insert échoue et aucun point n'est ajouté.
  const { error } = await supabaseAdmin
    .from("answers")
    .insert({ player_id: playerId, question_index: questionIndex, choice, points });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Tu as déjà répondu" }, { status: 409 });
    }
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }

  if (points > 0) {
    await supabaseAdmin.rpc("add_score", { p_id: playerId, pts: points });
  }

  // On ne renvoie pas si c'était juste : la révélation se fait sur le mur,
  // tous ensemble. C'est là qu'est le plaisir du jeu.
  return NextResponse.json({ ok: true, choice });
}
