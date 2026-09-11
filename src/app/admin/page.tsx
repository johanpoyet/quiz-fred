"use client";

import { useEffect, useState } from "react";
import { useGameState, useCountdown } from "@/lib/useGameState";

const KEY_STORAGE = "quiz-anniv:adminKey";

export default function AdminPage() {
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setKey(localStorage.getItem(KEY_STORAGE));
    setReady(true);
  }, []);

  if (!ready) return <div className="night min-h-dvh" />;
  if (!key) {
    return (
      <KeyPrompt
        onSet={(k) => {
          localStorage.setItem(KEY_STORAGE, k);
          setKey(k);
        }}
      />
    );
  }
  return <Console adminKey={key} onReject={() => { localStorage.removeItem(KEY_STORAGE); setKey(null); }} />;
}

function KeyPrompt({ onSet }: { onSet: (k: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <main className="night min-h-dvh grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">Régie</h1>
        <p className="mt-2 text-muted">Mot de passe de la soirée.</p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && value && onSet(value)}
          autoFocus
          className="mt-5 w-full rounded-xl bg-surface border-2 border-line px-4 py-3 text-lg
                     focus:border-gold focus:outline-none"
        />
        <button onClick={() => value && onSet(value)} className="mt-4 w-full rounded-xl bg-gold py-3 font-bold text-ink">
          Entrer
        </button>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

function Console({ adminKey, onReject }: { adminKey: string; onReject: () => void }) {
  const { state, refresh } = useGameState({ adminKey });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = useCountdown(
    state?.phase === "question" ? state.startedAt : null,
    state?.durationMs ?? 0
  );

  async function send(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey, action, ...extra }),
      });
      if (res.status === 401) {
        onReject();
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Commande refusée");
      }
      await refresh();
    } catch {
      setError("Pas de réseau");
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <main className="night min-h-dvh grid place-items-center">
        <p className="text-muted">Connexion…</p>
      </main>
    );
  }

  const isLast = state.questionIndex >= state.total - 1;
  const everyoneAnswered =
    state.playerCount > 0 && state.answerCount >= state.playerCount;

  // Un seul bouton principal qui sait toujours quoi faire ensuite. En
  // direct, on n'a pas envie de choisir parmi huit boutons : on appuie
  // sur le grand, et le jeu avance.
  const primary = (() => {
    switch (state.phase) {
      case "lobby":
        return {
          label: state.questionIndex < 0 ? "Lancer la 1re question" : `Lancer la question ${state.questionIndex + 1}`,
          action: "start",
        };
      case "question":
        return { label: "Fermer et révéler", action: "reveal" };
      case "reveal":
        return { label: "Voir le classement", action: "leaderboard" };
      case "leaderboard":
        return isLast
          ? { label: "Révéler le classement final", action: "finish" }
          : { label: "Question suivante", action: "next" };
      default:
        return { label: "Retour à l'accueil", action: "lobby" };
    }
  })();

  return (
    <main className="night min-h-dvh px-5 py-6 max-w-2xl mx-auto">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold">Régie</h1>
        <span className="text-muted text-sm">
          {state.playerCount} joueurs · phase {state.phase}
        </span>
      </header>

      <div className="mt-5 rounded-2xl bg-surface p-5">
        <p className="text-muted text-sm">
          {state.questionIndex >= 0
            ? `Question ${state.questionIndex + 1} sur ${state.total}`
            : "Aucune question chargée"}
        </p>
        <p className="mt-1 text-xl font-bold leading-snug">
          {state.question?.text ?? "Écran d'accueil"}
        </p>

        {state.phase === "question" && (
          <div className="mt-4 flex items-center gap-6">
            <span className={`text-5xl font-extrabold tabular-nums ${remaining <= 5 ? "text-a1" : ""}`}>
              {remaining}
            </span>
            <span className={`text-lg ${everyoneAnswered ? "text-a4 font-bold" : "text-muted"}`}>
              {state.answerCount} / {state.playerCount} ont répondu
              {everyoneAnswered && " — tu peux couper"}
            </span>
          </div>
        )}

        {state.question && state.correct && (
          <ul className="mt-4 space-y-1.5">
            {state.question.options.map((opt, i) => (
              <li key={i} className="flex items-center gap-3 text-[15px]">
                <span className={state.correct!.includes(i) ? "font-bold text-a4" : "text-muted"}>
                  {opt}
                </span>
                {state.counts && (
                  <span className="ml-auto tabular-nums text-muted">{state.counts[i]}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => send(primary.action)}
        disabled={busy}
        className="mt-5 w-full rounded-2xl bg-gold py-6 text-2xl font-extrabold text-ink
                   disabled:opacity-40 active:scale-[0.99] transition-transform"
      >
        {primary.label}
      </button>

      {error && <p role="alert" className="mt-3 text-a1">{error}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <SmallButton onClick={() => send("prev")} disabled={busy}>Précédente</SmallButton>
        <SmallButton onClick={() => send("next")} disabled={busy}>Passer</SmallButton>
        <SmallButton onClick={() => send("lobby")} disabled={busy}>Accueil / QR</SmallButton>
      </div>

      <section className="mt-8">
        <h2 className="text-muted text-sm">Joueurs</h2>
        <ul className="mt-2 divide-y divide-line/50">
          {state.leaderboard.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <span className="w-6 text-muted tabular-nums">{i + 1}</span>
              <span className="flex-1 truncate">{p.pseudo}</span>
              <span className="tabular-nums text-gold font-semibold">{p.score}</span>
              <button
                onClick={() => {
                  if (confirm(`Retirer ${p.pseudo} de la partie ?`)) send("kick", { playerId: p.id });
                }}
                className="text-a1 text-sm px-2"
              >
                Exclure
              </button>
            </li>
          ))}
          {state.leaderboard.length === 0 && (
            <li className="py-3 text-muted">Personne n&apos;a encore rejoint.</li>
          )}
        </ul>
      </section>

      <button
        onClick={() => {
          if (confirm("Effacer tous les joueurs et les scores ? À ne faire qu'avant la soirée.")) {
            send("reset");
          }
        }}
        className="mt-10 w-full rounded-xl border-2 border-a1/50 py-3 text-a1 font-semibold"
      >
        Remettre la partie à zéro
      </button>
    </main>
  );
}

function SmallButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-xl bg-surface border border-line py-3 text-sm font-semibold
                 disabled:opacity-40 active:scale-[0.98] transition-transform"
    >
      {children}
    </button>
  );
}
