# World Cup 2026 Bracket & Match Predictor

A private app for 6 friends to compete across two prediction contests during the 2026 FIFA World Cup.

**Players:** Ujjwal · Sumaly · Utsabi · Sabun · Riti · Avash

**Prize pool:** $60 Bracket Predictor + $60 Match Predictor = $120 total

---

## Two contests

### Bracket Predictor — $60 pot
Pick the full knockout bracket before first kickoff (**June 11, 2026 18:00 UTC**). One lock, no changes after deadline. Everyone's brackets are revealed and scored live as results come in.

### Match Predictor — $60 pot
Predict **Home / Draw / Away** for all 72 group games, and **who advances** in all 32 knockout matches. Each match locks at its own kickoff — you keep predicting right through the tournament.

---

## Stack

- **Vite + React + TypeScript** — fully static frontend
- **Supabase** — shared live database (realtime leaderboard updates)
- **Vercel** — free hosting

No login. Each player picks their name and sets a 4-digit PIN (anti-cheat).

---

## Local setup

```bash
npm install
cp .env.example .env   # fill in your Supabase URL, anon key, and admin password
npm run dev
```

### Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-secret-password
```

---

## Supabase schema

Run this once in the Supabase SQL editor:

```sql
create table predictions (
  player     text primary key,
  data       jsonb not null,
  locked_at  timestamptz,
  updated_at timestamptz default now()
);
create table results (
  id   int primary key default 1,
  data jsonb not null default '{}'::jsonb
);
insert into results (id, data) values (1, '{}') on conflict do nothing;

create table match_picks (
  player   text,
  match_id int,
  pick     text not null,
  primary key (player, match_id)
);
create table match_results (
  match_id int primary key,
  home     text,
  away     text,
  result   text
);

alter table predictions  enable row level security;
alter table results      enable row level security;
alter table match_picks  enable row level security;
alter table match_results enable row level security;
create policy "rw" on predictions   for all using (true) with check (true);
create policy "rw" on results       for all using (true) with check (true);
create policy "rw" on match_picks   for all using (true) with check (true);
create policy "rw" on match_results for all using (true) with check (true);
```

---

## Project structure

```
src/
  data/         teams.ts · groupFixtures.ts · matches.ts · thirdAllocation.ts
  lib/          supabase.ts · resolveBracket.ts · resolveActual.ts
                bracketScore.ts · matchScore.ts
                usePrediction.ts · useMatchPicks.ts
  components/   NamePicker · GroupPicker · Bracket · MatchList · Leaderboard · ResultsAdmin
  types.ts
  App.tsx
scripts/
  simulate.ts   (end-to-end scoring verification — run with npx tsx scripts/simulate.ts)
```

---

## Scoring

### Bracket Predictor (max 139 pts)

| Stage | Points each | Max |
|---|---|---|
| Group 1st/2nd correct | 1 | 24 |
| Correct best-8 third | 1 | 8 |
| R32 winner correct | 2 | 32 |
| R16 winner correct | 3 | 24 |
| QF winner correct | 5 | 20 |
| SF winner correct | 8 | 16 |
| Champion exact | 15 | 15 |

### Match Predictor

| Match type | Points |
|---|---|
| Group game (H/D/A correct) | 1 |
| R32 winner correct | 2 |
| R16 winner correct | 3 |
| QF winner correct | 4 |
| SF / 3rd place correct | 5 |
| Final winner correct | 6 |

---

## Admin

The **Results Admin** tab is password-protected. Work through the 4 tabs in order as the tournament progresses:

1. **Group Results** — enter H/D/A for each group match
2. **Group Standings** — set final 1st/2nd/3rd for each group
3. **Best 8 Thirds** — select the 8 qualifying third-place teams
4. **Knockout** — click the winner of each match; teams auto-fill from standings

Never type team names — everything resolves automatically from your standings entries.
