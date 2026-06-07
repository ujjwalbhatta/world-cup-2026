import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { Outcome, MatchResult } from '../types';

export interface PickMap   { [matchId: number]: Outcome }
export interface ResultMap { [matchId: number]: MatchResult }

export function useMatchPicks(player: string) {
  const [picks,   setPicks]   = useState<PickMap>({});
  const [results, setResults] = useState<ResultMap>({});
  const [loading, setLoading] = useState(true);
  const saveQueue = useRef<Record<number, Outcome>>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: pickRows }, { data: resultRows }] = await Promise.all([
        supabase.from('match_picks').select('match_id, pick').eq('player', player),
        supabase.from('match_results').select('*'),
      ]);

      if (cancelled) return;

      if (pickRows) {
        const map: PickMap = {};
        for (const r of pickRows) map[r.match_id] = r.pick as Outcome;
        setPicks(map);
      }
      if (resultRows) {
        const map: ResultMap = {};
        for (const r of resultRows) map[r.match_id] = r as MatchResult;
        setResults(map);
      }
      setLoading(false);
    }

    load();

    // Live updates for results (host entering them)
    const channel = supabase
      .channel(`match_picks_${player}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_results' }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [player]);

  function setPick(matchId: number, pick: Outcome) {
    // Optimistic update
    setPicks(prev => ({ ...prev, [matchId]: pick }));
    saveQueue.current[matchId] = pick;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const batch = Object.entries(saveQueue.current).map(([id, p]) => ({
        player,
        match_id: Number(id),
        pick: p,
      }));
      saveQueue.current = {};
      await supabase.from('match_picks').upsert(batch);
    }, 600);
  }

  return { picks, results, loading, setPick };
}
