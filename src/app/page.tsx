"use client";

import { useEffect, useState } from "react";
import { useGameState, useCountdown } from "@/lib/useGameState";

const STORAGE_KEY = "quiz-anniv:playerId";

export default function PlayerPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Reprise de session : le joueur qui a verrouillé son téléphone ou est
  // passé sur WhatsApp revient avec son score intact, sans retaper son
  // prénom. C'est le détail qui évite la panique en pleine soirée.
  useEffect(() => {
    setPlayerId(localStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  if (!ready) return <div className="night min-h-dvh" />;

  if (!playerId) {
    return (
      <JoinScreen
        onJoined={(id) => {
          localStorage.setItem(STORAGE_KEY, id);
          setPlayerId(id);
        }}
      />
    );
  }

  return <GameScreen playerId={playerId} onLost={() => {
    localStorage.removeItem(STORAGE_KEY);
    setPlayerId(null);
  }} />;
}

/* ---------------------------------------------------------------- */

function JoinScreen({ onJoined }: { onJoined: (id: string) => void }) {
  const [pseudo, setPseudo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Inscription impossible.");
        return;
      }
      onJoined(data.id);
    } catch {
      setError("Pas de réseau. Réessaie dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="night min-h-dvh flex flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm rise">
        <p className="text-gold text-sm tracking-wide">Les 50 ans de Fred</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight">
          Entre ton prénom pour jouer
        </h1>
        <p className="mt-3 text-muted text-[15px] leading-relaxed">
          Il apparaîtra au classement, alors reste reconnaissable.
        </p>

        <input
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={16}
          autoFocus
          autoComplete="off"
          autoCapitalize="words"
          placeholder="Johan"
          aria-label="Ton prénom"
          className="mt-7 w-full rounded-2xl bg-surface border-2 border-line px-5 py-4
                     text-2xl font-semibold placeholder:text-muted/50
                     focus:border-gold focus:outline-none"
        />

        {error && (
          <p role="alert" className="mt-3 text-a1 text-[15px]">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={busy || pseudo.trim().length < 2}
          className="mt-5 w-full rounded-2xl bg-gold py-4 text-xl font-extrabold text-ink
                     disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {busy ? "Une seconde…" : "Rejoindre"}
        </button>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

function GameScreen({ playerId, onLost }: { playerId: string; onLost: () => void }) {
  const { state } = useGameState({ playerId });
  const [pending, setPending] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const remaining = useCountdown(
    state?.phase === "question" ? state.startedAt : null,
    state?.durationMs ?? 0
  );

  // Le joueur a été exclu ou la partie a été remise à zéro : on repart
  // proprement sur l'écran d'inscription plutôt que de rester bloqué.
  useEffect(() => {
    if (state && state.you === null) onLost();
  }, [state, onLost]);

  useEffect(() => {
    setPending(null);
    setNotice(null);
  }, [state?.questionIndex, state?.phase]);

  if (!state || !state.you) {
    return (
      <main className="night min-h-dvh grid place-items-center px-6">
        <p className="text-muted">Connexion…</p>
      </main>
    );
  }

  const you = state.you;
  const chosen = you.choice ?? pending;

  async function answer(choice: number) {
    if (chosen !== null || state?.phase !== "question") return;
    setPending(choice);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, questionIndex: state.questionIndex, choice }),
      });
      if (!res.ok) {
        const data = await res.json();
        setNotice(data.error ?? "Réponse non enregistrée.");
        setPending(null);
      }
    } catch {
      setNotice("Pas de réseau. Ta réponse n'est pas partie.");
      setPending(null);
    }
  }

  return (
    <main className="night min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-line/60">
        <span className="font-semibold truncate max-w-[45%]">{you.pseudo}</span>
        <span className="text-sm text-muted">
          {you.score} pts · {you.rank}
          {you.rank === 1 ? "er" : "e"}
        </span>
      </header>

      {state.phase === "question" && state.question ? (
        <>
          <div className="px-5 pt-5 pb-2 flex items-baseline justify-between">
            <p className="text-muted text-sm">
              Question {state.questionIndex + 1} sur {state.total}
            </p>
            <p
              className={`text-3xl font-extrabold tabular-nums ${
                remaining <= 5 ? "text-a1" : "text-paper"
              }`}
              aria-live="off"
            >
              {remaining}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <h1 className="text-xl font-bold leading-snug text-balance">
              {state.question.text}
            </h1>

            {state.question.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/photos/${state.question.photo}`}
                alt=""
                className="mt-4 w-full rounded-2xl object-contain max-h-[38vh]"
              />
            )}

            <div className="mt-5 flex flex-col gap-3">
              {state.question.options.map((label, i) => {
                const dimmed = chosen !== null && chosen !== i;
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={chosen !== null}
                    className={`w-full rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold text-paper
                                transition-all duration-200 active:scale-[0.98]
                                ${
                                  chosen === i
                                    ? "border-gold bg-gold/15"
                                    : "border-line bg-surface"
                                }
                                ${dimmed ? "opacity-30" : "opacity-100"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="px-5 pb-6 text-center text-muted text-[15px] min-h-6">
            {notice
              ? notice
              : chosen !== null
              ? "C'est enregistré. Réponse dans un instant."
              : "Choisis ta réponse."}
          </p>
        </>
      ) : (
        <WaitingScreen state={state} />
      )}
    </main>
  );
}

/* ---------------------------------------------------------------- */

function WaitingScreen({ state }: { state: NonNullable<ReturnType<typeof useGameState>["state"]> }) {
  const you = state.you!;

  if (state.phase === "reveal" || state.phase === "leaderboard") {
    const won = (you.lastPoints ?? 0) > 0;
    const voted = you.choice !== null;
    const options = state.question?.options ?? [];
    const correctLabels = (state.correct ?? [])
      .map((i) => options[i])
      .filter(Boolean);
    const yourLabel = you.choice !== null ? options[you.choice] : null;
    return (
      <div className="flex-1 grid place-items-center px-8 text-center">
        <div className="pop">
          <p className="text-6xl mb-4">{!voted ? "⏱" : won ? "🎉" : "😬"}</p>
          <h2 className="text-3xl font-extrabold">
            {!voted ? "Pas de réponse" : won ? "Bonne réponse" : "Raté"}
          </h2>
          {won && (
            <p className="mt-2 text-gold text-2xl font-bold">+{you.lastPoints} points</p>
          )}

          {correctLabels.length > 0 && (
            <div className="mt-6 rounded-2xl bg-surface px-5 py-4">
              <p className="text-muted text-sm">
                {correctLabels.length > 1 ? "Bonnes réponses" : "La bonne réponse"}
              </p>
              <p className="mt-1 text-a4 text-xl font-bold leading-snug break-words">
                {correctLabels.join("  ou  ")}
              </p>
            </div>
          )}

          {state.question?.revealPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/photos/${state.question.revealPhoto}`}
              alt=""
              className="mt-4 w-full max-w-xs mx-auto rounded-2xl object-contain"
            />
          )}

          {!won && voted && yourLabel && (
            <p className="mt-3 text-muted text-[15px]">
              Ta réponse&nbsp;:{" "}
              <span className="text-paper font-semibold">{yourLabel}</span>
            </p>
          )}

          <p className="mt-6 text-muted">{you.score} points au total</p>
        </div>
      </div>
    );
  }

  if (state.phase === "finished") {
    const top = state.leaderboard;
    const inTop = you.rank <= top.length;
    return (
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="pop text-center">
          <p className="text-6xl mb-4">{you.rank === 1 ? "🏆" : "👏"}</p>
          <h2 className="text-3xl font-extrabold">
            {you.rank === 1 ? "Tu gagnes !" : `${you.rank}e place`}
          </h2>
          <p className="mt-3 text-muted text-lg">{you.score} points</p>
        </div>

        <h3 className="mt-8 text-gold text-sm font-semibold tracking-wide">
          Classement final
        </h3>
        <ol className="mt-3 flex flex-col gap-2">
          {top.map((p, i) => {
            const mine = i + 1 === you.rank;
            return (
              <li
                key={p.id}
                className={`flex items-center gap-4 rounded-xl px-4 py-2.5 ${
                  mine ? "bg-gold/15 border-2 border-gold" : "bg-surface"
                }`}
              >
                <span className="w-6 text-muted tabular-nums font-bold">{i + 1}</span>
                <span className="flex-1 truncate font-semibold">{p.pseudo}</span>
                <span className="tabular-nums text-gold font-bold">{p.score}</span>
              </li>
            );
          })}
          {!inTop && (
            <li className="flex items-center gap-4 rounded-xl px-4 py-2.5 bg-gold/15 border-2 border-gold">
              <span className="w-6 text-muted tabular-nums font-bold">{you.rank}</span>
              <span className="flex-1 truncate font-semibold">{you.pseudo}</span>
              <span className="tabular-nums text-gold font-bold">{you.score}</span>
            </li>
          )}
        </ol>
      </div>
    );
  }

  return (
    <div className="flex-1 grid place-items-center px-8 text-center">
      <div>
        <h2 className="text-2xl font-bold">Tu es dans la partie</h2>
        <p className="mt-3 text-muted leading-relaxed">
          La prochaine question va s&apos;afficher ici.
        </p>
        <p className="mt-8 text-sm text-muted">
          {state.playerCount} {state.playerCount > 1 ? "joueurs connectés" : "joueur connecté"}
        </p>
      </div>
    </div>
  );
}
