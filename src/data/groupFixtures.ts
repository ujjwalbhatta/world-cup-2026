import type { GroupId } from '../types';

export interface GroupFixture {
  id: number;
  group: GroupId;
  home: string;
  away: string;
  kickoff: string; // ISO UTC
}

// 72 group-stage fixtures, Jun 11–27 2026
// MD1 ≈ Jun 11–17 | MD2 ≈ Jun 18–23 | MD3 ≈ Jun 24–27
// Kickoff times are 18:00, 21:00, or 00:00 UTC (common FIFA slots)
export const GROUP_FIXTURES: GroupFixture[] = [
  // ── Group A ──────────────────────────────────────────────────
  { id:  1, group: 'A', home: 'Mexico',       away: 'South Africa', kickoff: '2026-06-11T19:00:00Z' }, // 3 PM ET
  { id:  2, group: 'A', home: 'South Korea',  away: 'Czechia',      kickoff: '2026-06-12T02:00:00Z' }, // 10 PM ET Jun 11
  { id:  3, group: 'A', home: 'Czechia',      away: 'South Africa', kickoff: '2026-06-18T16:00:00Z' }, // noon ET
  { id:  4, group: 'A', home: 'Mexico',       away: 'South Korea',  kickoff: '2026-06-19T03:00:00Z' }, // 11 PM ET Jun 18
  { id:  5, group: 'A', home: 'Czechia',      away: 'Mexico',       kickoff: '2026-06-25T01:00:00Z' }, // 9 PM ET Jun 24
  { id:  6, group: 'A', home: 'South Africa', away: 'South Korea',  kickoff: '2026-06-25T02:00:00Z' }, // 10 PM ET Jun 24

  // ── Group B ──────────────────────────────────────────────────
  { id:  7, group: 'B', home: 'Canada',               away: 'Bosnia & Herzegovina', kickoff: '2026-06-12T18:00:00Z' },
  { id:  8, group: 'B', home: 'Qatar',                away: 'Switzerland',          kickoff: '2026-06-13T00:00:00Z' },
  { id:  9, group: 'B', home: 'Switzerland',          away: 'Bosnia & Herzegovina', kickoff: '2026-06-18T19:00:00Z' }, // 3 PM ET
  { id: 10, group: 'B', home: 'Canada',               away: 'Qatar',                kickoff: '2026-06-18T22:00:00Z' }, // 6 PM ET
  { id: 11, group: 'B', home: 'Canada',               away: 'Switzerland',          kickoff: '2026-06-25T01:00:00Z' }, // times TBD
  { id: 12, group: 'B', home: 'Bosnia & Herzegovina', away: 'Qatar',                kickoff: '2026-06-25T02:00:00Z' }, // times TBD

  // ── Group C ──────────────────────────────────────────────────
  { id: 13, group: 'C', home: 'Brazil',  away: 'Morocco',  kickoff: '2026-06-13T18:00:00Z' },
  { id: 14, group: 'C', home: 'Haiti',   away: 'Scotland', kickoff: '2026-06-13T21:00:00Z' },
  { id: 15, group: 'C', home: 'Brazil',  away: 'Scotland', kickoff: '2026-06-19T18:00:00Z' },
  { id: 16, group: 'C', home: 'Morocco', away: 'Haiti',    kickoff: '2026-06-19T21:00:00Z' },
  { id: 17, group: 'C', home: 'Morocco', away: 'Scotland', kickoff: '2026-06-25T18:00:00Z' },
  { id: 18, group: 'C', home: 'Brazil',  away: 'Haiti',    kickoff: '2026-06-25T18:00:00Z' },

  // ── Group D ──────────────────────────────────────────────────
  { id: 19, group: 'D', home: 'USA',       away: 'Paraguay',  kickoff: '2026-06-12T21:00:00Z' },
  { id: 20, group: 'D', home: 'Australia', away: 'Türkiye',   kickoff: '2026-06-14T03:00:00Z' },
  { id: 21, group: 'D', home: 'USA',       away: 'Türkiye',   kickoff: '2026-06-20T18:00:00Z' },
  { id: 22, group: 'D', home: 'Paraguay',  away: 'Australia', kickoff: '2026-06-20T21:00:00Z' },
  { id: 23, group: 'D', home: 'Paraguay',  away: 'Türkiye',   kickoff: '2026-06-25T21:00:00Z' },
  { id: 24, group: 'D', home: 'USA',       away: 'Australia', kickoff: '2026-06-25T21:00:00Z' },

  // ── Group E ──────────────────────────────────────────────────
  { id: 25, group: 'E', home: 'Germany',       away: 'Curaçao',       kickoff: '2026-06-14T18:00:00Z' },
  { id: 26, group: 'E', home: 'Côte d\'Ivoire', away: 'Ecuador',       kickoff: '2026-06-14T21:00:00Z' },
  { id: 27, group: 'E', home: 'Germany',       away: 'Ecuador',       kickoff: '2026-06-20T18:00:00Z' },
  { id: 28, group: 'E', home: 'Curaçao',       away: 'Côte d\'Ivoire', kickoff: '2026-06-20T21:00:00Z' },
  { id: 29, group: 'E', home: 'Curaçao',       away: 'Ecuador',       kickoff: '2026-06-26T18:00:00Z' },
  { id: 30, group: 'E', home: 'Germany',       away: 'Côte d\'Ivoire', kickoff: '2026-06-26T18:00:00Z' },

  // ── Group F ──────────────────────────────────────────────────
  { id: 31, group: 'F', home: 'Netherlands', away: 'Japan',   kickoff: '2026-06-14T18:00:00Z' },
  { id: 32, group: 'F', home: 'Sweden',      away: 'Tunisia', kickoff: '2026-06-14T21:00:00Z' },
  { id: 33, group: 'F', home: 'Netherlands', away: 'Tunisia', kickoff: '2026-06-21T18:00:00Z' },
  { id: 34, group: 'F', home: 'Japan',       away: 'Sweden',  kickoff: '2026-06-21T21:00:00Z' },
  { id: 35, group: 'F', home: 'Japan',       away: 'Tunisia', kickoff: '2026-06-26T21:00:00Z' },
  { id: 36, group: 'F', home: 'Netherlands', away: 'Sweden',  kickoff: '2026-06-26T21:00:00Z' },

  // ── Group G ──────────────────────────────────────────────────
  { id: 37, group: 'G', home: 'Belgium',     away: 'Egypt',        kickoff: '2026-06-15T18:00:00Z' },
  { id: 38, group: 'G', home: 'Iran',        away: 'New Zealand',  kickoff: '2026-06-15T21:00:00Z' },
  { id: 39, group: 'G', home: 'Belgium',     away: 'New Zealand',  kickoff: '2026-06-21T18:00:00Z' },
  { id: 40, group: 'G', home: 'Egypt',       away: 'Iran',         kickoff: '2026-06-21T21:00:00Z' },
  { id: 41, group: 'G', home: 'Egypt',       away: 'New Zealand',  kickoff: '2026-06-27T18:00:00Z' },
  { id: 42, group: 'G', home: 'Belgium',     away: 'Iran',         kickoff: '2026-06-27T18:00:00Z' },

  // ── Group H ──────────────────────────────────────────────────
  { id: 43, group: 'H', home: 'Spain',       away: 'Cabo Verde',   kickoff: '2026-06-15T18:00:00Z' },
  { id: 44, group: 'H', home: 'Saudi Arabia', away: 'Uruguay',     kickoff: '2026-06-15T21:00:00Z' },
  { id: 45, group: 'H', home: 'Spain',       away: 'Uruguay',      kickoff: '2026-06-22T18:00:00Z' },
  { id: 46, group: 'H', home: 'Cabo Verde',  away: 'Saudi Arabia', kickoff: '2026-06-22T21:00:00Z' },
  { id: 47, group: 'H', home: 'Cabo Verde',  away: 'Uruguay',      kickoff: '2026-06-27T21:00:00Z' },
  { id: 48, group: 'H', home: 'Spain',       away: 'Saudi Arabia', kickoff: '2026-06-27T21:00:00Z' },

  // ── Group I ──────────────────────────────────────────────────
  { id: 49, group: 'I', home: 'France',  away: 'Senegal', kickoff: '2026-06-16T19:00:00Z' }, // 3 PM ET
  { id: 50, group: 'I', home: 'Iraq',    away: 'Norway',  kickoff: '2026-06-16T22:00:00Z' }, // 6 PM ET
  { id: 51, group: 'I', home: 'France',  away: 'Norway',  kickoff: '2026-06-22T18:00:00Z' },
  { id: 52, group: 'I', home: 'Senegal', away: 'Iraq',    kickoff: '2026-06-22T21:00:00Z' },
  { id: 53, group: 'I', home: 'Senegal', away: 'Norway',  kickoff: '2026-06-28T18:00:00Z' },
  { id: 54, group: 'I', home: 'France',  away: 'Iraq',    kickoff: '2026-06-28T18:00:00Z' },

  // ── Group J ──────────────────────────────────────────────────
  { id: 55, group: 'J', home: 'Argentina', away: 'Algeria', kickoff: '2026-06-17T01:00:00Z' }, // 9 PM ET Jun 16
  { id: 56, group: 'J', home: 'Austria',   away: 'Jordan',  kickoff: '2026-06-17T04:00:00Z' }, // midnight ET Jun 16/17
  { id: 57, group: 'J', home: 'Argentina', away: 'Jordan',  kickoff: '2026-06-23T18:00:00Z' },
  { id: 58, group: 'J', home: 'Algeria',   away: 'Austria', kickoff: '2026-06-23T21:00:00Z' },
  { id: 59, group: 'J', home: 'Algeria',   away: 'Jordan',  kickoff: '2026-06-28T21:00:00Z' },
  { id: 60, group: 'J', home: 'Argentina', away: 'Austria', kickoff: '2026-06-28T21:00:00Z' },

  // ── Group K ──────────────────────────────────────────────────
  { id: 61, group: 'K', home: 'Portugal',   away: 'DR Congo',  kickoff: '2026-06-17T17:00:00Z' }, // 1 PM ET
  { id: 62, group: 'K', home: 'Uzbekistan', away: 'Colombia', kickoff: '2026-06-18T02:00:00Z' }, // 10 PM ET Jun 17
  { id: 63, group: 'K', home: 'Portugal', away: 'Colombia',   kickoff: '2026-06-23T18:00:00Z' },
  { id: 64, group: 'K', home: 'DR Congo', away: 'Uzbekistan', kickoff: '2026-06-23T21:00:00Z' },
  { id: 65, group: 'K', home: 'DR Congo', away: 'Colombia',   kickoff: '2026-06-29T18:00:00Z' },
  { id: 66, group: 'K', home: 'Portugal', away: 'Uzbekistan', kickoff: '2026-06-29T18:00:00Z' },

  // ── Group L ──────────────────────────────────────────────────
  { id: 67, group: 'L', home: 'England', away: 'Croatia', kickoff: '2026-06-17T20:00:00Z' }, // 4 PM ET
  { id: 68, group: 'L', home: 'Ghana',   away: 'Panama',  kickoff: '2026-06-17T23:00:00Z' }, // 7 PM ET
  { id: 69, group: 'L', home: 'England', away: 'Panama',  kickoff: '2026-06-24T18:00:00Z' },
  { id: 70, group: 'L', home: 'Croatia', away: 'Ghana',   kickoff: '2026-06-24T21:00:00Z' },
  { id: 71, group: 'L', home: 'Croatia', away: 'Panama',  kickoff: '2026-06-29T21:00:00Z' },
  { id: 72, group: 'L', home: 'England', away: 'Ghana',   kickoff: '2026-06-29T21:00:00Z' },
];
