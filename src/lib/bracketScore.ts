import type { Prediction, Results, GroupId } from '../types';

const ROUND_PTS: Record<number, number> = {};
// R32 matches 73-88 → 2pts, R16 89-96 → 3pts, QF 97-100 → 5pts, SF 101-102 → 8pts, F 104 → 15pts
for (let i = 73; i <= 88;  i++) ROUND_PTS[i] = 2;
for (let i = 89; i <= 96;  i++) ROUND_PTS[i] = 3;
for (let i = 97; i <= 100; i++) ROUND_PTS[i] = 5;
ROUND_PTS[101] = 8; ROUND_PTS[102] = 8; ROUND_PTS[104] = 15;

export function calcBracketScore(pred: Prediction, actual: Results): number {
  let score = 0;

  // Group 1st + 2nd — 1pt each
  for (const gid of Object.keys(pred.groups) as GroupId[]) {
    const pick = pred.groups[gid];
    const act  = actual.groups?.[gid];
    if (!act) continue;
    if (pick.first  === act.first)  score += 1;
    if (pick.second === act.second) score += 1;
  }

  // Best-8 thirds — 1pt each
  for (const team of pred.bestThirds ?? []) {
    if (actual.bestThirds?.includes(team)) score += 1;
  }

  // Knockout winners — points per round
  for (const [midStr, pts] of Object.entries(ROUND_PTS)) {
    const mid = Number(midStr);
    if (!pred.winners[mid] || !actual.winners?.[mid]) continue;
    if (pred.winners[mid] === actual.winners[mid]) score += pts;
  }

  return score;
}
