import { useState } from 'react';
import { GROUPS } from '../data/teams';
import { usePrediction } from '../lib/usePrediction';
import type { GroupId } from '../types';
import './GroupPicker.css';

interface Props {
  player: string;
  onComplete: () => void;
}

const GROUP_IDS = Object.keys(GROUPS) as GroupId[];

type Step = 'groups' | 'thirds';

export function GroupPicker({ player, onComplete }: Props) {
  const { prediction, loading, locked, setGroupPick, setBestThirds } = usePrediction(player);
  const [step, setStep] = useState<Step>('groups');

  if (loading) return <div className="gp-loading">Loading your picks…</div>;

  const groupsDone = GROUP_IDS.filter((g) => {
    const p = prediction.groups[g];
    return p?.first && p?.second && p?.third;
  });
  const allGroupsDone = groupsDone.length === 12;

  // Collect the 12 third-place picks (one per group)
  const thirdCandidates = GROUP_IDS.map((g) => ({
    group: g,
    team: prediction.groups[g]?.third ?? '',
  })).filter((x) => x.team);

  const selectedThirds = prediction.bestThirds;
  const thirdsCount = selectedThirds.length;

  function toggleThird(team: string) {
    if (locked) return;
    if (selectedThirds.includes(team)) {
      setBestThirds(selectedThirds.filter((t) => t !== team));
    } else if (thirdsCount < 8) {
      setBestThirds([...selectedThirds, team]);
    }
  }

  if (step === 'thirds') {
    return (
      <div className="gp-wrap">
        <div className="gp-header">
          <button className="gp-back" onClick={() => setStep('groups')}>← Groups</button>
          <h2>Best 8 Third-Place Teams</h2>
          <span className={`gp-count ${thirdsCount === 8 ? 'done' : ''}`}>
            {thirdsCount} / 8 advancing
          </span>
        </div>
        <p className="gp-hint">
          Click a team to add them to the standings. Click a ranked team to remove them.
          {thirdsCount < 8 && <> <strong>{8 - thirdsCount} spot{8 - thirdsCount !== 1 ? 's' : ''} left.</strong></>}
        </p>

        <div className="thirds-panels">
          {/* Left — pool of all 12 thirds */}
          <div className="thirds-pool">
            <div className="thirds-panel-title">12 Third-Place Finishers</div>
            {thirdCandidates.map(({ group, team }) => {
              const ranked = selectedThirds.includes(team);
              const full = !ranked && thirdsCount >= 8;
              return (
                <button
                  key={group}
                  className={`pool-team ${ranked ? 'ranked' : ''} ${full ? 'full' : ''}`}
                  onClick={() => toggleThird(team)}
                  disabled={locked}
                >
                  <span className="pool-group">Group {group}</span>
                  <span className="pool-name">{team}</span>
                  {ranked && <span className="pool-badge">#{selectedThirds.indexOf(team) + 1}</span>}
                  {!ranked && !full && <span className="pool-add">+</span>}
                </button>
              );
            })}
          </div>

          {/* Right — numbered standings slots */}
          <div className="thirds-standings">
            <div className="thirds-panel-title">Advancing to Round of 32</div>
            {Array.from({ length: 8 }, (_, i) => {
              const team = selectedThirds[i];
              const group = team
                ? thirdCandidates.find((c) => c.team === team)?.group
                : null;
              return (
                <div
                  key={i}
                  className={`standing-slot ${team ? 'filled' : 'empty'}`}
                  onClick={() => team && toggleThird(team)}
                  title={team ? `Remove ${team}` : ''}
                >
                  <span className="slot-rank">{i + 1}</span>
                  {team ? (
                    <>
                      <span className="slot-group">Group {group}</span>
                      <span className="slot-team">{team}</span>
                      {!locked && <span className="slot-remove">✕</span>}
                    </>
                  ) : (
                    <span className="slot-empty">— pick a team</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {thirdsCount === 8 && (
          <button className="gp-next" onClick={onComplete}>
            Next: Fill the Bracket →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="gp-wrap">
      <div className="gp-header">
        <h2>Group Stage Picks</h2>
        <span className={`gp-count ${allGroupsDone ? 'done' : ''}`}>
          {groupsDone.length} / 12 groups done
        </span>
      </div>
      {locked && <div className="gp-locked">🔒 Picks are locked.</div>}

      <div className="groups-grid">
        {GROUP_IDS.map((group) => (
          <GroupCard
            key={group}
            group={group}
            teams={GROUPS[group]}
            pick={prediction.groups[group]}
            locked={locked}
            onChange={(field, team) => setGroupPick(group, field, team)}
          />
        ))}
      </div>

      {allGroupsDone && (
        <button className="gp-next" onClick={() => setStep('thirds')}>
          Next: Pick Best 8 Thirds →
        </button>
      )}
    </div>
  );
}

// ── GroupCard ────────────────────────────────────────────────────────────────

interface CardProps {
  group: GroupId;
  teams: string[];
  pick: { first: string; second: string; third: string } | undefined;
  locked: boolean;
  onChange: (field: 'first' | 'second' | 'third', team: string) => void;
}

const SLOTS = [
  { field: 'first'  as const, label: '🥇 1st' },
  { field: 'second' as const, label: '🥈 2nd' },
  { field: 'third'  as const, label: '🥉 3rd' },
];

function GroupCard({ group, teams, pick, locked, onChange }: CardProps) {
  const first  = pick?.first  ?? '';
  const second = pick?.second ?? '';
  const third  = pick?.third  ?? '';
  const picked = [first, second, third].filter(Boolean);
  const complete = picked.length === 3;

  return (
    <div className={`group-card ${complete ? 'complete' : ''}`}>
      <div className="gc-title">
        Group {group}
        {complete && <span className="gc-check">✓</span>}
      </div>
      {SLOTS.map(({ field, label }) => {
        const current = pick?.[field] ?? '';
        // Available = all teams minus those picked in OTHER slots
        const available = teams.filter(
          (t) => t === current || !picked.includes(t) || !current
        );
        return (
          <div key={field} className="gc-row">
            <span className="gc-label">{label}</span>
            <select
              value={current}
              disabled={locked}
              onChange={(e) => onChange(field, e.target.value)}
              className={current ? 'filled' : ''}
            >
              <option value="">— pick —</option>
              {available.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
