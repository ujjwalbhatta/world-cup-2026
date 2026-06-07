# World Cup 2026 Bracket & Match Predictor

A private app for 6 friends to compete across two prediction contests during the 2026 FIFA World Cup. $10 buy-in, winner takes all.

**Players:** Ujjwal · Sumaly · Utsabi · Sabun · Riti · Avash

---

## Two contests

### Bracket Predictor
Pick the entire knockout bracket before first kickoff (June 11, 2026 18:00 UTC). Picks lock at the deadline — then everyone's brackets are revealed and scored live as results come in.

### Match Predictor
Predict Home / Draw / Away for all 72 group games, and who advances in all 32 knockout matches. Each match locks individually at its own kickoff, so you keep predicting throughout the tournament.

---

## Stack

- **Vite + React + TypeScript** — fully static frontend
- **Supabase** — shared database so all 6 players see the same live leaderboard
- **Vercel** — free hosting

No login. Each player just taps their name (honor system).

---

## Local setup

```bash
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev
```

### Supabase

Create a free project at [supabase.com](https://supabase.com), then run the SQL from `Project1.md §7` and `Project2.md §4` in the SQL editor.

Add to `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Project structure

```
src/
  data/         teams.ts · groupFixtures.ts · matches.ts · thirdAllocation.ts
  lib/          supabase.ts · resolveBracket.ts · score.ts
  components/   NamePicker · GroupPicker · Bracket · MatchList · Leaderboard · ResultsAdmin
  types.ts
  App.tsx
scripts/
  genAllocation.ts   (run once with tsx to generate thirdAllocation.ts)
```

---

## Scoring

**Bracket Predictor**

| Stage | Points each |
|---|---|
| Group 1st/2nd correct | 1 |
| Correct best-8 third | 1 |
| Reaches R16 | 2 |
| Reaches QF | 3 |
| Reaches SF | 5 |
| Reaches Final | 8 |
| Champion | 15 |

**Match Predictor**

| Match type | Points |
|---|---|
| Group game (1/X/2 correct) | 1 |
| R32 winner | 2 |
| R16 winner | 3 |
| QF winner | 4 |
| SF / 3rd place | 5 |
| Final winner | 6 |
