# Build Brief — World Cup 2026 Match Predictor (Project 2)

> Companion to the Bracket Predictor. Paste into Claude Code. Reuses the same repo/stack.

## Goal

The same 6 friends predict the **outcome of every match** in World Cup 2026. Live, shared standings via Supabase. Simple and fun.

## Reused from Project 1 (don't rebuild)

- **Stack:** Vite + React + TypeScript + Supabase, deploy on Vercel/Netlify.
- **Players:** Ujjwal, Sumaly, Utsabi, Sabun, Riti, Avash (name picker, no login).
- `teams.ts` (the 48 teams + groups) and `matches.ts` (the match graph for 73–104).
- The Supabase client (`src/lib/supabase.ts`) and the realtime pattern.

---

## 1. The core rule — what's predictable, and when

This is the key thing: **only the 72 group matches have fixed teams right now.** The 32 knockout matches (73–104) are just slots until results resolve them.

- **Group matches (1–72):** teams known from day one → predict **Home win / Draw / Away win** (1 / X / 2).
- **Knockout matches (73–104):** no draws possible (extra time + penalties always decide), so the prediction is **which team advances** — and only *after* both teams are known.

A match is **open for prediction** when: both teams are known **and** `now < kickoff`. A match **locks at its own kickoff** (so people predict right up to each game — there's no single tournament-wide lock like Project 1).

How knockout teams become known: the host fills in each knockout match's two teams in the results table as the bracket resolves (they're entering results anyway). Until a knockout match has both teams set, it shows as a locked slot (`Winner Group E vs 3rd…`). No allocation-table logic needed here.

---

## 2. Scoring (tweak freely)

Correct prediction only:

| Match type | Points |
|---|---|
| Group game (1/X/2 correct) | 1 |
| R32 winner correct | 2 |
| R16 winner correct | 3 |
| QF winner correct | 4 |
| SF / 3rd-place winner correct | 5 |
| Final winner correct | 6 |

---

## 3. Data

### Group fixtures — `src/data/groupFixtures.ts`
72 matches, ids **1–72**, group stage **June 11–27, 2026** (round-robin, 6 per group, 3 matchdays). Shape:

```ts
export interface GroupFixture {
  id: number;        // 1..72
  group: GroupId;
  home: string;      // team name from teams.ts
  away: string;
  kickoff: string;   // ISO datetime UTC
}
```

Populate the full list from the official schedule (reliable source:
`https://www.espn.com/soccer/story/_/id/48939282`). Verified anchors to sanity-check against:

```
1  Group A  Mexico       vs South Africa   Jun 11
2  Group A  South Korea  vs Czechia        Jun 11
   Group B  Canada       vs Bosnia & Herzegovina  Jun 12
   Group D  USA          vs Paraguay       Jun 12
   Group B  Qatar        vs Switzerland    Jun 13
   Group C  Brazil       vs Morocco        Jun 13
   Group C  Haiti        vs Scotland       Jun 13
   Group D  Australia    vs Türkiye        Jun 13
   Group E  Germany      vs Curaçao        Jun 14
```
Matchday windows: MD1 ≈ Jun 11–17, MD2 ≈ Jun 18–23, MD3 ≈ Jun 24–27 (exact dates per group from the source).

### Knockout fixtures
Reuse `matches.ts` (ids 73–104) from Project 1 for the structure and `kickoff` times (R32 Jun 28–Jul 3, R16 Jul 4–7, QF Jul 9–11, SF Jul 14 & 15, 3rd place Jul 18, Final Jul 19). Their `home`/`away` **teams** stay empty until the host fills them in results.

---

## 4. Supabase schema

Run once (in addition to Project 1's tables, or in the same project):

```sql
create table match_picks (
  player   text,
  match_id int,
  pick     text not null,        -- 'home' | 'draw' | 'away'
  primary key (player, match_id)
);

create table match_results (
  match_id int primary key,      -- 1..104
  home     text,                 -- resolved team (knockout: host fills as bracket resolves)
  away     text,
  result   text                  -- 'home' | 'draw' | 'away'  (knockout: no 'draw')
);

alter table match_picks   enable row level security;
alter table match_results enable row level security;
create policy "rw" on match_picks   for all using (true) with check (true);
create policy "rw" on match_results for all using (true) with check (true);
```

### Client usage
```ts
// save a pick (only if match is open)
await supabase.from('match_picks').upsert({ player, match_id, pick });

// load everything for standings
const { data: picks }   = await supabase.from('match_picks').select('*');
const { data: results } = await supabase.from('match_results').select('*');

// host: set a result (and, for knockout, the teams)
await supabase.from('match_results')
  .upsert({ match_id, home, away, result });

// live updates
supabase.channel('matchpool')
  .on('postgres_changes',{event:'*',schema:'public',table:'match_picks'},   reload)
  .on('postgres_changes',{event:'*',schema:'public',table:'match_results'}, reload)
  .subscribe();
```

---

## 5. Types (`src/types.ts`, extend)

```ts
export type Outcome = 'home' | 'draw' | 'away';

export interface MatchPick   { player: string; matchId: number; pick: Outcome; }
export interface MatchResult { matchId: number; home?: string; away?: string; result?: Outcome; }
```

Score: for each player, sum points over matches where `result` is set and their `pick === result`, weighted by round (§2).

---

## 6. Components

- `NamePicker` — reused.
- `MatchList` — all 104 matches grouped by day/round. Each shows teams (or a slot if knockout teams unknown) and three buttons (Home / Draw / Away) or two (for knockouts). Disabled if locked or teams unknown. Highlights the user's pick; after kickoff shows the result and whether they were right.
- `Leaderboard` — live totals + maybe "correct picks" count, realtime.
- `ResultsAdmin` (host) — per match: set teams (knockout) + the result. This is what unlocks knockout predictions and drives scoring.

---

## 7. Build order

1. `groupFixtures.ts` (72 matches) + reuse `matches.ts` for 73–104.
2. Supabase tables (§4) + reuse the existing client.
3. `MatchList` reading fixtures; an `isOpen(match)` helper = both teams known && `now < kickoff`.
4. Wire picks to `match_picks` (upsert, blocked when not open).
5. `ResultsAdmin` → `match_results` (teams + outcome).
6. `score.ts` + `Leaderboard`, live via the realtime channel.

## 8. Gotchas

- Lock each match individually at its own kickoff — not one global lock.
- Knockout matches: only 'home'/'away' (no draw); don't render a Draw button for ids 73–104.
- A knockout match stays a locked slot until the host has set both its teams.
- Keep group fixtures and the knockout graph in `data/`, never hardcoded in components.