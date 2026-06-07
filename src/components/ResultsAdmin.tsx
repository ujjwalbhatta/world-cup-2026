import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { GROUP_FIXTURES } from '../data/groupFixtures';
import { KNOCKOUT_MATCHES } from '../data/matches';
import { GROUPS } from '../data/teams';
import { resolveActualBracket } from '../lib/resolveActual';
import type { Results, GroupId, Outcome } from '../types';
import './ResultsAdmin.css';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;
const GROUP_IDS = Object.keys(GROUPS) as GroupId[];

type AdminTab = 'group-results' | 'standings' | 'thirds' | 'knockout';

// ── Shared Supabase helpers ───────────────────────────────────────────────────

async function saveActualResults(next: Results) {
  await supabase.from('results').upsert({ id: 1, data: next });
}

// ── Root component ────────────────────────────────────────────────────────────

export function ResultsAdmin() {
  const [authed, setAuthed]   = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab]         = useState<AdminTab>('group-results');
  const [actual, setActual]   = useState<Results>({});
  const [groupMatchResults, setGroupMatchResults] = useState<Record<number, Outcome | null>>({});

  useEffect(() => {
    if (!authed) return;
    async function load() {
      const [{ data: br }, { data: mr }] = await Promise.all([
        supabase.from('results').select('data').eq('id', 1).single(),
        supabase.from('match_results').select('match_id, result'),
      ]);
      setActual((br?.data as Results) ?? {});
      const map: Record<number, Outcome | null> = {};
      for (const r of mr ?? []) map[r.match_id] = r.result as Outcome | null;
      setGroupMatchResults(map);
    }
    load();
  }, [authed]);

  function checkPassword() {
    if (pwInput === ADMIN_PASSWORD) { setAuthed(true); }
    else { setPwError(true); setPwInput(''); }
  }

  if (!authed) {
    return (
      <div className="admin-gate">
        <h2>Admin Access</h2>
        <p>Enter the admin password to manage results.</p>
        <div className="admin-pw-row">
          <input
            type="password" placeholder="Password" value={pwInput} autoFocus
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === 'Enter' && checkPassword()}
          />
          <button onClick={checkPassword}>Enter</button>
        </div>
        {pwError && <p className="admin-error">Wrong password.</p>}
      </div>
    );
  }

  const tabs: [AdminTab, string][] = [
    ['group-results', '1. Group Results'],
    ['standings',     '2. Group Standings'],
    ['thirds',        '3. Best 8 Thirds'],
    ['knockout',      '4. Knockout'],
  ];

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Results Admin</h2>
        <p className="admin-sub">Work through the tabs in order as the tournament progresses.</p>
      </div>
      <div className="admin-tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'group-results' && (
        <GroupResultsTab
          groupMatchResults={groupMatchResults}
          setGroupMatchResults={setGroupMatchResults}
        />
      )}
      {tab === 'standings' && (
        <StandingsTab actual={actual} setActual={setActual} />
      )}
      {tab === 'thirds' && (
        <ThirdsTab actual={actual} setActual={setActual} />
      )}
      {tab === 'knockout' && (
        <KnockoutTab actual={actual} setActual={setActual} />
      )}
    </div>
  );
}

// ── Tab 1: Group Results (H/D/A per match) ────────────────────────────────────

function GroupResultsTab({ groupMatchResults, setGroupMatchResults }: {
  groupMatchResults: Record<number, Outcome | null>;
  setGroupMatchResults: React.Dispatch<React.SetStateAction<Record<number, Outcome | null>>>;
}) {
  async function setResult(matchId: number, outcome: Outcome | null) {
    const next = { ...groupMatchResults, [matchId]: outcome };
    setGroupMatchResults(next);
    await supabase.from('match_results').upsert({
      match_id: matchId,
      home: GROUP_FIXTURES.find(f => f.id === matchId)?.home ?? '',
      away: GROUP_FIXTURES.find(f => f.id === matchId)?.away ?? '',
      result: outcome,
    });
  }

  const done = Object.values(groupMatchResults).filter(Boolean).length;

  return (
    <div className="admin-section">
      <p className="admin-hint">
        Click the winning team (or Draw) as each match finishes. Click again to undo.
        <strong> {done}/72 entered.</strong>
      </p>
      {GROUP_FIXTURES.map(f => {
        const current = groupMatchResults[f.id] ?? null;
        return (
          <div key={f.id} className={`admin-match-row ${current ? 'settled' : ''}`}>
            <span className="amr-teams">{f.home} <span className="amr-vs">vs</span> {f.away}</span>
            <div className="amr-btns">
              {(['home', 'draw', 'away'] as Outcome[]).map(o => {
                const label = o === 'home' ? f.home : o === 'away' ? f.away : 'Draw';
                const active = current === o;
                return (
                  <button
                    key={o}
                    className={`amr-btn ${active ? 'active' : ''}`}
                    onClick={() => setResult(f.id, active ? null : o)}
                    title={active ? 'Click to undo' : `${label} won`}
                  >
                    {label}
                    {active && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 2: Group Standings (1st / 2nd / 3rd per group) ───────────────────────

function StandingsTab({ actual, setActual }: {
  actual: Results;
  setActual: React.Dispatch<React.SetStateAction<Results>>;
}) {
  async function setPos(gid: GroupId, field: 'first' | 'second' | 'third', team: string) {
    const prev = actual.groups?.[gid] ?? { first: '', second: '', third: '' };
    const next: Results = {
      ...actual,
      groups: { ...actual.groups, [gid]: { ...prev, [field]: team } } as Results['groups'],
    };
    setActual(next);
    await saveActualResults(next);
  }

  const done = GROUP_IDS.filter(g => {
    const s = actual.groups?.[g];
    return s?.first && s?.second && s?.third;
  }).length;

  return (
    <div className="admin-section">
      <p className="admin-hint">
        Set the final 1st / 2nd / 3rd for each group after all group matches finish.
        Saves instantly. <strong>{done}/12 groups complete.</strong>
      </p>
      {GROUP_IDS.map(gid => {
        const teams = GROUPS[gid];
        const s = actual.groups?.[gid];
        const picked = [s?.first, s?.second, s?.third].filter(Boolean);

        return (
          <div key={gid} className="admin-group-row">
            <span className="admin-group-label">Group {gid}</span>
            <div className="admin-group-inputs">
              {(['first', 'second', 'third'] as const).map((field, i) => {
                const labels = ['🥇 1st', '🥈 2nd', '🥉 3rd'];
                const available = teams.filter(t => t === s?.[field] || !picked.includes(t));
                return (
                  <div key={field} className="admin-pos-col">
                    <span className="admin-pos-label">{labels[i]}</span>
                    <select
                      value={s?.[field] ?? ''}
                      onChange={e => setPos(gid, field, e.target.value)}
                    >
                      <option value="">— pick —</option>
                      {available.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 3: Best 8 Thirds ──────────────────────────────────────────────────────

function ThirdsTab({ actual, setActual }: {
  actual: Results;
  setActual: React.Dispatch<React.SetStateAction<Results>>;
}) {
  const candidates = GROUP_IDS.map(g => ({
    group: g,
    team: actual.groups?.[g]?.third ?? '',
  })).filter(x => x.team);

  const selected = actual.bestThirds ?? [];
  const count = selected.length;

  async function toggle(team: string) {
    const next = selected.includes(team)
      ? selected.filter(t => t !== team)
      : count < 8 ? [...selected, team] : selected;
    const updated: Results = { ...actual, bestThirds: next };
    setActual(updated);
    await saveActualResults(updated);
  }

  if (candidates.length < 12) {
    return (
      <div className="admin-section">
        <p className="admin-hint">
          Complete all 12 group standings first — the 3rd-place teams will appear here.
          ({candidates.length}/12 groups have a 3rd set)
        </p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <p className="admin-hint">
        Select exactly 8 third-place teams that qualified. Click to add, click again to remove.
        <strong> {count}/8 selected.</strong>
      </p>
      <div className="thirds-panels">
        <div className="thirds-pool">
          <div className="thirds-panel-title">12 Third-Place Finishers</div>
          {candidates.map(({ group, team }) => {
            const ranked = selected.includes(team);
            const full   = !ranked && count >= 8;
            return (
              <button
                key={group}
                className={`pool-team ${ranked ? 'ranked' : ''} ${full ? 'full' : ''}`}
                onClick={() => toggle(team)}
              >
                <span className="pool-group">Group {group}</span>
                <span className="pool-name">{team}</span>
                {ranked && <span className="pool-badge">#{selected.indexOf(team) + 1}</span>}
                {!ranked && !full && <span className="pool-add">+</span>}
              </button>
            );
          })}
        </div>
        <div className="thirds-standings">
          <div className="thirds-panel-title">Qualified (8)</div>
          {Array.from({ length: 8 }, (_, i) => {
            const team  = selected[i];
            const group = team ? candidates.find(c => c.team === team)?.group : null;
            return (
              <div
                key={i}
                className={`standing-slot ${team ? 'filled' : 'empty'}`}
                onClick={() => team && toggle(team)}
              >
                <span className="slot-rank">{i + 1}</span>
                {team ? (
                  <>
                    <span className="slot-group">Group {group}</span>
                    <span className="slot-team">{team}</span>
                    <span className="slot-remove">✕</span>
                  </>
                ) : (
                  <span className="slot-empty">— pick a team</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Knockout ───────────────────────────────────────────────────────────

const KO_ROUNDS = [
  { label: 'Round of 32',    ids: [73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88] },
  { label: 'Round of 16',    ids: [89,90,91,92,93,94,95,96] },
  { label: 'Quarter-finals', ids: [97,98,99,100] },
  { label: 'Semi-finals',    ids: [101,102] },
  { label: 'Final',          ids: [104] },
];

function KnockoutTab({ actual, setActual }: {
  actual: Results;
  setActual: React.Dispatch<React.SetStateAction<Results>>;
}) {
  const winners = useMemo(() => actual.winners ?? {}, [actual]);

  const resolved = useMemo(
    () => resolveActualBracket(actual, winners),
    [actual, winners],
  );

  const standingsReady = GROUP_IDS.every(g => {
    const s = actual.groups?.[g];
    return s?.first && s?.second && s?.third;
  });
  const thirdsReady = (actual.bestThirds ?? []).length === 8;

  if (!standingsReady || !thirdsReady) {
    return (
      <div className="admin-section">
        <p className="admin-hint">
          Complete tabs 2 (Group Standings) and 3 (Best 8 Thirds) first —
          that's what determines who plays who in the Round of 32.
        </p>
      </div>
    );
  }

  async function pickWinner(matchId: number, team: string) {
    const prevWinner = winners[matchId];
    if (prevWinner === team) return; // no change

    // Prune downstream picks that are now invalid
    const nextWinners = { ...winners, [matchId]: team };
    pruneDownstream(matchId, team, nextWinners, resolved);

    const next: Results = { ...actual, winners: nextWinners };
    setActual(next);
    await Promise.all([
      saveActualResults(next),
      // Also update match_results for Match Predictor scoring
      supabase.from('match_results').upsert({
        match_id: matchId,
        home: resolved[matchId]?.home ?? '',
        away: resolved[matchId]?.away ?? '',
        result: resolved[matchId]?.home === team ? 'home' : 'away',
      }),
    ]);
  }

  return (
    <div className="admin-section">
      <p className="admin-hint">
        Teams are auto-filled from your group standings and best 8 thirds.
        Click the winning team after each match. Click again to undo.
      </p>
      {KO_ROUNDS.map(({ label, ids }) => (
        <div key={label} className="admin-ko-section">
          <div className="admin-ko-round-label">{label}</div>
          {ids.map(id => {
            const { home = '', away = '' } = resolved[id] ?? {};
            const picked = winners[id] ?? '';
            const bothKnown = !!(home && away);
            return (
              <div key={id} className={`admin-match-row ${picked ? 'settled' : ''} ${!bothKnown ? 'pending' : ''}`}>
                <span className="amr-id">M{id}</span>
                {bothKnown ? (
                  <>
                    <span className="amr-teams">{home} <span className="amr-vs">vs</span> {away}</span>
                    <div className="amr-btns">
                      {[home, away].map(team => (
                        <button
                          key={team}
                          className={`amr-btn ${picked === team ? 'active' : ''}`}
                          onClick={() => pickWinner(id, picked === team ? '' : team)}
                          title={picked === team ? 'Click to undo' : `${team} won`}
                        >
                          {team}{picked === team ? ' ✓' : ''}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="amr-pending">Waiting on earlier results…</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function pruneDownstream(
  matchId: number,
  newWinner: string,
  winners: Record<number, string>,
  resolved: Record<number, { home: string; away: string }>,
) {
  const queue = [matchId];
  while (queue.length) {
    const cur = queue.shift()!;
    const next = KNOCKOUT_MATCHES.filter(m => m.home === `W${cur}` || m.away === `W${cur}`);
    for (const m of next) {
      const { home = '', away = '' } = resolved[m.id] ?? {};
      const curPick = winners[m.id];
      if (curPick && curPick !== home && curPick !== away) {
        delete winners[m.id];
      }
      queue.push(m.id);
    }
  }
  void newWinner;
}
