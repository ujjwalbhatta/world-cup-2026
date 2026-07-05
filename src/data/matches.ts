// Knockout matches 73–104
// home/away is a groupPos ("1E"), a third slot ("3rd[A/B/C/D/F]"), or winnerOf a match id
export interface KnockoutMatch {
  id: number;
  round: 'R32' | 'R16' | 'QF' | 'SF' | '3P' | 'F';
  home: string;
  away: string;
  kickoff: string; // ISO UTC
}

export const KNOCKOUT_MATCHES: KnockoutMatch[] = [
  // ── Round of 32 (73–88) ─────────────────────────────────────
  { id: 73, round: 'R32', home: '2A',              away: '2B',              kickoff: '2026-06-28T19:00:00Z' }, // 2 PM CDT Jun 28
  { id: 74, round: 'R32', home: '1E',              away: '3rd[A/B/C/D/F]', kickoff: '2026-06-29T20:30:00Z' }, // 3:30 PM CDT Jun 29
  { id: 75, round: 'R32', home: '1F',              away: '2C',              kickoff: '2026-06-29T21:00:00Z' }, // 4 PM CDT Jun 29
  { id: 76, round: 'R32', home: '1C',              away: '2F',              kickoff: '2026-06-29T17:00:00Z' }, // noon CDT Jun 29
  { id: 77, round: 'R32', home: '1I',              away: '3rd[C/D/F/G/H]', kickoff: '2026-06-30T21:00:00Z' }, // 4 PM CDT Jun 30
  { id: 78, round: 'R32', home: '2E',              away: '2I',              kickoff: '2026-06-30T17:00:00Z' }, // noon CDT Jun 30
  { id: 79, round: 'R32', home: '1A',              away: '3rd[C/E/F/H/I]', kickoff: '2026-06-30T21:00:00Z' }, // 4 PM CDT Jun 30
  { id: 80, round: 'R32', home: '1L',              away: '3rd[E/H/I/J/K]', kickoff: '2026-07-01T16:00:00Z' }, // 11 AM CDT Jul 1
  { id: 81, round: 'R32', home: '1D',              away: '3rd[B/E/F/I/J]', kickoff: '2026-07-01T20:00:00Z' }, // 3 PM CDT Jul 1
  { id: 82, round: 'R32', home: '1G',              away: '3rd[A/E/H/I/J]', kickoff: '2026-07-01T20:00:00Z' }, // 3 PM CDT Jul 1
  { id: 83, round: 'R32', home: '2K',              away: '2L',              kickoff: '2026-07-02T23:00:00Z' }, // 6 PM CDT Jul 2
  { id: 84, round: 'R32', home: '1H',              away: '2J',              kickoff: '2026-07-02T19:00:00Z' }, // 2 PM CDT Jul 2
  { id: 85, round: 'R32', home: '1B',              away: '3rd[E/F/G/I/J]', kickoff: '2026-07-02T22:00:00Z' }, // 5 PM CDT Jul 2
  { id: 86, round: 'R32', home: '1J',              away: '2H',              kickoff: '2026-07-03T22:00:00Z' }, // 5 PM CDT Jul 3
  { id: 87, round: 'R32', home: '1K',              away: '3rd[D/E/I/J/L]', kickoff: '2026-07-03T22:30:00Z' }, // 5:30 PM CDT Jul 3
  { id: 88, round: 'R32', home: '2D',              away: '2G',              kickoff: '2026-07-03T18:00:00Z' }, // 1 PM CDT Jul 3

  // ── Round of 16 (89–96) ─────────────────────────────────────
  { id: 89, round: 'R16', home: 'W74', away: 'W77', kickoff: '2026-07-04T21:00:00Z' }, // Paraguay vs France, 5 PM ET Jul 4
  { id: 90, round: 'R16', home: 'W73', away: 'W75', kickoff: '2026-07-04T17:00:00Z' }, // Canada vs Morocco, 1 PM ET Jul 4
  { id: 91, round: 'R16', home: 'W76', away: 'W78', kickoff: '2026-07-05T20:00:00Z' }, // Brazil vs Norway, 4 PM ET Jul 5
  { id: 92, round: 'R16', home: 'W79', away: 'W80', kickoff: '2026-07-06T00:00:00Z' }, // Mexico vs England, 6 PM local / 8 PM ET Jul 5
  { id: 93, round: 'R16', home: 'W83', away: 'W84', kickoff: '2026-07-06T19:00:00Z' }, // Portugal vs Spain, 3 PM ET Jul 6
  { id: 94, round: 'R16', home: 'W81', away: 'W82', kickoff: '2026-07-07T00:00:00Z' }, // USA vs Belgium, 8 PM ET Jul 6
  { id: 95, round: 'R16', home: 'W86', away: 'W88', kickoff: '2026-07-07T16:00:00Z' }, // Argentina vs Egypt, 12 PM ET Jul 7
  { id: 96, round: 'R16', home: 'W85', away: 'W87', kickoff: '2026-07-07T20:00:00Z' }, // Switzerland vs Colombia, 4 PM ET Jul 7

  // ── Quarter-finals (97–100) ──────────────────────────────────
  { id:  97, round: 'QF', home: 'W89', away: 'W90', kickoff: '2026-07-09T20:00:00Z' }, // Foxborough, 4 PM ET Jul 9
  { id:  98, round: 'QF', home: 'W93', away: 'W94', kickoff: '2026-07-10T19:00:00Z' }, // Inglewood, 3 PM ET Jul 10
  { id:  99, round: 'QF', home: 'W91', away: 'W92', kickoff: '2026-07-11T21:00:00Z' }, // Miami Gardens, 5 PM ET Jul 11
  { id: 100, round: 'QF', home: 'W95', away: 'W96', kickoff: '2026-07-12T01:00:00Z' }, // Kansas City, 8 PM local / 9 PM ET Jul 11

  // ── Semi-finals (101–102) ────────────────────────────────────
  { id: 101, round: 'SF', home: 'W97',  away: 'W98',  kickoff: '2026-07-14T19:00:00Z' }, // Arlington, 3 PM ET Jul 14
  { id: 102, round: 'SF', home: 'W99',  away: 'W100', kickoff: '2026-07-15T19:00:00Z' }, // Atlanta, 3 PM ET Jul 15

  // ── Third place (103) & Final (104) ─────────────────────────
  { id: 103, round: '3P', home: 'L101', away: 'L102', kickoff: '2026-07-18T21:00:00Z' }, // Miami Gardens, 5 PM ET Jul 18
  { id: 104, round: 'F',  home: 'W101', away: 'W102', kickoff: '2026-07-19T19:00:00Z' }, // MetLife, 3 PM ET Jul 19
];
