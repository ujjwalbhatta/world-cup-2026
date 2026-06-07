import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calcBracketScore } from '../lib/bracketScore';
import { calcMatchScore } from '../lib/matchScore';
import type { Prediction, Results } from '../types';
import type { PickMap, ResultMap } from '../lib/useMatchPicks';
import './Leaderboard.css';

const PLAYERS = ['Ujjwal', 'Sumaly', 'Utsabi', 'Sabun', 'Riti', 'Avash'];
const MEDALS  = ['🥇', '🥈', '🥉'];

interface PlayerRow {
  player:        string;
  bracketScore:  number;
  matchScore:    number;
  bracketDone:   boolean;
  matchPicksDone: number;
}

export function Leaderboard() {
  const [rows, setRows]             = useState<PlayerRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    const [
      { data: predictions },
      { data: bracketResults },
      { data: allPicks },
      { data: matchResults },
    ] = await Promise.all([
      supabase.from('predictions').select('player, data'),
      supabase.from('results').select('data').eq('id', 1).single(),
      supabase.from('match_picks').select('player, match_id, pick'),
      supabase.from('match_results').select('*'),
    ]);

    const actual: Results       = (bracketResults?.data as Results) ?? {};
    const matchResultMap: ResultMap = {};
    for (const r of matchResults ?? []) matchResultMap[r.match_id] = r;

    const predMap: Record<string, Prediction> = {};
    for (const p of predictions ?? []) predMap[p.player] = p.data as Prediction;

    const picksByPlayer: Record<string, PickMap> = {};
    for (const r of allPicks ?? []) {
      if (!picksByPlayer[r.player]) picksByPlayer[r.player] = {};
      picksByPlayer[r.player][r.match_id] = r.pick;
    }

    const computed: PlayerRow[] = PLAYERS.map(player => ({
      player,
      bracketScore:   predMap[player] ? calcBracketScore(predMap[player], actual) : 0,
      matchScore:     calcMatchScore(picksByPlayer[player] ?? {}, matchResultMap),
      bracketDone:    !!predMap[player],
      matchPicksDone: Object.keys(picksByPlayer[player] ?? {}).length,
    }));

    setRows(computed);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' },   load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' },        load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_picks' },    load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' },  load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  if (loading) return <div className="lb-loading">Loading standings…</div>;

  const bracketRanked = [...rows].sort((a, b) => b.bracketScore - a.bracketScore);
  const matchRanked   = [...rows].sort((a, b) => b.matchScore   - a.matchScore);

  return (
    <div className="lb-wrap">
      {lastUpdated && (
        <p className="lb-updated">Live · updated {lastUpdated.toLocaleTimeString()}</p>
      )}

      {/* ── Bracket Leaderboard ── */}
      <div className="lb-contest">
        <div className="lb-contest-header">
          <div>
            <h3 className="lb-contest-title">🏆 Bracket Predictor</h3>
            <p className="lb-contest-sub">Pick the full knockout bracket before kickoff</p>
          </div>
          <div className="lb-pot">💰 $60 pot</div>
        </div>

        <div className="lb-table">
          <div className="lb-thead">
            <span className="lb-col-rank">#</span>
            <span className="lb-col-player">Player</span>
            <span className="lb-col-total">Points</span>
          </div>
          {bracketRanked.map((row, i) => (
            <div key={row.player} className={`lb-row ${i === 0 && row.bracketScore > 0 ? 'leader' : ''}`}>
              <span className="lb-col-rank">{MEDALS[i] ?? i + 1}</span>
              <span className="lb-col-player">
                {row.player}
                {!row.bracketDone && <span className="lb-pending"> — no bracket yet</span>}
              </span>
              <span className="lb-col-total">{row.bracketScore}</span>
            </div>
          ))}
        </div>

        <details className="lb-scoring">
          <summary>Scoring guide</summary>
          <ul>
            <li>Group 1st / 2nd correct — <strong>1pt</strong> each (max 24)</li>
            <li>Correct best-8 third — <strong>1pt</strong> (max 8)</li>
            <li>Correct R32 winner — <strong>2pts</strong></li>
            <li>Correct R16 winner — <strong>3pts</strong></li>
            <li>Correct QF winner — <strong>5pts</strong></li>
            <li>Correct SF winner — <strong>8pts</strong></li>
            <li>Correct champion — <strong>15pts</strong></li>
            <li style={{marginTop:'6px', color:'#e8c900'}}>Max possible: 139 pts</li>
          </ul>
        </details>
      </div>

      {/* ── Match Leaderboard ── */}
      <div className="lb-contest">
        <div className="lb-contest-header">
          <div>
            <h3 className="lb-contest-title">🎯 Match Predictor</h3>
            <p className="lb-contest-sub">H/D/A for every match, locks at each kickoff</p>
          </div>
          <div className="lb-pot">💰 $60 pot</div>
        </div>

        <div className="lb-table">
          <div className="lb-thead">
            <span className="lb-col-rank">#</span>
            <span className="lb-col-player">Player</span>
            <span className="lb-col-sub">Picks made</span>
            <span className="lb-col-total">Points</span>
          </div>
          {matchRanked.map((row, i) => (
            <div key={row.player} className={`lb-row ${i === 0 && row.matchScore > 0 ? 'leader' : ''}`}>
              <span className="lb-col-rank">{MEDALS[i] ?? i + 1}</span>
              <span className="lb-col-player">{row.player}</span>
              <span className="lb-col-sub">{row.matchPicksDone} / 104</span>
              <span className="lb-col-total">{row.matchScore}</span>
            </div>
          ))}
        </div>

        <details className="lb-scoring">
          <summary>Scoring guide</summary>
          <ul>
            <li>Group game (H/D/A correct) — <strong>1pt</strong></li>
            <li>R32 winner correct — <strong>2pts</strong></li>
            <li>R16 winner correct — <strong>3pts</strong></li>
            <li>QF winner correct — <strong>4pts</strong></li>
            <li>SF / 3rd place correct — <strong>5pts</strong></li>
            <li>Final winner correct — <strong>6pts</strong></li>
          </ul>
        </details>
      </div>
    </div>
  );
}
