import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const MAX_PSEUDO = 16;

/**
 * Inscription d'un joueur. Renvoie un id que le téléphone garde en
 * localStorage : c'est ce qui permet de retrouver son score après une
 * mise en veille ou un passage sur WhatsApp.
 */
export async function POST(req: NextRequest) {
  let body: { pseudo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible" }, { status: 400 });
  }

  const pseudo = (body.pseudo ?? "").trim().replace(/\s+/g, " ");

  if (pseudo.length < 2) {
    return NextResponse.json(
      { error: "Choisis un prénom d'au moins 2 lettres." },
      { status: 400 }
    );
  }
  if (pseudo.length > MAX_PSEUDO) {
    return NextResponse.json(
      { error: `${MAX_PSEUDO} caractères maximum.` },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("players")
    .insert({ pseudo })
    .select("id, pseudo, score")
    .single();

  if (error) {
    // 23505 = violation d'unicité sur le pseudo
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ce prénom est déjà pris. Ajoute ton nom de famille." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Inscription impossible." }, { status: 500 });
  }

  return NextResponse.json(data);
}
