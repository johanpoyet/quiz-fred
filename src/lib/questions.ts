/**
 * Les questions du quiz.
 *
 * C'est le SEUL fichier à éditer pour changer le contenu de la soirée.
 * Ajoutes-en autant que tu veux : il n'y a aucune limite.
 *
 * - `correct` est un tableau d'index (0 = 1re option). Plusieurs index
 *   possibles quand toutes les réponses sont bonnes, comme ta question
 *   sur l'âge où 10x5, 50 et 50-50+50 valent pareil.
 * - `photo` est optionnel. Mets le fichier dans /public/photos/ et
 *   indique juste son nom. La photo n'est affichée QUE sur le mur,
 *   jamais envoyée aux téléphones.
 * - `duration` est en secondes. 20 par défaut, 25-30 si la photo
 *   demande de la réflexion.
 */

export type Question = {
  text: string;
  photo?: string;
  options: [string, string, string, string];
  correct: number[];
  duration?: number;
};

export const DEFAULT_DURATION = 20;

export const questions: Question[] = [
  {
    text: "Quel âge avait Fred sur cette photo ?",
    photo: "fred-militaire.jpg",
    options: ["1333", "1873", "1999", "1783"],
    correct: [2],
    duration: 25,
  },
  {
    text: "Son sport de prédilection ?",
    options: ["Football", "Pétanque", "Curling sur gazon", "Boule Lyonnaise"],
    correct: [3],
  },
  {
    text: "La date de son anniversaire ?",
    options: ["4 mai", "4 septembre", "4 février", "4x4 = 16"],
    correct: [0],
  },
  {
    text: "Son âge ?",
    options: [
      "10x5",
      "(((9999-9949)*(144/12))/(3*4))+((81/9)-(27/3))+((256/16)-(4*4))",
      "50",
      "50-50+50",
    ],
    correct: [0, 1, 2, 3],
  },
  {
    text: "Son enfant préféré ?",
    options: ["Joan", "Johan", "Jo-ane", "Yohan"],
    correct: [1],
  },
  {
    text: "Sa ville de naissance ?",
    options: ["Andrézieux", "Chavanoz", "Saint-Étienne", "Istanbul"],
    correct: [2],
  },
  {
    text: "Que porte Fred sur cette photo ?",
    photo: "moule-bite.png",
    options: ["moule-bite", "presbyte", "belle bite", "terreur nocturne"],
    correct: [0],
    duration: 25,
  },
];

export function getQuestion(index: number): Question | null {
  if (index < 0 || index >= questions.length) return null;
  return questions[index];
}

export function durationMs(q: Question): number {
  return (q.duration ?? DEFAULT_DURATION) * 1000;
}
