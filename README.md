# Quiz — Les 50 ans de Fred

Quiz live multi-joueurs : les invités scannent un QR code, entrent un prénom
et répondent depuis leur téléphone pendant que les questions sont projetées
au mur. Pas de limite de questions.

## Les trois écrans

| URL        | Pour qui | Rôle |
|------------|----------|------|
| `/`        | Les invités | Inscription puis 4 boutons de réponse |
| `/present` | Le vidéoprojecteur | QR code, questions, photos, classement |
| `/admin`   | Toi | Lancer, révéler, enchaîner, exclure |

`/present` et `/admin` demandent le mot de passe défini dans `ADMIN_KEY`.

## Mise en route

### 1. Supabase (5 minutes)

Crée un projet gratuit sur [supabase.com](https://supabase.com), puis dans
**SQL Editor**, colle le contenu de `supabase/schema.sql` et lance-le.

Récupère ensuite dans **Project Settings → API** :
- l'URL du projet,
- la clé `anon`,
- la clé `service_role`.

### 2. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis les quatre valeurs. La clé `service_role` ne doit **jamais** être
préfixée `NEXT_PUBLIC_` : elle contourne toutes les règles de sécurité et
ne doit rester que côté serveur.

### 3. Lancer en local

```bash
npm install
npm run dev
```

Pour tester depuis un vrai téléphone sur ton réseau local, note l'IP
affichée par `npm run dev` (`http://192.168.x.x:3000`) et ouvre-la sur le
mobile.

### 4. Déployer sur Vercel

Pousse le dépôt sur GitHub, importe-le dans Vercel, et recopie les quatre
variables dans **Settings → Environment Variables**. Rien d'autre à
configurer.

## Ajouter tes questions

Tout se passe dans `src/lib/questions.ts`. Un exemple :

```ts
{
  text: "Quel âge avait Fred sur cette photo ?",
  photo: "fred-militaire.jpg",   // fichier dans /public/photos/
  options: ["1333", "1873", "1999", "1783"],
  correct: [2],                   // index, 0 = première option
  duration: 25,                   // secondes, 20 par défaut
}
```

`correct` est un tableau : mets-y plusieurs index quand toutes les
réponses sont bonnes, comme ta question sur l'âge où `10x5`, `50` et
`50-50+50` valent la même chose.

Les six questions de tes captures AhaSlides sont déjà en place. La photo
de la question 1 est attendue sous
`public/photos/fred-militaire.jpg` — dépose-la avec ce nom, ou change le
nom dans le fichier.

**Compresse tes photos** avant de les déposer : 1920 px de large en JPEG
ou WebP suffit largement pour une projection. Les photos ne sont envoyées
qu'à l'écran du mur, jamais aux téléphones.

## Comment ça marche

Vercel étant serverless, il n'y a pas de serveur WebSocket persistant :
l'état de la partie vit dans Postgres, et le Realtime Supabase prévient
les clients qu'il a changé. Chaque page recharge alors `/api/state`, qui
reste la seule source de vérité.

Deux conséquences utiles :

- **Le score n'est jamais calculé côté téléphone.** Le client envoie
  seulement le numéro du bouton pressé. Le serveur vérifie la phase,
  mesure le temps écoulé depuis son propre horodatage et attribue les
  points. Personne ne peut tricher en modifiant son horloge.
- **Si le Realtime tombe, rien ne casse.** Un polling de secours toutes
  les 3 secondes resynchronise les écrans, et toute page qui sort de
  veille se remet à jour immédiatement.

Le barème donne 1000 points pour une bonne réponse instantanée et 500 au
buzzer. Le plancher à 500 évite que ceux qui réfléchissent — ou qui ont
un vieux téléphone — décrochent définitivement du classement.

Les joueurs gardent leur identifiant en `localStorage` : un téléphone
verrouillé, un passage sur WhatsApp ou un rechargement de page ne fait
perdre ni le prénom ni les points.

## Le déroulé, le soir

1. Ouvre `/present` sur le laptop branché au projecteur, en plein écran (F11).
2. Ouvre `/admin` sur ton téléphone — tu pilotes en te baladant dans la salle.
3. Laisse le QR code affiché pendant tout l'apéro. Les gens se connectent
   au fil de l'eau au lieu de se ruer tous en même temps.
4. Ensuite, un seul gros bouton dans la régie fait tout avancer :
   lancer → révéler → classement → question suivante.

Le compteur « 12 / 15 ont répondu » te dit quand tout le monde a voté :
tu peux couper sans attendre la fin du chrono, ça garde le rythme.

## Avant le jour J

- [ ] Lance `reset` depuis la régie après tes répétitions, pour arriver avec une salle vide.
- [ ] Teste avec 3-4 vrais téléphones en 4G, pas seulement en wifi.
- [ ] Verrouille un téléphone en pleine question, rouvre-le, vérifie que le score est toujours là.
- [ ] Vérifie la lisibilité depuis le fond de la salle, projecteur allumé, lumières comme elles seront.
- [ ] Note le mot de passe quelque part : `/present` te le redemandera si tu vides le cache.
