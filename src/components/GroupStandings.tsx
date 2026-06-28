import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Results } from '../types';
import './GroupStandings.css';

interface TeamRow {
  position: number;
  team: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: string;
  pts: number;
}

interface Group {
  name: string;
  rows: TeamRow[];
}

export function GroupStandings() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [bestThirds, setBestThirds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [standingsRes, { data: actualData }] = await Promise.all([
          fetch('/api/standings'),
          supabase.from('results').select('data').eq('id', 1).single(),
        ]);

        if (!standingsRes.ok) throw new Error('standings fetch failed');
        const json = await standingsRes.json();

        const parsed: Group[] = (json.standings ?? []).map((g: any) => ({
          name: g.name as string,
          rows: (g.rows ?? []).map((r: any) => ({
            position: r.position,
            team: r.team?.name ?? '',
            p: r.matches ?? 0,
            w: r.wins ?? 0,
            d: r.draws ?? 0,
            l: r.losses ?? 0,
            gf: r.scoresFor ?? 0,
            ga: r.scoresAgainst ?? 0,
            gd: r.scoreDiffFormatted ?? '0',
            pts: r.points ?? 0,
          })),
        }));

        setGroups(parsed);
        setBestThirds((actualData?.data as Results)?.bestThirds ?? []);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);

    const ch = supabase
      .channel('gs_actual')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => load())
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(ch); };
  }, []);

  if (loading) return <div className="gs-loading">Loading standings…</div>;
  if (error)   return <div className="gs-loading">Could not load standings. Try refreshing.</div>;

  return (
    <div className="gs-wrap">
      <h3 className="gs-title">Group Stage Standings</h3>
      <div className="gs-grid">
        {groups.map(g => (
          <div key={g.name} className="gs-group">
            <div className="gs-group-header">{g.name}</div>
            <table className="gs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="gs-th-team">Team</th>
                  <th title="Played">P</th>
                  <th title="Won">W</th>
                  <th title="Drawn">D</th>
                  <th title="Lost">L</th>
                  <th title="Goals For">GF</th>
                  <th title="Goals Against">GA</th>
                  <th title="Goal Difference">GD</th>
                  <th title="Points" className="gs-th-pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r, i) => {
                  const isTop2 = i < 2;
                  const isQualThird = i === 2 && bestThirds.includes(r.team);
                  const cls = isTop2 ? 'gs-top2' : isQualThird ? 'gs-qual-third' : '';
                  return (
                    <tr key={r.team} className={cls}>
                      <td className="gs-pos">{r.position}</td>
                      <td className="gs-team">{r.team}{isQualThird ? ' ✓' : ''}</td>
                      <td>{r.p}</td>
                      <td>{r.w}</td>
                      <td>{r.d}</td>
                      <td>{r.l}</td>
                      <td>{r.gf}</td>
                      <td>{r.ga}</td>
                      <td className={Number(r.gd) > 0 ? 'gs-gd-pos' : Number(r.gd) < 0 ? 'gs-gd-neg' : ''}>{r.gd}</td>
                      <td className="gs-pts">{r.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
