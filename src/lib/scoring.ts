/**
 * Barème : 1000 points pour une bonne réponse instantanée, 500 pour une
 * bonne réponse au buzzer, 0 pour une mauvaise. Récompenser la vitesse
 * garde le classement vivant, mais le plancher à 500 évite que ceux qui
 * réfléchissent — ou qui ont un vieux téléphone — décrochent définitivement.
 */
export const MAX_POINTS = 1000;

/** Marge de tolérance pour la latence réseau des téléphones en 4G. */
export const GRACE_MS = 1500;

export function computePoints(
  correct: boolean,
  elapsedMs: number,
  limitMs: number
): number {
  if (!correct) return 0;
  const ratio = Math.min(Math.max(elapsedMs / limitMs, 0), 1);
  return Math.round(MAX_POINTS * (1 - ratio / 2));
}
