import type { VercelRequest, VercelResponse } from '@vercel/node';

const ESPN_URL = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const r = await fetch(ESPN_URL);

  if (!r.ok) {
    res.status(r.status).json({ error: 'upstream error', status: r.status });
    return;
  }

  const data = await r.json();

  // ESPN wraps groups inside `children[].standings.entries`
  // Normalise to the shape GroupStandings.tsx expects:
  // { standings: [{ name, rows: [{ position, team, matches, wins, draws, losses, scoresFor, scoresAgainst, scoreDiffFormatted, points }] }] }
  const groups = (data.children ?? []).map((child: any) => {
    const name: string = child.name ?? child.abbreviation ?? '';
    const entries: any[] = child.standings?.entries ?? [];
    const rows = entries.map((e: any) => {
      const stats: Record<string, number> = {};
      for (const s of e.stats ?? []) stats[s.name] = Number(s.value);
      const gd = (stats['pointDifferential'] ?? stats['goalDifference'] ?? 0);
      return {
        position: stats['rank'] ?? 0,
        team: e.team?.displayName ?? e.team?.name ?? '',
        matches: stats['gamesPlayed'] ?? 0,
        wins: stats['wins'] ?? 0,
        draws: stats['ties'] ?? 0,
        losses: stats['losses'] ?? 0,
        scoresFor: stats['pointsFor'] ?? 0,
        scoresAgainst: stats['pointsAgainst'] ?? 0,
        scoreDiffFormatted: gd >= 0 ? `+${gd}` : `${gd}`,
        points: stats['points'] ?? 0,
      };
    }).sort((a: any, b: any) => a.position - b.position);
    return { name, rows };
  });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.status(200).json({ standings: groups });
}
