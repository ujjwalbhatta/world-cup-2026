import { useMemo } from 'react';
import { usePrediction } from '../lib/usePrediction';
import { resolveBracket } from '../lib/resolveBracket';
import { KNOCKOUT_MATCHES } from '../data/matches';
import './Bracket.css';

interface Props {
  player: string;
}


const ROUND_SECTIONS = [
  { key: 'R32', label: 'Round of 32',    ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { key: 'R16', label: 'Round of 16',    ids: [89,90,91,92,93,94,95,96] },
  { key: 'QF',  label: 'Quarter-finals', ids: [97,98,99,100] },
  { key: 'SF',  label: 'Semi-finals',    ids: [101,102] },
  { key: 'F',   label: 'Final',          ids: [104] },
];

export function Bracket({ player }: Props) {
  const { prediction, loading, locked, setWinner } = usePrediction(player);

  const bracketReady = useMemo(() => {
    const groups = Object.values(prediction.groups ?? {});
    return groups.length === 12
      && groups.every(g => g.first && g.second && g.third)
      && prediction.bestThirds?.length === 8;
  }, [prediction]);

  const resolved = useMemo(
    () => (bracketReady ? resolveBracket(prediction) : {}),
    [prediction, bracketReady],
  );

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
    pruneDownstream(matchId);
  }

  function pruneDownstream(matchId: number) {
    const queue = [matchId];
    while (queue.length) {
      const cur = queue.shift()!;
      const next = KNOCKOUT_MATCHES.filter(
        m => m.home === `W${cur}` || m.away === `W${cur}`,
      );
      for (const m of next) {
        const pick = prediction.winners[m.id];
        const { home, away } = resolved[m.id] ?? {};
        if (pick && pick !== home && pick !== away) {
          setWinner(m.id, '');
        }
        queue.push(m.id);
      }
    }
  }

  function card(id: number) {
    const { home = '', away = '' } = resolved[id] ?? {};
    const picked = prediction.winners[id] ?? '';
    return (
      <MatchCard
        key={id}
        matchId={id}
        home={home}
        away={away}
        picked={picked}
        locked={locked}
        onPick={team => pickWinner(id, team)}
      />
    );
  }

  return (
    <div className="bracket-wrap">
      {locked && <div className="br-locked">🔒 Bracket is locked.</div>}

      {ROUND_SECTIONS.map(({ key, label, ids }) => (
        <section key={key} className="br-section">
          <h3 className="br-section-title">{label}</h3>
          <div className={`br-grid br-grid-${key}`}>
            {ids.map(id => card(id))}
          </div>
        </section>
      ))}

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
  const bothKnown = home && away;

  return (
    <div className={`match-card ${!bothKnown ? 'unknown' : ''} ${picked ? 'has-pick' : ''}`}>
      <div className="mc-header">
        <span className="mc-id">Match {matchId}</span>
        {picked && <span className="mc-picked-label">→ {picked}</span>}
      </div>
      {bothKnown ? (
        <div className="mc-teams">
          <TeamBtn team={home} picked={picked} locked={locked} onPick={onPick} />
          <span className="mc-vs">vs</span>
          <TeamBtn team={away} picked={picked} locked={locked} onPick={onPick} />
        </div>
      ) : (
        <div className="mc-tbd">
          Waiting on earlier picks
        </div>
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
  const isWinner = picked === team;
  return (
    <button
      className={`team-btn ${isWinner ? 'winner' : ''}`}
      onClick={() => !locked && onPick(team)}
      disabled={locked}
    >
      {isWinner && <span className="team-check">✓</span>}
      {team}
    </button>
  );
}
