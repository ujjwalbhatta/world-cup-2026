# Build Brief — World Cup 2026 Bracket Predictor

> Paste this whole file into Claude Code as the spec. Build it exactly to this brief.

## Goal

A small web app where **6 friends** each predict the entire World Cup 2026 knockout bracket before kickoff (June 11, 2026). After picks lock, results are entered as games are played, and **everyone sees a shared, live leaderboard and everyone's brackets**. This is a for-fun project that lives on a public repo — keep it simple.

## Stack

- **Vite + React + TypeScript** (frontend, fully static)
- **Supabase** (free tier) for shared storage so all 6 see the same data live — one tiny schema, called directly from React, no custom backend server
- Deploy free on **Vercel**
- Node only for a one-off data-gen script (see §6), never as a running server

## Players

`Ujjwal`, `Sumaly`, `Utsabi`, `Sabun`, `Riti`, `Avash`

No login — each person taps their name (honor system). Picks lock at first kickoff: **2026-06-11T18:00:00Z**.

---

## 1. Prediction flow

Each step is constrained by the previous one (behaves like a real bracket):

1. **Group stage** — for each group A–L pick **1st** and **2nd** → 24 teams.
2. **Third place** — for each group pick who finishes **3rd** → 12 candidates.
3. **Best 8 thirds** — choose exactly **8 of the 12** to qualify → 32 teams total.
4. **Knockout** — the Round of 32 auto-fills from the picks + the allocation table (§6), then the player picks the **winner of every match** through R32 → R16 → QF → SF → Final.

After the deadline: brackets become read-only, everyone's picks are revealed, scoring is live.

---

## 2. Scoring (points stack across rounds)

Award per correct team that actually reaches a round:

| Stage | Pts each | Max |
|---|---|---|
| Group 1st/2nd correct | 1 | 24 |
| Correct best-8 third | 1 | 8 |
| Reaches R16 (won R32) | 2 | 32 |
| Reaches QF (won R16) | 3 | 24 |
| Reaches SF (won QF) | 5 | 20 |
| Reaches Final (won SF) | 8 | 16 |
| Champion (exact) | 15 | 15 |

Optional: +3 for a group's exact 1st/2nd order.

---

## 3. Tournament data (seed `teams.ts`)

12 groups of 4 (final draw, Dec 5 2025):

| Group | Teams |
|---|---|
| A | Mexico, South Africa, South Korea, Czechia |
| B | Canada, Bosnia & Herzegovina, Qatar, Switzerland |
| C | Brazil, Morocco, Haiti, Scotland |
| D | USA, Paraguay, Australia, Türkiye |
| E | Germany, Curaçao, Côte d'Ivoire, Ecuador |
| F | Netherlands, Japan, Sweden, Tunisia |
| G | Belgium, Egypt, Iran, New Zealand |
| H | Spain, Cabo Verde, Saudi Arabia, Uruguay |
| I | France, Senegal, Iraq, Norway |
| J | Argentina, Algeria, Austria, Jordan |
| K | Portugal, DR Congo, Uzbekistan, Colombia |
| L | England, Croatia, Ghana, Panama |

Notation: `1A`=winner Group A, `2A`=runner-up, `3A`=third, `W74`=winner of match 74.

---

## 4. Round of 32 — fixed structure (matches 73–88)

8 are fully fixed; 8 pair a group winner vs a best-third (identity from §6).

```
73:  2A vs 2B
74:  1E vs 3rd[A/B/C/D/F]    *
75:  1F vs 2C
76:  1C vs 2F
77:  1I vs 3rd[C/D/F/G/H]    *
78:  2E vs 2I
79:  1A vs 3rd[C/E/F/H/I]    *
80:  1L vs 3rd[E/H/I/J/K]    *
81:  1D vs 3rd[B/E/F/I/J]    *
82:  1G vs 3rd[A/E/H/I/J]    *
83:  2K vs 2L
84:  1H vs 2J
85:  1B vs 3rd[E/F/G/I/J]    *
86:  1J vs 2H
87:  1K vs 3rd[D/E/I/J/L]    *
88:  2D vs 2G
```
`*` = third-placed slot. The 8 winner-slots facing a third: 1A,1B,1D,1E,1G,1I,1K,1L.

---

## 5. Knockout feed (matches 89–104) — VERIFIED against the official bracket

```
Round of 16:
  89:  W74 vs W77        93:  W83 vs W84
  90:  W73 vs W75        94:  W81 vs W82
  91:  W76 vs W78        95:  W86 vs W88
  92:  W79 vs W80        96:  W85 vs W87

Quarter-finals:
  97:  W89 vs W90        99:  W91 vs W92
  98:  W93 vs W94        100: W95 vs W96

Semi-finals:
  101: W97 vs W98        102: W99 vs W100

Third place: 103 = L101 vs L102
Final:       104 = W101 vs W102   (19 Jul, MetLife Stadium)
```
R32→R16→QF are confirmed. SF→Final (101–104) follow the standard tree.

Model every match as data — `{ id, round, home, away }` where home/away is a `groupPos` (`"1E"`), a `third` (the slot, resolved via §6), or `winnerOf` (a match id). Picking a winner must cascade forward and prune now-invalid downstream picks.

---

## 6. Third-placed allocation table

Which best-third fills which R32 slot is fixed by FIFA, depending on **which 8 of 12 groups** produced a qualifying third — 495 combinations (Annex C). Build `thirdAllocation.ts` as a lookup keyed by the sorted 8-group string, mapping the 8 third-facing slots:

```ts
// thirdAllocation["CDEFGHIJ"] = { "1A":"3C","1B":"3G","1D":"3J","1E":"3D",
//                                 "1G":"3H","1I":"3F","1K":"3E","1L":"3I" }
```

Sample rows (8 groups -> slots 1A,1B,1D,1E,1G,1I,1K,1L):
```
EFGHIJKL -> 3E,3J,3I,3F,3H,3G,3L,3K
DFGHIJKL -> 3H,3G,3I,3D,3J,3F,3L,3K
DEGHIJKL -> 3E,3J,3I,3D,3H,3G,3L,3K
CDEFGHIJ -> 3C,3G,3J,3D,3H,3F,3E,3I
```

**To generate the full table:** transcribe the "Combinations of matches in the round of 32" table from
`https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage` into the shape above with a Node script (`tsx scripts/genAllocation.ts`), then commit the output. Resolve each player's R32 thirds from their own `bestThirds` set against this table.

---

## 7. Supabase — shared storage (this is what makes standings live)

Run this SQL once in the Supabase SQL editor:

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

-- friends-only app: open access via the public anon key
alter table predictions enable row level security;
alter table results     enable row level security;
create policy "rw" on predictions for all using (true) with check (true);
create policy "rw" on results     for all using (true) with check (true);
```

Client (`src/lib/supabase.ts`):
```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```
`.env` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key is public-safe; access is governed by RLS above. Commit `.env.example`, gitignore `.env`.

Usage:
```ts
// save my bracket
await supabase.from('predictions').upsert({ player, data, locked_at });
// load everything for the leaderboard
const { data: preds }  = await supabase.from('predictions').select('*');
const { data: results }= await supabase.from('results').select('data').eq('id',1).single();
// host updates results
await supabase.from('results').upsert({ id:1, data });

// LIVE updates — re-fetch whenever anyone changes anything
supabase.channel('pool')
  .on('postgres_changes',{event:'*',schema:'public',table:'predictions'}, reload)
  .on('postgres_changes',{event:'*',schema:'public',table:'results'},     reload)
  .subscribe();
```
Use `localStorage` only as a draft cache while editing; the source of truth is Supabase.

---

## 8. Types (`src/types.ts`)

```ts
export type GroupId =
  'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';

export interface GroupPick { first: string; second: string; third: string; }

export interface Prediction {
  player: string;
  groups: Record<GroupId, GroupPick>;
  bestThirds: string[];              // exactly 8 team names
  winners: Record<number, string>;   // match id (73..104) -> team name
}

export type Results = Partial<Pick<Prediction,'groups'|'bestThirds'|'winners'>>;
```

---

## 9. Project structure

```
wc2026-bracket/
├─ src/
│  ├─ data/        teams.ts · matches.ts · thirdAllocation.ts
│  ├─ lib/         supabase.ts · resolveBracket.ts · score.ts
│  ├─ components/  NamePicker · GroupPicker · Bracket · Leaderboard · ResultsAdmin
│  ├─ types.ts
│  └─ App.tsx
├─ scripts/        genAllocation.ts   (run with tsx, output committed)
├─ .env.example
└─ index.html
```

## 10. Build order

1. `teams.ts`, `matches.ts` (§3–5), `genAllocation.ts` → `thirdAllocation.ts` (§6).
2. Supabase project + SQL (§7) + `.env`.
3. `NamePicker` → pick name (held in state + localStorage).
4. `GroupPicker` — steps 1–3, enforce exactly 8 thirds.
5. `resolveBracket.ts` — picks → filled R32 (apply §6) → cascade winners forward (§5), pruning invalid downstream picks.
6. `Bracket` — click to advance a team each match.
7. Save to Supabase; lock at deadline; reveal all picks after lock.
8. `ResultsAdmin` (host) + `score.ts` (§2) + `Leaderboard`, all live via the realtime channel.

## 11. Gotchas

- Lock strictly at the deadline; disable bracket writes after it.
- Changing an early-round winner must prune every downstream pick that depended on it.
- "Exactly 8 thirds" is a hard validation before the bracket can resolve.
- Keep all bracket structure in `data/`, never hardcoded in components.