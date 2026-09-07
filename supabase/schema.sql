-- ============================================================
--  Quiz anniversaire — schéma Supabase
--  À coller tel quel dans le SQL Editor de Supabase, puis Run.
--  Rejouable : on peut le relancer sans casser l'existant.
-- ============================================================

-- ---------- Tables ----------

create table if not exists game_state (
  id                  int primary key default 1,
  phase               text not null default 'lobby',
  current_index       int  not null default -1,
  question_started_at timestamptz,
  updated_at          timestamptz not null default now(),
  constraint game_state_singleton check (id = 1),
  constraint game_state_phase_valid
    check (phase in ('lobby', 'question', 'reveal', 'leaderboard', 'finished'))
);

insert into game_state (id) values (1) on conflict (id) do nothing;

create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  pseudo     text not null,
  score      int  not null default 0,
  created_at timestamptz not null default now()
);

-- Pseudos uniques sans tenir compte de la casse ni des espaces autour :
-- évite d'avoir deux "Papa" au classement final.
create unique index if not exists players_pseudo_unique
  on players (lower(trim(pseudo)));

create table if not exists answers (
  id             uuid primary key default gen_random_uuid(),
  player_id      uuid not null references players(id) on delete cascade,
  question_index int  not null,
  choice         int  not null,
  points         int  not null default 0,
  answered_at    timestamptz not null default now(),
  -- Un seul vote par joueur et par question : verrou anti double-réponse.
  unique (player_id, question_index)
);

create index if not exists answers_by_question on answers (question_index);

-- ---------- Score atomique ----------
-- Passe par une fonction pour éviter le read-modify-write : si deux
-- requêtes arrivent en même temps, aucun point n'est perdu.

create or replace function add_score(p_id uuid, pts int)
returns void
language sql
as $$
  update players set score = score + pts where id = p_id;
$$;

-- ---------- Row Level Security ----------
-- Le navigateur (clé anon) peut LIRE l'état et le classement, rien d'autre.
-- Toutes les écritures passent par les routes API avec la clé service_role,
-- qui contourne RLS. Un invité curieux qui ouvre la console ne peut donc
-- ni s'attribuer des points, ni lire les réponses des autres.

alter table game_state enable row level security;
alter table players    enable row level security;
alter table answers    enable row level security;

drop policy if exists "lecture etat" on game_state;
create policy "lecture etat" on game_state for select to anon, authenticated using (true);

drop policy if exists "lecture classement" on players;
create policy "lecture classement" on players for select to anon, authenticated using (true);

-- Aucune policy sur `answers` = personne ne peut la lire côté navigateur.

-- ---------- Realtime ----------
-- Diffuse les changements aux clients connectés. Les pages s'en servent
-- comme signal ("quelque chose a bougé") puis rechargent /api/state.

do $$
begin
  begin
    alter publication supabase_realtime add table game_state;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table players;
  exception when duplicate_object then null;
  end;
end $$;

-- ---------- Remise à zéro ----------
-- À lancer entre deux répétitions pour repartir d'une salle vide.

create or replace function reset_game()
returns void
language sql
as $$
  delete from answers;
  delete from players;
  update game_state
     set phase = 'lobby',
         current_index = -1,
         question_started_at = null,
         updated_at = now()
   where id = 1;
$$;
