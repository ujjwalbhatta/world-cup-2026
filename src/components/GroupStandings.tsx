import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { GROUP_FIXTURES } from '../data/groupFixtures';
import { GROUPS } from '../data/teams';
import type { GroupId, Outcome, Results } from '../types';
import './GroupStandings.css';

interface TeamStats {
  team: string;
  p: number;
  w: number;
  d: number;
  l: number;
  pts: number;
}

function computeGroupStats(
  group: GroupId,
  results: Record<number, Outcome | null>,
): TeamStats[] {
  const statsMap: Record<string, TeamStats> = {};
  for (const t of GROUPS[group]) {
    statsMap[t] = { team: t, p: 0, w: 0, d: 0, l: 0, pts: 0 };
  }

  for (const f of GROUP_FIXTURES.filter(fx => fx.group === group)) {
    const result = results[f.id];
    if (!result) continue;
    const home = statsMap[f.home];
    const away = statsMap[f.away];
    if (!home || !away) continue;
    home.p++; away.p++;
    if (result === 'home') {
      home.w++; home.pts += 3; away.l++;
    } else if (result === 'away') {
      away.w++; away.pts += 3; home.l++;
    } else {
      home.d++; home.pts++;
      away.d++; away.pts++;
    }
  }

  return Object.values(statsMap).sort(
    (a, b) => b.pts - a.pts || b.w - a.w || a.team.localeCompare(b.team),
  );
}

export function GroupStandings() {
  const [results, setResults] = useState<Record<number, Outcome | null>>({});
  const [bestThirds, setBestThirds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: matchData }, { data: actualData }] = await Promise.all([
        supabase.from('match_results').select('match_id, result'),
        supabase.from('results').select('data').eq('id', 1).single(),
      ]);
      if (matchData) {
        const map: Record<number, Outcome | null> = {};
        for (const r of matchData) map[r.match_id] = r.result as Outcome | null;
        setResults(map);
      }
      setBestThirds((actualData?.data as Results)?.bestThirds ?? []);
      setLoading(false);
    }

    load();

    const ch1 = supabase
      .channel('group_standings_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' }, () => load())
      .subscribe();
    const ch2 = supabase
      .channel('group_standings_actual')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, []);

  const groups = useMemo(
    () => (Object.keys(GROUPS) as GroupId[]).map(gid => ({
      id: gid,
      standings: computeGroupStats(gid, results),
    })),
    [results],
  );

  if (loading) return <div className="gs-loading">Loading standings…</div>;

  return (
    <div className="gs-wrap">
      <h3 className="gs-title">Group Stage Standings</h3>
      <div className="gs-grid">
        {groups.map(({ id, standings }) => (
          <div key={id} className="gs-group">
            <div className="gs-group-header">Group {id}</div>
            <table className="gs-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="gs-th-team">Team</th>
                  <th title="Played">P</th>
                  <th title="Won">W</th>
                  <th title="Drawn">D</th>
                  <th title="Lost">L</th>
                  <th title="Points" className="gs-th-pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => {
                  const isTop2 = i < 2;
                  const isQualThird = i === 2 && bestThirds.includes(s.team);
                  const cls = isTop2 ? 'gs-top2' : isQualThird ? 'gs-qual-third' : '';
                  return (
                  <tr key={s.team} className={cls}>
                    <td className="gs-pos">{i + 1}</td>
                    <td className="gs-team">{s.team}{isQualThird ? ' ✓' : ''}</td>
                    <td>{s.p}</td>
                    <td>{s.w}</td>
                    <td>{s.d}</td>
                    <td>{s.l}</td>
                    <td className="gs-pts">{s.pts}</td>
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
