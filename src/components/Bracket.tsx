import { useMemo } from 'react';
import { usePrediction } from '../lib/usePrediction';
import { resolveBracket } from '../lib/resolveBracket';
import { KNOCKOUT_MATCHES } from '../data/matches';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import './Bracket.css';

interface Props {
  player: string;
}

const ROUND_ORDER: Array<{ round: string; label: string; ids: number[] }> = [
  { round: 'R32', label: 'Round of 32', ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { round: 'R16', label: 'Round of 16', ids: [89,90,91,92,93,94,95,96] },
  { round: 'QF',  label: 'Quarter-finals', ids: [97,98,99,100] },
  { round: 'SF',  label: 'Semi-finals', ids: [101,102] },
  { round: 'F',   label: 'Final', ids: [104] },
];

export function Bracket({ player }: Props) {
  const { prediction, loading, locked, setWinner } = usePrediction(player);

  const bracketReady = useMemo(() => {
    const groups = Object.values(prediction.groups ?? {});
    const allGroupsDone = groups.length === 12 && groups.every(g => g.first && g.second && g.third);
    return allGroupsDone && prediction.bestThirds?.length === 8;
  }, [prediction]);

  const resolved = useMemo(() => {
    if (!bracketReady) return {};
    return resolveBracket(prediction);
  }, [prediction, bracketReady]);

  if (loading) return <div className="br-loading">Loading bracket…</div>;

  if (!bracketReady) {
    return (
      <div className="br-incomplete">
        <p>Complete your group picks and best 8 thirds first.</p>
      </div>
    );
  }

  function pickWinner(matchId: number, team: string) {
    if (locked || !team) return;
    setWinner(matchId, team);
    // Prune downstream picks that depended on a different winner from this match
    pruneDownstream(matchId, team);
  }

  function pruneDownstream(matchId: number, winner: string) {
    const downstream = getDownstream(matchId);
    for (const mid of downstream) {
      const pick = prediction.winners[mid];
      if (pick && !canReach(pick, mid)) {
        setWinner(mid, '');
      }
    }
    void winner;
  }

  function getDownstream(matchId: number): number[] {
    const result: number[] = [];
    const queue = [matchId];
    while (queue.length) {
      const cur = queue.shift()!;
      const next = KNOCKOUT_MATCHES.filter(
        (m) => m.home === `W${cur}` || m.away === `W${cur}`
      );
      for (const m of next) {
        result.push(m.id);
        queue.push(m.id);
      }
    }
    return result;
  }

  function canReach(team: string, matchId: number): boolean {
    const { home, away } = resolved[matchId] ?? {};
    return team === home || team === away;
  }

  return (
    <div className="bracket-wrap">
      {locked && <div className="br-locked">🔒 Bracket is locked.</div>}
      <div className="bracket-scroll">
        {ROUND_ORDER.map(({ round, label, ids }) => (
          <div key={round} className="br-round">
            <div className="br-round-label">{label}</div>
            <div className="br-matches">
              {ids.map((id) => {
                const teams = resolved[id] ?? { home: '', away: '' };
                const picked = prediction.winners[id] ?? '';
                return (
                  <MatchCard
                    key={id}
                    matchId={id}
                    home={teams.home}
                    away={teams.away}
                    picked={picked}
                    locked={locked}
                    onPick={(team) => pickWinner(id, team)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Champion display */}
      {prediction.winners[104] && (
        <div className="br-champion">
          🏆 Your champion: <strong>{prediction.winners[104]}</strong>
        </div>
      )}
    </div>
  );
}

// ── MatchCard ────────────────────────────────────────────────────────────────

interface MatchCardProps {
  matchId: number;
  home: string;
  away: string;
  picked: string;
  locked: boolean;
  onPick: (team: string) => void;
}

function MatchCard({ matchId, home, away, picked, locked, onPick }: MatchCardProps) {
  const unknown = !home && !away;

  return (
    <div className={`match-card ${unknown ? 'unknown' : ''}`}>
      <div className="mc-id">M{matchId}</div>
      {unknown ? (
        <div className="mc-placeholder">TBD</div>
      ) : (
        <>
          <TeamBtn team={home} picked={picked} locked={locked} onPick={onPick} />
          <div className="mc-vs">vs</div>
          <TeamBtn team={away} picked={picked} locked={locked} onPick={onPick} />
        </>
      )}
    </div>
  );
}

interface TeamBtnProps {
  team: string;
  picked: string;
  locked: boolean;
  onPick: (team: string) => void;
}

function TeamBtn({ team, picked, locked, onPick }: TeamBtnProps) {
  if (!team) return <div className="team-btn empty">—</div>;
  const isWinner = picked === team;
  return (
    <button
      className={`team-btn ${isWinner ? 'winner' : ''}`}
      onClick={() => !locked && onPick(team)}
      disabled={locked}
      title={locked ? 'Picks are locked' : `Pick ${team}`}
    >
      {team}
      {isWinner && <span className="team-check">✓</span>}
    </button>
  );
}
