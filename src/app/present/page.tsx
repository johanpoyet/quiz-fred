"use client";

import { useEffect, useState } from "react";
import { useGameState, useCountdown } from "@/lib/useGameState";
import type { PublicState } from "@/lib/types";

const KEY_STORAGE = "quiz-anniv:adminKey";

export default function PresentPage() {
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setKey(localStorage.getItem(KEY_STORAGE));
    setReady(true);
  }, []);

  if (!ready) return <div className="night min-h-dvh" />;
  if (!key) return <KeyPrompt onSet={(k) => { localStorage.setItem(KEY_STORAGE, k); setKey(k); }} />;

  return <Wall adminKey={key} />;
}

function KeyPrompt({ onSet }: { onSet: (k: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <main className="night min-h-dvh grid place-items-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">Écran de projection</h1>
        <p className="mt-2 text-muted">Entre le mot de passe de la soirée.</p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && value && onSet(value)}
          autoFocus
          className="mt-5 w-full rounded-xl bg-surface border-2 border-line px-4 py-3 text-lg
                     focus:border-gold focus:outline-none"
        />
        <button
          onClick={() => value && onSet(value)}
          className="mt-4 w-full rounded-xl bg-gold py-3 font-bold text-ink"
        >
          Ouvrir l&apos;écran
        </button>
      </div>
    </main>
  );
}

/* ---------------------------------------------------------------- */

function Wall({ adminKey }: { adminKey: string }) {
  const { state } = useGameState({ adminKey });
  const remaining = useCountdown(
    state?.phase === "question" ? state.startedAt : null,
    state?.durationMs ?? 0
  );

  // Précharge les photos au démarrage : sans ça on a un flash blanc
  // d'une demi-seconde entre deux questions, très visible en projection.
  useEffect(() => {
    fetch(`/api/state?key=${encodeURIComponent(adminKey)}`)
      .then(() => {})
      .catch(() => {});
  }, [adminKey]);

  if (!state) {
    return (
      <main className="night min-h-dvh grid place-items-center">
        <p className="text-muted text-2xl">Connexion…</p>
      </main>
    );
  }

  return (
    <main className="night min-h-dvh flex flex-col overflow-hidden">
      {state.phase === "lobby" && <Lobby state={state} />}
      {state.phase === "question" && <QuestionView state={state} remaining={remaining} />}
      {state.phase === "reveal" && <QuestionView state={state} remaining={0} />}
      {state.phase === "leaderboard" && <Leaderboard state={state} />}
      {state.phase === "finished" && <Podium state={state} />}
    </main>
  );
}

/* ---------------------------------------------------------------- */

function Lobby({ state }: { state: PublicState }) {
  const joinUrl = typeof window !== "undefined" ? window.location.origin : "";
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=8&data=${encodeURIComponent(joinUrl)}`;

  return (
    <div className="flex-1 grid grid-cols-[1.1fr_0.9fr] items-center gap-16 px-20">
      <div className="rise">
        <p className="text-gold text-2xl">Les 50 ans de Fred</p>
        <h1 className="mt-4 text-[6.5rem] leading-[0.95] font-extrabold">
          Scannez pour<br />jouer
        </h1>
        <p className="mt-8 text-3xl text-muted">
          Ou tapez <span className="text-paper font-semibold">{joinUrl.replace(/^https?:\/\//, "")}</span>
        </p>
        <p className="mt-14 text-4xl font-bold text-gold tabular-nums">
          {state.playerCount} {state.playerCount > 1 ? "joueurs" : "joueur"}
        </p>
      </div>

      <div className="justify-self-center bg-paper p-5 rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code pour rejoindre le quiz" width={440} height={440} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function QuestionView({ state, remaining }: { state: PublicState; remaining: number }) {
  const q = state.question;
  if (!q) return null;

  const revealed = state.phase === "reveal";
  const correct = state.correct ?? [];
  const counts = state.counts ?? [0, 0, 0, 0];
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="flex-1 flex flex-col px-16 py-10">
      <div className="flex items-baseline justify-between text-2xl text-muted">
        <span>
          Question {state.questionIndex + 1} / {state.total}
        </span>
        <span>
          {state.answerCount} / {state.playerCount} ont répondu
        </span>
      </div>

      <h1 className="mt-6 text-[4.2rem] leading-[1.05] font-extrabold text-center text-balance">
        {q.text}
      </h1>

      <div className="flex-1 grid place-items-center py-6 min-h-0">
        {q.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/photos/${q.photo}`}
            alt=""
            className="max-h-full max-w-[52%] rounded-2xl object-contain shadow-2xl"
          />
        ) : !revealed ? (
          <div className="text-[9rem] font-extrabold tabular-nums text-gold">
            {remaining}
          </div>
        ) : null}
      </div>

      {q.photo && !revealed && (
        <div className="text-center text-6xl font-extrabold tabular-nums text-gold mb-4">
          {remaining}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {q.options.map((opt, i) => {
          const isRight = correct.includes(i);
          const faded = revealed && !isRight;
          return (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl border-2 px-6 py-5 flex items-center gap-5
                          transition-all duration-500
                          ${
                            revealed && isRight
                              ? "border-a4 bg-a4/10"
                              : "border-line bg-surface"
                          }
                          ${faded ? "opacity-20" : "opacity-100"}`}
            >
              <span
                className={`text-3xl font-bold leading-tight break-words min-w-0
                            ${revealed && isRight ? "text-a4" : "text-paper"}`}
              >
                {opt}
              </span>

              {revealed && (
                <span className="ml-auto flex items-center gap-4 shrink-0">
                  <span className="text-3xl font-extrabold tabular-nums text-muted">
                    {counts[i]}
                  </span>
                  {isRight && <span className="text-4xl text-a4">✓</span>}
                </span>
              )}

              {revealed && (
                <span
                  className={`absolute left-0 bottom-0 h-1.5 rounded-b-2xl transition-all duration-700
                              ${isRight ? "bg-a4/70" : "bg-muted/40"}`}
                  style={{ width: `${(counts[i] / maxCount) * 100}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Leaderboard({ state }: { state: PublicState }) {
  const rows = state.leaderboard.slice(0, 8);
  return (
    <div className="flex-1 flex flex-col px-24 py-12">
      <h1 className="text-6xl font-extrabold text-gold">Classement</h1>
      <ol className="mt-8 flex-1 flex flex-col justify-center gap-3">
        {rows.map((p, i) => (
          <li
            key={p.id}
            className="rise flex items-center gap-8 rounded-2xl bg-surface px-8 py-4"
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <span className="w-14 text-4xl font-extrabold tabular-nums text-muted">
              {i + 1}
            </span>
            <span className="flex-1 text-4xl font-bold truncate">{p.pseudo}</span>
            <span className="text-4xl font-extrabold tabular-nums text-gold">
              {p.score}
            </span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-3xl text-muted">Personne n&apos;a encore marqué.</li>
        )}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Podium({ state }: { state: PublicState }) {
  const [first, second, third] = state.leaderboard;
  const steps = [
    { p: second, h: "60%", place: 2 },
    { p: first, h: "100%", place: 1 },
    { p: third, h: "40%", place: 3 },
  ];

  return (
    <div className="flex-1 flex flex-col items-center px-20 py-12">
      <h1 className="text-7xl font-extrabold text-gold">
        {first ? `Bravo ${first.pseudo}` : "Podium"}
      </h1>

      <div className="mt-14 flex-1 w-full max-w-5xl grid grid-cols-3 gap-6 items-end pb-10">
        {steps.map(({ p, h, place }) => (
          <div key={place} className="flex flex-col items-center justify-end h-full">
            {p ? (
              <>
                <p className="text-4xl font-bold mb-3 truncate max-w-full">{p.pseudo}</p>
                <p className="text-3xl text-gold font-extrabold tabular-nums mb-4">
                  {p.score}
                </p>
                <div
                  className="w-full rounded-t-2xl bg-surface border-t-4 border-gold grid place-items-start justify-center pt-6 rise"
                  style={{ height: h, animationDelay: `${place * 140}ms` }}
                >
                  <span className="text-7xl font-extrabold text-muted">{place}</span>
                </div>
              </>
            ) : (
              <div className="w-full rounded-t-2xl bg-surface/40" style={{ height: "20%" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
