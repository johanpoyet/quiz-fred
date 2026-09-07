/**
 * Les quatre identités de réponse.
 *
 * Chaque position a une couleur ET une forme, strictement identiques sur
 * le mur et sur les téléphones. C'est ce qui permet à quelqu'un assis au
 * fond, qui ne lit pas le texte de si loin, de faire le lien : « la
 * pétanque c'est le losange bleu » puis d'appuyer sur le losange bleu.
 * La forme sert aussi de secours pour les daltoniens et pour un
 * vidéoprojecteur qui rend mal les couleurs.
 */

export const ANSWERS = [
  { color: "#E23E57", name: "triangle" },
  { color: "#2D8CF0", name: "losange" },
  { color: "#F5A623", name: "rond" },
  { color: "#22B573", name: "carré" },
] as const;

export function Shape({ index, size = 28 }: { index: number; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 32 32", "aria-hidden": true };
  const fill = "currentColor";

  switch (index) {
    case 0:
      return (
        <svg {...common}>
          <path d="M16 3 L30 28 L2 28 Z" fill={fill} />
        </svg>
      );
    case 1:
      return (
        <svg {...common}>
          <path d="M16 2 L30 16 L16 30 L2 16 Z" fill={fill} />
        </svg>
      );
    case 2:
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="13" fill={fill} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="3" y="3" width="26" height="26" rx="3" fill={fill} />
        </svg>
      );
  }
}
