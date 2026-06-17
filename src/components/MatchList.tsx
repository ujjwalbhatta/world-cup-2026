import { useEffect, useMemo, useState } from 'react';
import { GROUP_FIXTURES } from '../data/groupFixtures';
import { KNOCKOUT_MATCHES } from '../data/matches';
import { useMatchPicks } from '../lib/useMatchPicks';
import type { Outcome } from '../types';
import './MatchList.css';

const LOCK_BEFORE_MS = 60 * 60 * 1000; // picks lock 1 hour before kickoff

interface Props {
  player: string;
}


export function MatchList({ player }: Props) {
  const { picks, results, loading, setPick } = useMatchPicks(player);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Group fixtures by "sports day" — matches kicking off 00:00–05:59 UTC
  // belong to the previous calendar day (late-night North American slots)
  const groupedByDate = useMemo(() => {
    const map: Record<string, typeof GROUP_FIXTURES> = {};
    for (const f of GROUP_FIXTURES) {
      const d = new Date(f.kickoff);
      if (d.getUTCHours() < 6) d.setUTCDate(d.getUTCDate() - 1);
      const date = d.toISOString().slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push(f);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  // Knockout matches that have both teams set in results
  const knockoutReady = useMemo(() => {
    return KNOCKOUT_MATCHES.filter(m => {
      const r = results[m.id];
      return r?.home && r?.away;
    });
  }, [results]);

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
      {/* ── Group Stage ── */}
      <section className="ml-section">
        <h3 className="ml-section-title">Group Stage — Jun 11–29</h3>

        {groupedByDate.map(([date, fixtures]) => (
          <div key={date} className="ml-day">
            <div className="ml-day-label">
              {new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
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
          <div className="ml-matches">
            {knockoutReady.map(m => {
              const r      = results[m.id]!;
              const open   = isOpen(m.kickoff, r.home, r.away);
              const kicked = now >= new Date(m.kickoff).getTime();
              const pick   = picks[m.id];
              return (
                <MatchRow
                  key={m.id}
                  matchId={m.id}
                  home={r.home!}
                  away={r.away!}
                  kickoff={m.kickoff}
                  pick={pick}
                  result={r.result}
                  open={open}
                  kicked={kicked}
                  isKnockout={true}
                  onPick={o => setPick(m.id, o)}
                  icon={resultIcon(m.id)}
                />
              );
            })}
          </div>
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
