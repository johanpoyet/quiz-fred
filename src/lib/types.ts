export type Phase = "lobby" | "question" | "reveal" | "leaderboard" | "finished";

export type LeaderRow = {
  id: string;
  pseudo: string;
  score: number;
};

export type PublicState = {
  phase: Phase;
  questionIndex: number;
  total: number;
  startedAt: string | null;
  durationMs: number;
  playerCount: number;
  answerCount: number;
  question: {
    text: string;
    options: string[];
    photo?: string;
  } | null;
  correct: number[] | null;
  counts: number[] | null;
  leaderboard: LeaderRow[];
  you: {
    pseudo: string;
    score: number;
    rank: number;
    choice: number | null;
    lastPoints: number | null;
  } | null;
};
