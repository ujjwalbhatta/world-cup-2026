import { useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { Prediction, GroupId } from '../types';

const LOCK_TIME = new Date('2026-06-11T18:00:00Z');

function localKey(player: string) {
  return `wc2026_draft_${player}`;
}

function emptyPrediction(player: string): Prediction {
  return {
    player,
    groups: {} as Prediction['groups'],
    bestThirds: [],
    winners: {},
  };
}

export function usePrediction(player: string) {
  const [prediction, setPrediction] = useState<Prediction>(() => {
    const raw = localStorage.getItem(localKey(player));
    return raw ? JSON.parse(raw) : emptyPrediction(player);
  });
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase on mount — source of truth
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('predictions')
      .select('data, locked_at')
      .eq('player', player)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          // Merge with empty so fields always exist (PIN setup only stores {pin:…})
          const remote = data.data as Partial<Prediction> & { pin?: string };
          const pred: Prediction = {
            ...emptyPrediction(player),
            ...remote,
            groups:     remote.groups     ?? ({} as Prediction['groups']),
            bestThirds: remote.bestThirds ?? [],
            winners:    remote.winners    ?? {},
          };
          setPrediction(pred);
          localStorage.setItem(localKey(player), JSON.stringify(pred));
          setLocked(!!data.locked_at || Date.now() >= LOCK_TIME.getTime());
        } else {
          setLocked(Date.now() >= LOCK_TIME.getTime());
        }
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [player]);

  // Debounced save: localStorage immediately, Supabase after 800ms idle
  function update(next: Prediction) {
    if (locked || Date.now() >= LOCK_TIME.getTime()) return;
    setPrediction(next);
    localStorage.setItem(localKey(player), JSON.stringify(next));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // Fetch current pin so we don't overwrite it on save
      const { data: existing } = await supabase
        .from('predictions').select('data').eq('player', player).maybeSingle();
      const pin = (existing?.data as Record<string, unknown> | null)?.pin;
      await supabase.from('predictions').upsert({
        player,
        data: pin ? { ...next, pin } : next,
        updated_at: new Date().toISOString(),
      });
    }, 800);
  }

  function setGroupPick(
    group: GroupId,
    field: 'first' | 'second' | 'third',
    team: string,
  ) {
    const prev = prediction.groups[group] ?? { first: '', second: '', third: '' };
    // If team is already picked elsewhere in this group, clear that slot
    const cleared = { ...prev };
    (Object.keys(cleared) as Array<'first' | 'second' | 'third'>).forEach((k) => {
      if (k !== field && cleared[k] === team) cleared[k] = '';
    });
    const next: Prediction = {
      ...prediction,
      groups: { ...prediction.groups, [group]: { ...cleared, [field]: team } },
      // Reset bestThirds if group thirds change (thirds pool changed)
      bestThirds: field === 'third' ? [] : prediction.bestThirds,
    };
    update(next);
  }

  function setBestThirds(teams: string[]) {
    update({ ...prediction, bestThirds: teams });
  }

  function setWinner(matchId: number, team: string) {
    update({ ...prediction, winners: { ...prediction.winners, [matchId]: team } });
  }

  return { prediction, loading, locked, setGroupPick, setBestThirds, setWinner };
}
