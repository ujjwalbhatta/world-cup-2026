import { THIRD_ALLOCATION } from '../data/thirdAllocation';
import type { Prediction } from '../types';

// Given a player's picks, returns a map of matchId -> { home, away } team names
// for all knockout matches that can be resolved from their picks.
export function resolveBracket(pred: Prediction): Record<number, { home: string; away: string }> {
  const resolved: Record<number, { home: string; away: string }> = {};

  // Helper: get the team a player picked to win match X
  const winnerOf = (matchId: number): string => pred.winners[matchId] ?? '';
  // Helper: get the team eliminated in match X (whichever side isn't the picked winner)
  const loserOf = (matchId: number): string => {
    const { home, away } = resolved[matchId] ?? {};
    const w = winnerOf(matchId);
    if (!w || !home || !away) return '';
    return w === home ? away : home;
  };

  // Resolve the third-place slot assignment from the player's bestThirds selection
  function resolveThird(slot: string): string {
    if (!pred.bestThirds || pred.bestThirds.length !== 8) return '';
    // Work out which 8 groups the player's thirds come from
    const thirdsGroups = pred.bestThirds.map((team) => {
      for (const [gid, gpick] of Object.entries(pred.groups)) {
        if (gpick.third === team) return gid;
      }
      return '';
    }).filter(Boolean).sort();

    const key = thirdsGroups.join('');
    const allocation = THIRD_ALLOCATION[key];
    if (!allocation) return '';

    // allocation e.g. { "1A": "3E", ... } — slot is e.g. "3rd[A/B/C/D/F]"
    // We need to find which ThirdSlot key maps to this bracket slot.
    // The bracket slots that face thirds: 74->1E, 77->1I, 79->1A, 80->1L, 81->1D, 82->1G, 85->1B, 87->1K
    const MATCH_TO_SLOT: Record<string, string> = {
      '74': '1E', '77': '1I', '79': '1A', '80': '1L',
      '81': '1D', '82': '1G', '85': '1B', '87': '1K',
    };
    const thirdSlot = MATCH_TO_SLOT[slot] as keyof typeof allocation;
    if (!thirdSlot) return '';

    // allocation["1E"] = "3F" meaning third of group F
    const thirdGroup = allocation[thirdSlot]?.replace('3', '');
    if (!thirdGroup) return '';
    return pred.groups[thirdGroup as keyof typeof pred.groups]?.third ?? '';
  }

  // R32 home sides (group positions)
  function groupPos(pos: string): string {
    const rank = pos[0]; // '1' or '2'
    const group = pos[1] as keyof typeof pred.groups;
    const gpick = pred.groups[group];
    if (!gpick) return '';
    return rank === '1' ? gpick.first : gpick.second;
  }

  // Match 73: 2A vs 2B
  resolved[73] = { home: groupPos('2A'), away: groupPos('2B') };
  // Match 74: 1E vs 3rd[A/B/C/D/F]
  resolved[74] = { home: groupPos('1E'), away: resolveThird('74') };
  // Match 75: 1F vs 2C
  resolved[75] = { home: groupPos('1F'), away: groupPos('2C') };
  // Match 76: 1C vs 2F
  resolved[76] = { home: groupPos('1C'), away: groupPos('2F') };
  // Match 77: 1I vs 3rd[C/D/F/G/H]
  resolved[77] = { home: groupPos('1I'), away: resolveThird('77') };
  // Match 78: 2E vs 2I
  resolved[78] = { home: groupPos('2E'), away: groupPos('2I') };
  // Match 79: 1A vs 3rd[C/E/F/H/I]
  resolved[79] = { home: groupPos('1A'), away: resolveThird('79') };
  // Match 80: 1L vs 3rd[E/H/I/J/K]
  resolved[80] = { home: groupPos('1L'), away: resolveThird('80') };
  // Match 81: 1D vs 3rd[B/E/F/I/J]
  resolved[81] = { home: groupPos('1D'), away: resolveThird('81') };
  // Match 82: 1G vs 3rd[A/E/H/I/J]
  resolved[82] = { home: groupPos('1G'), away: resolveThird('82') };
  // Match 83: 2K vs 2L
  resolved[83] = { home: groupPos('2K'), away: groupPos('2L') };
  // Match 84: 1H vs 2J
  resolved[84] = { home: groupPos('1H'), away: groupPos('2J') };
  // Match 85: 1B vs 3rd[E/F/G/I/J]
  resolved[85] = { home: groupPos('1B'), away: resolveThird('85') };
  // Match 86: 1J vs 2H
  resolved[86] = { home: groupPos('1J'), away: groupPos('2H') };
  // Match 87: 1K vs 3rd[D/E/I/J/L]
  resolved[87] = { home: groupPos('1K'), away: resolveThird('87') };
  // Match 88: 2D vs 2G
  resolved[88] = { home: groupPos('2D'), away: groupPos('2G') };

  // R16: feed from R32 winners
  const r16: [number, number, number][] = [
    [89, 74, 77], [90, 73, 75], [91, 76, 78], [92, 79, 80],
    [93, 83, 84], [94, 81, 82], [95, 86, 88], [96, 85, 87],
  ];
  for (const [id, h, a] of r16) {
    resolved[id] = { home: winnerOf(h), away: winnerOf(a) };
  }

  // QF
  const qf: [number, number, number][] = [
    [97, 89, 90], [98, 93, 94], [99, 91, 92], [100, 95, 96],
  ];
  for (const [id, h, a] of qf) {
    resolved[id] = { home: winnerOf(h), away: winnerOf(a) };
  }

  // SF
  resolved[101] = { home: winnerOf(97), away: winnerOf(98) };
  resolved[102] = { home: winnerOf(99), away: winnerOf(100) };

  // 3rd place + Final
  resolved[103] = { home: loserOf(101), away: loserOf(102) };
  resolved[104] = { home: winnerOf(101), away: winnerOf(102) };

  return resolved;
}
