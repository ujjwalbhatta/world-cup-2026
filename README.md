# World Cup 2026 Prediction App

**Live → [worldcup-bracket-prediction.vercel.app](https://worldcup-bracket-prediction.vercel.app)**

A full-stack real-time prediction game for the 2026 FIFA World Cup, built for a group of friends competing across two separate contests with a shared $120 prize pool.

---

## What it does

Six players each compete in two independent contests:

**Bracket Predictor — $60 pot**
Pick the full 32-team knockout bracket before first kickoff (June 11, 2026). One lock, no changes. Scores update live as matches are played.

**Match Predictor — $60 pot**
Predict Home / Draw / Away for all 72 group games, plus which team advances in all 32 knockout matches. Each match locks individually at its own kickoff — predictions stay open throughout the tournament.

Both leaderboards update in real-time for all players simultaneously via Supabase Realtime.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React + TypeScript | Fast dev, fully static output |
| Database | Supabase (PostgreSQL + Realtime) | Live updates without a backend server |
| Auth | PIN-based per player | Lightweight anti-cheat for a friends group |
| Hosting | Vercel | Zero-config CI/CD from GitHub |

No custom backend — the React app talks directly to Supabase via the public anon key with Row Level Security policies.

---

## Interesting engineering problems

**Third-place allocation table** — FIFA defines 495 possible combinations of which 8 of 12 third-place teams qualify, each mapping to different Round of 32 slots. Parsed the full table from Wikipedia HTML into a typed lookup (`src/data/thirdAllocation.ts`) and resolve each player's bracket against it dynamically.

**Downstream pick pruning** — changing an early-round pick (e.g. picking a different R32 winner) must invalidate all dependent downstream picks that are now impossible. Implemented as a BFS traversal over the match graph.

**Optimistic UI with debounced sync** — picks update instantly in the UI (optimistic), then debounce-sync to Supabase at 600–800ms. On reload, remote state is the source of truth; localStorage is only a draft cache.

**PIN anti-cheat** — PIN is stored inside the `predictions.data` JSONB field and carried forward on every save so it's never overwritten. Prevents players from picking another person's name and modifying their bracket.

**End-to-end simulation** — `scripts/simulate.ts` seeds a complete tournament result set and a known prediction with intentional wrong picks, then asserts the scoring functions produce exact expected values (bracket: 112/139, match: 133 pts) before clearing all test data.

---

## Scoring

### Bracket Predictor (max 139 pts)

| Stage | Points | Max |
|---|---|---|
| Group 1st / 2nd correct | 1 each | 24 |
| Best-8 third correct | 1 each | 8 |
| R32 winner correct | 2 | 32 |
| R16 winner correct | 3 | 24 |
| QF winner correct | 5 | 20 |
| SF winner correct | 8 | 16 |
| Champion exact | 15 | 15 |

### Match Predictor

| Match type | Points |
|---|---|
| Group game (H/D/A correct) | 1 |
| R32 winner | 2 |
| R16 winner | 3 |
| QF winner | 4 |
| SF / 3rd place | 5 |
| Final winner | 6 |

---

## Project structure

```
src/
  data/
    teams.ts            48 teams across 12 groups
    groupFixtures.ts    72 group matches with kickoff times (UTC)
    matches.ts          32 knockout matches (R32 → Final)
    thirdAllocation.ts  495 FIFA third-place slot combinations
  lib/
    supabase.ts
    resolveBracket.ts   Player picks → resolved R32 matchups → cascade forward
    resolveActual.ts    Same logic for actual results (used by admin panel)
    bracketScore.ts     Bracket scoring function
    matchScore.ts       Match predictor scoring function
    usePrediction.ts    Bracket state + debounced Supabase sync
    useMatchPicks.ts    Match pick state + realtime subscription
  components/
    NamePicker          Name select + PIN setup / verify
    GroupPicker         Group stage picks + best-8 thirds selector
    Bracket             Full knockout bracket, cascading picks
    MatchList           All 104 matches, per-match lock, live result display
    Leaderboard         Two separate live leaderboards
    ResultsAdmin        Password-gated admin panel (4-tab flow, no typing)
  types.ts
  App.tsx
scripts/
  simulate.ts           End-to-end scoring verification
```

---

## Local setup

```bash
git clone https://github.com/ujjwalbhatta/world-cup-2026.git
cd world-cup-2026
npm install
cp .env.example .env   # add your Supabase credentials
npm run dev
```

### Supabase schema (run once in SQL editor)

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

alter table predictions   enable row level security;
alter table results        enable row level security;
alter table match_picks    enable row level security;
alter table match_results  enable row level security;
create policy "rw" on predictions   for all using (true) with check (true);
create policy "rw" on results       for all using (true) with check (true);
create policy "rw" on match_picks   for all using (true) with check (true);
create policy "rw" on match_results for all using (true) with check (true);
```

### Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PASSWORD=your-secret-password
```
