import type { PickMap, ResultMap } from './useMatchPicks';

const POINTS: Record<string, number> = {
  R32: 2, R16: 3, QF: 4, SF: 5, '3P': 5, F: 6,
};

export function calcMatchScore(picks: PickMap, results: ResultMap): number {
  let total = 0;
  for (const [midStr, result] of Object.entries(results)) {
    const mid = Number(midStr);
    if (!result.result) continue;
    if (picks[mid] !== result.result) continue;
    // Group matches (1–72) = 1pt each; knockout = per POINTS table
    if (mid <= 72) {
      total += 1;
    } else {
      const round = getKnockoutRound(mid);
      total += POINTS[round] ?? 0;
    }
  }
  return total;
}

function getKnockoutRound(id: number): string {
  if (id <= 88)  return 'R32';
  if (id <= 96)  return 'R16';
  if (id <= 100) return 'QF';
  if (id === 103) return '3P';
  if (id <= 102) return 'SF';
  return 'F';
}
