import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calcBracketScore } from '../lib/bracketScore';
import { calcMatchScore } from '../lib/matchScore';
import type { Prediction, Results } from '../types';
import type { PickMap, ResultMap } from '../lib/useMatchPicks';
import './Leaderboard.css';

const PLAYERS = ['Ujjwal', 'Sumaly', 'Utsabi', 'Sabun', 'Riti', 'Avash'];

interface PlayerRow {
  player: string;
  bracketScore: number;
  matchScore: number;
  total: number;
  bracketDone: boolean;
}

export function Leaderboard() {
  const [rows, setRows]       = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
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

    const actual: Results = (bracketResults?.data as Results) ?? {};

    const matchResultMap: ResultMap = {};
    for (const r of matchResults ?? []) matchResultMap[r.match_id] = r;

    const predMap: Record<string, Prediction> = {};
    for (const p of predictions ?? []) predMap[p.player] = p.data as Prediction;

    const picksByPlayer: Record<string, PickMap> = {};
    for (const r of allPicks ?? []) {
      if (!picksByPlayer[r.player]) picksByPlayer[r.player] = {};
      picksByPlayer[r.player][r.match_id] = r.pick;
    }

    const computed: PlayerRow[] = PLAYERS.map((player) => {
      const pred   = predMap[player];
      const picks  = picksByPlayer[player] ?? {};
      const bracketScore = pred ? calcBracketScore(pred, actual) : 0;
      const matchScore   = calcMatchScore(picks, matchResultMap);
      return {
        player,
        bracketScore,
        matchScore,
        total: bracketScore + matchScore,
        bracketDone: !!pred,
      };
    });

    computed.sort((a, b) => b.total - a.total);
    setRows(computed);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel('leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' },   load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' },        load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_picks' },    load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' },  load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="lb-loading">Loading leaderboard…</div>;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="lb-wrap">
      <div className="lb-header">
        <h2 className="lb-title">Leaderboard</h2>
        <div className="lb-pot">💰 $60 pot</div>
      </div>
      {lastUpdated && (
        <p className="lb-updated">
          Live · last updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      <div className="lb-table">
        <div className="lb-thead">
          <span className="lb-col-rank">#</span>
          <span className="lb-col-player">Player</span>
          <span className="lb-col-score" title="Bracket Predictor">Bracket</span>
          <span className="lb-col-score" title="Match Predictor">Matches</span>
          <span className="lb-col-total">Total</span>
        </div>

        {rows.map((row, i) => (
          <div key={row.player} className={`lb-row ${i === 0 ? 'leader' : ''}`}>
            <span className="lb-col-rank">{medals[i] ?? i + 1}</span>
            <span className="lb-col-player">
              {row.player}
              {!row.bracketDone && <span className="lb-pending"> (no bracket)</span>}
            </span>
            <span className="lb-col-score">{row.bracketScore}</span>
            <span className="lb-col-score">{row.matchScore}</span>
            <span className="lb-col-total">{row.total}</span>
          </div>
        ))}
      </div>

      <div className="lb-scoring">
        <div className="lb-scoring-title">Scoring guide</div>
        <div className="lb-scoring-cols">
          <div>
            <strong>Bracket</strong>
            <ul>
              <li>Group 1st/2nd correct — 1pt each</li>
              <li>Best-8 third correct — 1pt each</li>
              <li>Correct R32 winner — 2pts</li>
              <li>Correct R16 winner — 3pts</li>
              <li>Correct QF winner — 5pts</li>
              <li>Correct SF winner — 8pts</li>
              <li>Correct champion — 15pts</li>
            </ul>
          </div>
          <div>
            <strong>Match Picks</strong>
            <ul>
              <li>Group game (H/D/A) — 1pt</li>
              <li>R32 winner — 2pts</li>
              <li>R16 winner — 3pts</li>
              <li>QF winner — 4pts</li>
              <li>SF / 3rd place — 5pts</li>
              <li>Final winner — 6pts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
