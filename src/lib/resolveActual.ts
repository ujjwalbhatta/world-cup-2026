import { THIRD_ALLOCATION } from '../data/thirdAllocation';
import type { Results, GroupId } from '../types';

// Same logic as resolveBracket but operates on actual Results (not a player's prediction)
export function resolveActualBracket(
  actual: Results,
  actualWinners: Record<number, string>,
): Record<number, { home: string; away: string }> {
  const resolved: Record<number, { home: string; away: string }> = {};

  const winnerOf = (id: number) => actualWinners[id] ?? '';

  function groupPos(pos: string): string {
    const rank  = pos[0];
    const group = pos[1] as GroupId;
    const g = actual.groups?.[group];
    if (!g) return '';
    return rank === '1' ? g.first : rank === '2' ? g.second : g.third;
  }

  function resolveThird(matchIdStr: string): string {
    const thirds = actual.bestThirds ?? [];
    if (thirds.length !== 8) return '';
    const thirdsGroups = thirds.map(team => {
      for (const [gid, gpick] of Object.entries(actual.groups ?? {})) {
        if (gpick.third === team) return gid;
      }
      return '';
    }).filter(Boolean).sort();
    const key = thirdsGroups.join('');
    const allocation = THIRD_ALLOCATION[key];
    if (!allocation) return '';
    const MATCH_TO_SLOT: Record<string, string> = {
      '74': '1E', '77': '1I', '79': '1A', '80': '1L',
      '81': '1D', '82': '1G', '85': '1B', '87': '1K',
    };
    const slot = MATCH_TO_SLOT[matchIdStr] as keyof typeof allocation;
    if (!slot) return '';
    const thirdGroup = allocation[slot]?.replace('3', '');
    return actual.groups?.[thirdGroup as GroupId]?.third ?? '';
  }

  resolved[73] = { home: groupPos('2A'), away: groupPos('2B') };
  resolved[74] = { home: groupPos('1E'), away: resolveThird('74') };
  resolved[75] = { home: groupPos('1F'), away: groupPos('2C') };
  resolved[76] = { home: groupPos('1C'), away: groupPos('2F') };
  resolved[77] = { home: groupPos('1I'), away: resolveThird('77') };
  resolved[78] = { home: groupPos('2E'), away: groupPos('2I') };
  resolved[79] = { home: groupPos('1A'), away: resolveThird('79') };
  resolved[80] = { home: groupPos('1L'), away: resolveThird('80') };
  resolved[81] = { home: groupPos('1D'), away: resolveThird('81') };
  resolved[82] = { home: groupPos('1G'), away: resolveThird('82') };
  resolved[83] = { home: groupPos('2K'), away: groupPos('2L') };
  resolved[84] = { home: groupPos('1H'), away: groupPos('2J') };
  resolved[85] = { home: groupPos('1B'), away: resolveThird('85') };
  resolved[86] = { home: groupPos('1J'), away: groupPos('2H') };
  resolved[87] = { home: groupPos('1K'), away: resolveThird('87') };
  resolved[88] = { home: groupPos('2D'), away: groupPos('2G') };

  const r16: [number, number, number][] = [
    [89,74,77],[90,73,75],[91,76,78],[92,79,80],
    [93,83,84],[94,81,82],[95,86,88],[96,85,87],
  ];
  for (const [id,h,a] of r16)
    resolved[id] = { home: winnerOf(h), away: winnerOf(a) };

  const qf: [number, number, number][] = [
    [97,89,90],[98,93,94],[99,91,92],[100,95,96],
  ];
  for (const [id,h,a] of qf)
    resolved[id] = { home: winnerOf(h), away: winnerOf(a) };

  resolved[101] = { home: winnerOf(97),  away: winnerOf(98) };
  resolved[102] = { home: winnerOf(99),  away: winnerOf(100) };
  resolved[104] = { home: winnerOf(101), away: winnerOf(102) };

  return resolved;
}
