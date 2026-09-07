import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, checkAdminKey } from "@/lib/supabaseAdmin";
import { questions } from "@/lib/questions";
import type { Phase } from "@/lib/types";

export const dynamic = "force-dynamic";

type Action =
  | "start"       // lance la question courante (démarre le chrono)
  | "reveal"      // ferme les votes et affiche la bonne réponse
  | "leaderboard" // affiche le classement
  | "next"        // passe à la question suivante, en attente de "start"
  | "prev"        // revient en arrière (rattrapage si fausse manip)
  | "lobby"       // retour à l'écran d'accueil
  | "finish"      // podium final
  | "kick"        // exclut un joueur
  | "reset";      // efface joueurs, réponses et scores

/**
 * Toutes les commandes de la régie passent par ici. Une seule route,
 * un seul endroit où l'état peut changer — plus facile à suivre quand
 * on pilote en direct devant 50 personnes.
 */
export async function POST(req: NextRequest) {
  let body: { key?: string; action?: Action; playerId?: string; index?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible" }, { status: 400 });
  }

  if (!checkAdminKey(body.key)) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const { data: state } = await supabaseAdmin
    .from("game_state")
    .select("phase, current_index")
    .eq("id", 1)
    .single();

  if (!state) {
    return NextResponse.json({ error: "État introuvable" }, { status: 500 });
  }

  const current = state.current_index as number;
  const last = questions.length - 1;

  const apply = async (patch: {
    phase?: Phase;
    current_index?: number;
    question_started_at?: string | null;
  }) => {
    const { error } = await supabaseAdmin
      .from("game_state")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
  };

  try {
    switch (body.action) {
      case "start": {
        const target = current < 0 ? 0 : current;
        if (target > last) {
          return NextResponse.json({ error: "Plus de questions" }, { status: 400 });
        }
        // L'horodatage est posé ici, côté serveur : c'est la référence
        // unique pour le chrono de tous les téléphones et pour le calcul
        // des points. Aucune horloge de client n'entre en jeu.
        await apply({
          phase: "question",
          current_index: target,
          question_started_at: new Date().toISOString(),
        });
        break;
      }

      case "reveal":
        await apply({ phase: "reveal" });
        break;

      case "leaderboard":
        await apply({ phase: "leaderboard" });
        break;

      case "next": {
        const target = Math.min(current + 1, last);
        await apply({
          phase: "lobby",
          current_index: target,
          question_started_at: null,
        });
        break;
      }

      case "prev": {
        const target = Math.max(current - 1, 0);
        await apply({
          phase: "lobby",
          current_index: target,
          question_started_at: null,
        });
        break;
      }

      case "lobby":
        await apply({ phase: "lobby", current_index: -1, question_started_at: null });
        break;

      case "finish":
        await apply({ phase: "finished" });
        break;

      case "kick": {
        if (!body.playerId) {
          return NextResponse.json({ error: "Joueur manquant" }, { status: 400 });
        }
        await supabaseAdmin.from("players").delete().eq("id", body.playerId);
        break;
      }

      case "reset": {
        // Suppression directe plutôt que via la fonction SQL `reset_game` :
        // une dépendance de moins, ça marche même si le cache de schéma
        // PostgREST n'a pas encore vu la fonction, et les erreurs remontent.
        const delAnswers = await supabaseAdmin
          .from("answers")
          .delete()
          .gte("question_index", 0);
        if (delAnswers.error) throw new Error(delAnswers.error.message);

        const delPlayers = await supabaseAdmin
          .from("players")
          .delete()
          .not("id", "is", null);
        if (delPlayers.error) throw new Error(delPlayers.error.message);

        await apply({
          phase: "lobby",
          current_index: -1,
          question_started_at: null,
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Commande impossible";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
