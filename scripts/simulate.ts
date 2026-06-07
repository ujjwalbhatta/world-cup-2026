/**
 * End-to-end simulation:
 * 1. Seeds actual results (admin side) to Supabase
 * 2. Seeds one player's prediction (with known correct/wrong picks)
 * 3. Fetches back and scores using our real functions
 * 4. Asserts scores match expected values
 * 5. Clears all data on success
 *
 * Run: npx tsx scripts/simulate.ts
 */

import { createClient } from '@supabase/supabase-js';
import { calcBracketScore } from '../src/lib/bracketScore';
import { calcMatchScore } from '../src/lib/matchScore';
import { GROUP_FIXTURES } from '../src/data/groupFixtures';
import type { Prediction, Results } from '../src/types';
import type { PickMap, ResultMap } from '../src/lib/useMatchPicks';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

// ── Actual results (what really happened) ────────────────────────────────────

const ACTUAL_GROUPS: Results['groups'] = {
  A: { first: 'Mexico',       second: 'South Korea', third: 'South Africa' },
  B: { first: 'Canada',       second: 'Switzerland', third: 'Qatar' },
  C: { first: 'Brazil',       second: 'Morocco',     third: 'Scotland' },
  D: { first: 'USA',          second: 'Paraguay',    third: 'Australia' },
  E: { first: 'Germany',      second: 'Ecuador',     third: "Côte d'Ivoire" },
  F: { first: 'Netherlands',  second: 'Japan',       third: 'Sweden' },
  G: { first: 'Belgium',      second: 'Egypt',       third: 'Iran' },
  H: { first: 'Spain',        second: 'Uruguay',     third: 'Saudi Arabia' },
  I: { first: 'France',       second: 'Senegal',     third: 'Norway' },
  J: { first: 'Argentina',    second: 'Algeria',     third: 'Austria' },
  K: { first: 'Portugal',     second: 'Colombia',    third: 'DR Congo' },
  L: { first: 'England',      second: 'Croatia',     third: 'Ghana' },
};

// Groups C,D,E,F,G,H,I,J → CDEFGHIJ allocation:
// 1A←3C, 1B←3G, 1D←3J, 1E←3D, 1G←3H, 1I←3F, 1K←3E, 1L←3I
const ACTUAL_BEST_THIRDS = ['Scotland','Iran','Austria','Australia','Saudi Arabia','Sweden',"Côte d'Ivoire",'Norway'];

// R32 resolved matchups (for reference):
// M73: S.Korea vs Switzerland  → Switzerland
// M74: Germany vs Australia    → Germany
// M75: Netherlands vs Morocco  → Netherlands
// M76: Brazil vs Japan         → Brazil
// M77: France vs Sweden        → France
// M78: Ecuador vs Senegal      → Ecuador
// M79: Mexico vs Scotland      → Mexico
// M80: England vs Norway       → England
// M81: USA vs Austria          → USA
// M82: Belgium vs Saudi Arabia → Belgium
// M83: Colombia vs Croatia     → Colombia
// M84: Spain vs Algeria        → Spain
// M85: Canada vs Iran          → Canada
// M86: Argentina vs Uruguay    → Argentina
// M87: Portugal vs C.d'Ivoire  → Portugal
// M88: Paraguay vs Egypt       → Egypt
// R16: M89 Ger vs Fra→Germany, M90 Swi vs Neth→Netherlands, M91 Bra vs Ecu→Brazil, M92 Mex vs Eng→England
//      M93 Col vs Spa→Spain, M94 USA vs Bel→USA, M95 Arg vs Egy→Argentina, M96 Can vs Por→Portugal
// QF:  M97 Ger vs Neth→Germany, M98 Spa vs USA→Spain, M99 Bra vs Eng→Brazil, M100 Arg vs Por→Argentina
// SF:  M101 Ger vs Spa→Germany, M102 Bra vs Arg→Brazil
// F:   M104 Ger vs Bra→Brazil  (upset)

const ACTUAL_WINNERS: Record<number, string> = {
  73: 'Switzerland', 74: 'Germany',    75: 'Netherlands', 76: 'Brazil',
  77: 'France',      78: 'Ecuador',    79: 'Mexico',      80: 'England',
  81: 'USA',         82: 'Belgium',    83: 'Colombia',    84: 'Spain',
  85: 'Canada',      86: 'Argentina',  87: 'Portugal',    88: 'Egypt',
  89: 'Germany',     90: 'Netherlands',91: 'Brazil',      92: 'England',
  93: 'Spain',       94: 'USA',        95: 'Argentina',   96: 'Portugal',
  97: 'Germany',     98: 'Spain',      99: 'Brazil',     100: 'Argentina',
  101: 'Germany',   102: 'Brazil',
  104: 'Brazil',
};

const ACTUAL_RESULTS: Results = {
  groups:     ACTUAL_GROUPS,
  bestThirds: ACTUAL_BEST_THIRDS,
  winners:    ACTUAL_WINNERS,
};

// ── Player prediction (Ujjwal) ───────────────────────────────────────────────
// Intentionally wrong on a few things:
//  - Group A 3rd: picks Czechia (actual: South Africa) — 3rd doesn't affect group pts
//  - Best 8 thirds: still picks the same 8 because none come from Group A
//  - R32: wrong on M73 (picks South Korea, actual Swiss) and M83 (picks Croatia, actual Colombia)
//  - SF: wrong on M102 (picks Argentina, actual Brazil)
//  - Final: wrong on M104 (picks Germany, actual Brazil)

const PLAYER_PRED: Prediction = {
  player: 'Ujjwal',
  groups: {
    A: { first: 'Mexico',      second: 'South Korea', third: 'Czechia' },      // 3rd wrong — doesn't affect pts
    B: { first: 'Canada',      second: 'Switzerland', third: 'Qatar' },
    C: { first: 'Brazil',      second: 'Morocco',     third: 'Scotland' },
    D: { first: 'USA',         second: 'Paraguay',    third: 'Australia' },
    E: { first: 'Germany',     second: 'Ecuador',     third: "Côte d'Ivoire" },
    F: { first: 'Netherlands', second: 'Japan',       third: 'Sweden' },
    G: { first: 'Belgium',     second: 'Egypt',       third: 'Iran' },
    H: { first: 'Spain',       second: 'Uruguay',     third: 'Saudi Arabia' },
    I: { first: 'France',      second: 'Senegal',     third: 'Norway' },
    J: { first: 'Argentina',   second: 'Algeria',     third: 'Austria' },
    K: { first: 'Portugal',    second: 'Colombia',    third: 'DR Congo' },
    L: { first: 'England',     second: 'Croatia',     third: 'Ghana' },
  },
  // Same 8 groups (C-J), all correct
  bestThirds: ['Scotland', 'Iran', 'Austria', 'Australia', 'Saudi Arabia', 'Sweden', "Côte d'Ivoire", 'Norway'],
  winners: {
    // R32 — 14 correct, 2 wrong
    73: 'South Korea',  // ✗ actual: Switzerland
    74: 'Germany',      // ✓
    75: 'Netherlands',  // ✓
    76: 'Brazil',       // ✓
    77: 'France',       // ✓
    78: 'Ecuador',      // ✓
    79: 'Mexico',       // ✓
    80: 'England',      // ✓
    81: 'USA',          // ✓
    82: 'Belgium',      // ✓
    83: 'Croatia',      // ✗ actual: Colombia
    84: 'Spain',        // ✓
    85: 'Canada',       // ✓
    86: 'Argentina',    // ✓
    87: 'Portugal',     // ✓
    88: 'Egypt',        // ✓
    // R16 — all 8 correct (team names match regardless of who they faced)
    89: 'Germany',      // ✓
    90: 'Netherlands',  // ✓
    91: 'Brazil',       // ✓
    92: 'England',      // ✓
    93: 'Spain',        // ✓ (player thought it was Croatia vs Spain, actual Colombia vs Spain — Spain wins both)
    94: 'USA',          // ✓
    95: 'Argentina',    // ✓
    96: 'Portugal',     // ✓
    // QF — all 4 correct
    97: 'Germany',      // ✓
    98: 'Spain',        // ✓
    99: 'Brazil',       // ✓
    100: 'Argentina',   // ✓
    // SF — M101 correct, M102 wrong
    101: 'Germany',     // ✓
    102: 'Argentina',   // ✗ actual: Brazil
    // Final — wrong (picks Germany, Brazil wins)
    104: 'Germany',     // ✗ actual: Brazil
  },
};

// ── Expected bracket score ───────────────────────────────────────────────────
// Groups 1st/2nd: all 12 groups correct = 24pts
// Thirds: 8/8 correct = 8pts
// R32: 14 correct × 2 = 28pts
// R16: 8 correct × 3 = 24pts
// QF: 4 correct × 5 = 20pts
// SF: 1 correct × 8 = 8pts (M101 ✓, M102 ✗)
// Final: 0pts (wrong)
// Total: 24 + 8 + 28 + 24 + 20 + 8 + 0 = 112
const EXPECTED_BRACKET = 112;

// ── Group match results for match predictor scoring ──────────────────────────
// Simulate 72 group games: player got 60 right, 12 wrong → 60pts
// Knockout: correct on all same matches as bracket → same set
// We'll generate these programmatically

function buildGroupMatchResults(): Array<{ match_id: number; home: string; away: string; result: string }> {
  return GROUP_FIXTURES.map((f: { id: number; home: string; away: string }, idx: number) => ({
    match_id: f.id,
    home: f.home,
    away: f.away,
    result: idx % 6 === 0 ? 'draw' : idx % 3 === 0 ? 'away' : 'home', // deterministic mix
  }));
}

function buildGroupMatchPicks(results: Array<{ match_id: number; result: string }>): PickMap {
  const picks: PickMap = {};
  results.forEach((r, idx) => {
    // Player is correct on 60, wrong on 12 (every 6th game they pick wrong)
    if (idx % 6 === 0) {
      // wrong pick
      picks[r.match_id] = r.result === 'home' ? 'away' : 'home';
    } else {
      picks[r.match_id] = r.result as 'home' | 'draw' | 'away';
    }
  });
  return picks;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Starting simulation...\n');

  // 1. Seed actual results
  console.log('📥 Seeding actual results (admin side)...');
  const { error: resErr } = await supabase
    .from('results')
    .upsert({ id: 1, data: ACTUAL_RESULTS });
  if (resErr) throw new Error(`results upsert failed: ${resErr.message}`);

  // 2. Seed group match results (for match predictor)
  const groupMatchResults = buildGroupMatchResults();
  const { error: mrErr } = await supabase.from('match_results').upsert(groupMatchResults);
  if (mrErr) throw new Error(`match_results upsert failed: ${mrErr.message}`);

  // Seed knockout match results
  const koResults = Object.entries(ACTUAL_WINNERS).map(([mid, winner]) => {
    const id = Number(mid);
    // Get home/away from our resolved bracket
    const home = getHome(id);
    const away = getAway(id);
    return {
      match_id: id,
      home,
      away,
      result: home === winner ? 'home' : 'away',
    };
  });
  await supabase.from('match_results').upsert(koResults);

  // 3. Seed player prediction
  console.log('📥 Seeding Ujjwal\'s prediction...');
  const { error: predErr } = await supabase.from('predictions').upsert({
    player: 'Ujjwal',
    data: PLAYER_PRED,
    updated_at: new Date().toISOString(),
  });
  if (predErr) throw new Error(`predictions upsert failed: ${predErr.message}`);

  // 4. Build match picks for Ujjwal
  const groupPicks = buildGroupMatchPicks(groupMatchResults);
  const koPicks: PickMap = {};
  Object.entries(ACTUAL_WINNERS).forEach(([mid, winner]) => {
    const id = Number(mid);
    const h = getHome(id), a = getAway(id);
    const playerPick = PLAYER_PRED.winners[id];
    if (playerPick && h && a) {
      koPicks[id] = playerPick === h ? 'home' : 'away';
    }
  });
  const allPicks: PickMap = { ...groupPicks, ...koPicks };

  const pickRows = Object.entries(allPicks).map(([mid, pick]) => ({
    player: 'Ujjwal',
    match_id: Number(mid),
    pick,
  }));
  const { error: pickErr } = await supabase.from('match_picks').upsert(pickRows);
  if (pickErr) throw new Error(`match_picks upsert failed: ${pickErr.message}`);

  // 5. Fetch back and score
  console.log('\n📊 Fetching from Supabase and scoring...');
  const [
    { data: predRow },
    { data: resultsRow },
    { data: pickRows2 },
    { data: mrRows },
  ] = await Promise.all([
    supabase.from('predictions').select('data').eq('player', 'Ujjwal').single(),
    supabase.from('results').select('data').eq('id', 1).single(),
    supabase.from('match_picks').select('match_id, pick').eq('player', 'Ujjwal'),
    supabase.from('match_results').select('*'),
  ]);

  const pred   = predRow?.data as Prediction;
  const actual = resultsRow?.data as Results;

  const pickMap: PickMap = {};
  for (const r of pickRows2 ?? []) pickMap[r.match_id] = r.pick;

  const resultMap: ResultMap = {};
  for (const r of mrRows ?? []) resultMap[r.match_id] = r;

  const bracketScore = calcBracketScore(pred, actual);
  const matchScore   = calcMatchScore(pickMap, resultMap);

  // 6. Verify
  console.log('\n✅ RESULTS:');
  console.log(`  Bracket score:  ${bracketScore}  (expected: ${EXPECTED_BRACKET})`);

  const groupMatchCorrect = groupMatchResults.filter((_, i) => i % 6 !== 0).length;
  const koCorrect = Object.entries(ACTUAL_WINNERS).filter(([mid]) => {
    const id = Number(mid);
    return PLAYER_PRED.winners[id] === ACTUAL_WINNERS[id];
  }).length;
  const expectedMatchScore =
    groupMatchCorrect +                       // group games (1pt each)
    Object.entries(ACTUAL_WINNERS).reduce((sum, [mid]) => {
      const id = Number(mid);
      if (PLAYER_PRED.winners[id] !== ACTUAL_WINNERS[id]) return sum;
      if (id <= 88)  return sum + 2;
      if (id <= 96)  return sum + 3;
      if (id <= 100) return sum + 4;
      if (id === 103) return sum + 5;
      if (id <= 102) return sum + 5;
      return sum + 6; // Final
    }, 0);

  console.log(`  Match score:    ${matchScore}  (expected: ~${expectedMatchScore})`);

  let pass = true;
  if (bracketScore !== EXPECTED_BRACKET) {
    console.error(`\n❌ BRACKET SCORE MISMATCH: got ${bracketScore}, expected ${EXPECTED_BRACKET}`);
    pass = false;
  } else {
    console.log('\n  ✓ Bracket score correct');
  }
  if (Math.abs(matchScore - expectedMatchScore) > 2) {
    console.error(`\n❌ MATCH SCORE MISMATCH: got ${matchScore}, expected ~${expectedMatchScore}`);
    pass = false;
  } else {
    console.log('  ✓ Match score correct');
  }

  // Breakdown
  console.log('\n📋 Bracket breakdown:');
  console.log('  Group 1st/2nd (all correct): 24');
  console.log('  Best-8 thirds (all correct):  8');
  console.log('  R32 (14/16 correct × 2):     28');
  console.log('  R16 (8/8 correct × 3):       24');
  console.log('  QF  (4/4 correct × 5):       20');
  console.log('  SF  (1/2 correct × 8):        8');
  console.log('  Final (wrong):                 0');
  console.log('  ─────────────────────────────────');
  console.log(`  Total:                       ${EXPECTED_BRACKET}`);

  if (!pass) {
    console.error('\n🛑 Simulation failed — data NOT cleared. Fix the scoring logic first.');
    process.exit(1);
  }

  // 7. Clear all data
  console.log('\n🧹 All checks passed! Clearing test data...');
  await Promise.all([
    supabase.from('predictions').delete().neq('player', '~'),
    supabase.from('match_picks').delete().neq('player', '~'),
    supabase.from('match_results').delete().gte('match_id', 1),
    supabase.from('results').upsert({ id: 1, data: {} }),
  ]);
  console.log('✅ DB cleared. Ready for real play!\n');
}

// ── Helpers to get home/away from our known R32 resolution ──────────────────
// (hardcoded from our known actual results above — avoids re-importing resolver)
const MATCHUP: Record<number, [string, string]> = {
  73: ['South Korea', 'Switzerland'],
  74: ['Germany', 'Australia'],
  75: ['Netherlands', 'Morocco'],
  76: ['Brazil', 'Japan'],
  77: ['France', 'Sweden'],
  78: ['Ecuador', 'Senegal'],
  79: ['Mexico', 'Scotland'],
  80: ['England', 'Norway'],
  81: ['USA', 'Austria'],
  82: ['Belgium', 'Saudi Arabia'],
  83: ['Colombia', 'Croatia'],
  84: ['Spain', 'Algeria'],
  85: ['Canada', 'Iran'],
  86: ['Argentina', 'Uruguay'],
  87: ['Portugal', "Côte d'Ivoire"],
  88: ['Paraguay', 'Egypt'],
  89: ['Germany', 'France'],
  90: ['Switzerland', 'Netherlands'],
  91: ['Brazil', 'Ecuador'],
  92: ['Mexico', 'England'],
  93: ['Colombia', 'Spain'],
  94: ['USA', 'Belgium'],
  95: ['Argentina', 'Egypt'],
  96: ['Canada', 'Portugal'],
  97: ['Germany', 'Netherlands'],
  98: ['Spain', 'USA'],
  99: ['Brazil', 'England'],
  100: ['Argentina', 'Portugal'],
  101: ['Germany', 'Spain'],
  102: ['Brazil', 'Argentina'],
  104: ['Germany', 'Brazil'],
};
function getHome(id: number) { return MATCHUP[id]?.[0] ?? ''; }
function getAway(id: number) { return MATCHUP[id]?.[1] ?? ''; }

main().catch(err => { console.error(err); process.exit(1); });
