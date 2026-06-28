import { useEffect, useMemo, useRef, useState } from 'react';
import { GROUP_FIXTURES } from '../data/groupFixtures';
import { KNOCKOUT_MATCHES } from '../data/matches';
import { useMatchPicks } from '../lib/useMatchPicks';
import { supabase } from '../lib/supabase';
import { resolveActualBracket } from '../lib/resolveActual';
import type { Outcome, Results } from '../types';
import './MatchList.css';

const LOCK_BEFORE_MS = 60 * 60 * 1000; // picks lock 1 hour before kickoff

interface Props {
  player: string;
}


export function MatchList({ player }: Props) {
  const { picks, results, loading, setPick } = useMatchPicks(player);
  const [now, setNow] = useState(Date.now());
  const [actual, setActual] = useState<Results>({});

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch group standings + knockout winners so we can resolve bracket teams for users
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('results').select('data').eq('id', 1).single();
      if (data) setActual(data.data as Results);
    }
    load();
    const ch = supabase
      .channel('ml_actual')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Resolve bracket: extract winners from match_results then run resolveActualBracket
  const resolvedKO = useMemo(() => {
    const winners: Record<number, string> = {};
    for (const [idStr, r] of Object.entries(results)) {
      if (r.result && r.home && r.away) {
        winners[Number(idStr)] = r.result === 'home' ? r.home : r.away;
      }
    }
    return resolveActualBracket(actual, winners);
  }, [actual, results]);

  // Group fixtures by local calendar date (browser timezone)
  const groupedByDate = useMemo(() => {
    const map: Record<string, typeof GROUP_FIXTURES> = {};
    for (const f of GROUP_FIXTURES) {
      const d = new Date(f.kickoff);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const date = `${y}-${mo}-${day}`;
      if (!map[date]) map[date] = [];
      map[date].push(f);
    }
    for (const fixtures of Object.values(map)) {
      fixtures.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
    }
    return Object.entries(map)
      .filter(([date]) => date !== '2026-06-27')
      .sort(([a], [b]) => a.localeCompare(b));
  }, []);

  // Knockout matches whose teams are resolved from the actual bracket
  const knockoutReady = useMemo(() => {
    return KNOCKOUT_MATCHES.filter(m => {
      const r = resolvedKO[m.id];
      return r?.home && r?.away;
    });
  }, [resolvedKO]);

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function scrollToDay(date: string) {
    dayRefs.current[date]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Find the current or next upcoming match day
  const activeDay = useMemo(() => {
    for (const [date] of groupedByDate) {
      const d = new Date(date + 'T23:59:59');
      if (d.getTime() >= now) return date;
    }
    return groupedByDate[groupedByDate.length - 1]?.[0] ?? '';
  }, [groupedByDate, now]);

  if (loading) return <div className="ml-loading">Loading matches…</div>;

  function isOpen(kickoff: string, home?: string, away?: string): boolean {
    if (!home || !away) return false;
    return now < new Date(kickoff).getTime() - LOCK_BEFORE_MS;
  }

  function resultIcon(matchId: number): React.ReactNode {
    const r = results[matchId];
    const p = picks[matchId];
    if (!r?.result || !p) return null;
    return p === r.result
      ? <span className="res-correct">✓</span>
      : <span className="res-wrong">✗</span>;
  }

  return (
    <div className="ml-wrap">
      {/* ── Day strip ── */}
      <div className="ml-day-strip">
        {groupedByDate.map(([date]) => {
          const label = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
          return (
            <button
              key={date}
              className={`ml-day-tab ${date === activeDay ? 'active' : ''}`}
              onClick={() => scrollToDay(date)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Group Stage ── */}
      <section className="ml-section">
        <h3 className="ml-section-title">Group Stage — Jun 11–29</h3>

        {groupedByDate.map(([date, fixtures]) => (
          <div key={date} className="ml-day" ref={el => { dayRefs.current[date] = el; }}>
            <div className="ml-day-label">
              {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div className="ml-matches">
              {fixtures.map(f => {
                const open   = isOpen(f.kickoff, f.home, f.away);
                const kicked = now >= new Date(f.kickoff).getTime();
                const result = results[f.id];
                const pick   = picks[f.id];
                return (
                  <MatchRow
                    key={f.id}
                    matchId={f.id}
                    home={f.home}
                    away={f.away}
                    kickoff={f.kickoff}
                    pick={pick}
                    result={result?.result}
                    open={open}
                    kicked={kicked}
                    isKnockout={false}
                    onPick={o => setPick(f.id, o)}
                    icon={resultIcon(f.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* ── Knockout Stage ── */}
      <section className="ml-section">
        <h3 className="ml-section-title">Knockout Stage — Jun 28 onwards</h3>
        {knockoutReady.length === 0 ? (
          <p className="ml-hint">
            Knockout matches will appear here once the host sets the teams after each round.
          </p>
        ) : (
          (() => {
            const byDate: Record<string, typeof knockoutReady> = {};
            for (const m of knockoutReady) {
              const d = new Date(m.kickoff);
              const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              if (!byDate[key]) byDate[key] = [];
              byDate[key].push(m);
            }
            return Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b)).map(([date, matches]) => (
              <div key={date} className="ml-day">
                <div className="ml-day-label">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div className="ml-matches">
                  {matches.map(m => {
                    const { home, away } = resolvedKO[m.id]!;
                    const open   = isOpen(m.kickoff, home, away);
                    const kicked = now >= new Date(m.kickoff).getTime();
                    const pick   = picks[m.id];
                    return (
                      <MatchRow
                        key={m.id}
                        matchId={m.id}
                        home={home}
                        away={away}
                        kickoff={m.kickoff}
                        pick={pick}
                        result={results[m.id]?.result}
                        open={open}
                        kicked={kicked}
                        isKnockout={true}
                        onPick={o => setPick(m.id, o)}
                        icon={resultIcon(m.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ));
          })()
        )}
      </section>
    </div>
  );
}

// ── MatchRow ─────────────────────────────────────────────────────────────────

interface MatchRowProps {
  matchId: number;
  home: string;
  away: string;
  kickoff: string;
  pick: Outcome | undefined;
  result: Outcome | undefined;
  open: boolean;
  kicked: boolean;
  isKnockout: boolean;
  onPick: (o: Outcome) => void;
  icon: React.ReactNode;
}

const GROUP_OUTCOMES: Outcome[] = ['home', 'draw', 'away'];
const KNOCKOUT_OUTCOMES: Outcome[] = ['home', 'away'];

function MatchRow({ home, away, kickoff, pick, result, open, kicked, isKnockout, onPick, icon }: MatchRowProps) {
  const outcomes = isKnockout ? KNOCKOUT_OUTCOMES : GROUP_OUTCOMES;
  const kickoffDate = new Date(kickoff);

  return (
    <div className={`match-row ${kicked ? 'kicked' : ''} ${pick ? 'picked' : ''}`}>
      <div className="mr-teams">
        <span className={`mr-team ${result === 'home' ? 'winner' : ''}`}>{home}</span>
        <span className="mr-sep">vs</span>
        <span className={`mr-team ${result === 'away' ? 'winner' : ''}`}>{away}</span>
        {result === 'draw' && <span className="mr-draw-badge">Draw</span>}
      </div>

      <div className="mr-meta">
        <span className="mr-kickoff">
          {kickoffDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
          {' · '}
          {kickoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} local
        </span>
        {icon}
      </div>

      <div className="mr-picks">
        {outcomes.map(o => {
          const label = o === 'home' ? home : o === 'away' ? away : 'Draw';
          const isPicked = pick === o;
          const isCorrect = result && result === o;
          const isWrong   = result && pick === o && result !== o;
          return (
            <button
              key={o}
              className={`pick-btn
                ${isPicked ? 'picked' : ''}
                ${isCorrect ? 'correct' : ''}
                ${isWrong   ? 'wrong'   : ''}
              `.trim()}
              onClick={() => open && onPick(o)}
              disabled={!open}
              title={!open ? (kicked ? 'Picks closed (match started)' : 'Picks locked (< 1 hr to kickoff)') : `Pick ${label}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
