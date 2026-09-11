/**
 * Les questions du quiz.
 *
 * C'est le SEUL fichier à éditer pour changer le contenu de la soirée.
 * Ajoutes-en autant que tu veux : il n'y a aucune limite.
 *
 * - `correct` est un tableau d'index (0 = 1re option). Plusieurs index
 *   possibles quand toutes les réponses sont bonnes, comme ta question
 *   sur l'âge où 10x5, 50 et 50-50+50 valent pareil.
 * - `photo` est optionnelle. Mets le fichier dans /public/photos/ et
 *   indique juste son nom. Elle est affichée pendant la question, sur le
 *   mur et sur les téléphones.
 * - `revealPhoto` est aussi optionnelle : contrairement à `photo`, elle
 *   n'apparaît qu'au moment du reveal, comme bonus après la bonne
 *   réponse (ex. la photo de Nouk sur la question du garde du corps).
 * - `duration` est en secondes. 20 par défaut, 25-30 si la photo
 *   demande de la réflexion.
 */

export type Question = {
  text: string;
  photo?: string;
  revealPhoto?: string;
  // 4 choix d'habitude, mais 2 ("Vrai" / "Faux") pour les questions
  // vrai/faux.
  options: string[];
  correct: number[];
  duration?: number;
};

export const DEFAULT_DURATION = 20;

// Ordre volontairement mélangé par rapport à l'écriture ci-dessous, avec
// deux contraintes : la question David Douillet passe avant celle sur
// Teddy Riner, et « Son enfant préféré ? » ferme toujours la marche.
export const questions: Question[] = [
  {
    text: "Son âge sur la photo ?",
    photo: "33ans.jpeg",
    options: ["35 ans", "30 ans", "33 ans", "28 ans"],
    correct: [2],
    duration: 25,
  },
  {
    text: "Sa date de naissance ?",
    options: ["4 mai 1986", "4 mars 1976", "4 mars 1986", "4 mai 1976"],
    correct: [3],
  },
  {
    text: "Vrai ou faux : a-t-il rencontré David Douillet ?",
    options: ["Vrai", "Faux"],
    correct: [0],
  },
  {
    text: "Que porte Fred sur cette photo ?",
    photo: "moule-bite.jpg",
    options: ["moule-bite", "presbyte", "belle bite", "terreur nocturne"],
    correct: [0],
    duration: 25,
  },
  {
    text: "Son club de cœur au foot ?",
    options: ["OL", "OM", "ASSE", "PSG"],
    correct: [2],
  },
  {
    text: "Son sport de prédilection ?",
    options: ["Football", "Pétanque", "Curling sur gazon", "Boule Lyonnaise"],
    correct: [3],
  },
  {
    text: "Son âge lors de sa première cuite ?",
    photo: "12ans.jpg",
    options: ["12 ans", "10 ans", "15 ans", "16 ans"],
    correct: [1],
    duration: 25,
  },
  {
    text: "À quel âge a-t-il fait ses premiers pas ?",
    options: ["6 mois", "12 mois", "18 mois", "10 mois"],
    correct: [3],
  },
  {
    text: "Vrai ou faux : a-t-il rencontré Nabil Fékir ?",
    options: ["Vrai", "Faux"],
    correct: [1],
  },
  {
    text: "Son tennisman préféré ?",
    options: ["Djokovic", "Nadal", "Federer", "Murray"],
    correct: [2],
  },
  {
    text: "Quel âge avait Fred sur cette photo ?",
    photo: "fred-militaire.jpg",
    options: ["20 ans", "18 ans", "22 ans", "16 ans"],
    correct: [1],
    duration: 25,
  },
  {
    text: "Les 3 sports qu'il a pratiqués ?",
    options: [
      "Gym, foot et boules",
      "Tennis, foot et boules",
      "Gym, tennis et boules",
      "Magic Mike, équitation et natation",
    ],
    correct: [0],
  },
  {
    text: "Vrai ou faux : a-t-il rencontré Grégory Coupet ?",
    options: ["Vrai", "Faux"],
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
    text: "Qui était son garde du corps, petit ?",
    options: [
      "Nouk (sa chienne)",
      "Gilles (son père)",
      "Stéphane (son ami)",
      "Le Belou (un SDF du coin)",
    ],
    correct: [0],
    revealPhoto: "nouk.jpg",
  },
  {
    text: "Vrai ou faux : a-t-il rencontré Teddy Riner ?",
    options: ["Vrai", "Faux"],
    correct: [1],
  },
  {
    text: "Sa ville de naissance ?",
    options: ["Andrézieux", "Chavanoz", "Saint-Étienne", "Istanbul"],
    correct: [2],
  },
  {
    text: "Avec qui passerait-il sa journée s'il avait le choix ?",
    // Chaque nom est barré : gag, la réponse est toujours "Charlène".
    options: [
      "O̶c̶é̶a̶n̶e̶ Charlène",
      "J̶o̶h̶a̶n̶ Charlène",
      "L̶i̶l̶i̶a̶n̶ Charlène",
      "S̶e̶s̶ ̶3̶ ̶e̶n̶f̶a̶n̶t̶s̶ Charlène",
    ],
    correct: [0, 1, 2, 3],
  },
  {
    text: "Son âge sur la photo ?",
    photo: "16ans.jpeg",
    options: ["14 ans", "18 ans", "21 ans", "16 ans"],
    correct: [3],
    duration: 25,
  },
  {
    text: "Son enfant préféré ?",
    options: ["Joan", "Johan", "Jo-ane", "Yohan"],
    correct: [1],
  },
];

export function getQuestion(index: number): Question | null {
  if (index < 0 || index >= questions.length) return null;
  return questions[index];
}

export function durationMs(q: Question): number {
  return (q.duration ?? DEFAULT_DURATION) * 1000;
}
