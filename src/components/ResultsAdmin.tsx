import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { GROUP_FIXTURES } from '../data/groupFixtures';
import { KNOCKOUT_MATCHES } from '../data/matches';
import { GROUPS } from '../data/teams';
import type { Results, GroupId, Outcome } from '../types';
import type { ResultMap } from '../lib/useMatchPicks';
import './ResultsAdmin.css';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;
const GROUP_IDS = Object.keys(GROUPS) as GroupId[];

type AdminTab = 'group-results' | 'bracket-results' | 'knockout-teams';

export function ResultsAdmin() {
  const [authed, setAuthed]   = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab]         = useState<AdminTab>('group-results');

  // Match results state
  const [matchResults, setMatchResults] = useState<ResultMap>({});
  // Bracket results state
  const [bracketResults, setBracketResults] = useState<Results>({});

  useEffect(() => {
    if (!authed) return;
    async function load() {
      const [{ data: mr }, { data: br }] = await Promise.all([
        supabase.from('match_results').select('*'),
        supabase.from('results').select('data').eq('id', 1).single(),
      ]);
      const map: ResultMap = {};
      for (const r of mr ?? []) map[r.match_id] = r;
      setMatchResults(map);
      setBracketResults((br?.data as Results) ?? {});
    }
    load();
  }, [authed]);

  function checkPassword() {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
    } else {
      setPwError(true);
      setPwInput('');
    }
  }

  if (!authed) {
    return (
      <div className="admin-gate">
        <h2>Admin Access</h2>
        <p>Enter the admin password to manage results.</p>
        <div className="admin-pw-row">
          <input
            type="password"
            placeholder="Password"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === 'Enter' && checkPassword()}
            autoFocus
          />
          <button onClick={checkPassword}>Enter</button>
        </div>
        {pwError && <p className="admin-error">Wrong password.</p>}
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Results Admin</h2>
        <p className="admin-sub">Only you see this. Enter results as games finish.</p>
      </div>

      <div className="admin-tabs">
        {([
          ['group-results',   'Group Results'],
          ['knockout-teams',  'Knockout Teams'],
          ['bracket-results', 'Bracket Results'],
        ] as [AdminTab, string][]).map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'group-results'   && <GroupResultsTab   matchResults={matchResults} setMatchResults={setMatchResults} />}
      {tab === 'knockout-teams'  && <KnockoutTeamsTab  matchResults={matchResults} setMatchResults={setMatchResults} />}
      {tab === 'bracket-results' && <BracketResultsTab bracketResults={bracketResults} setBracketResults={setBracketResults} />}
    </div>
  );
}

// ── Group Results Tab ────────────────────────────────────────────────────────

function GroupResultsTab({ matchResults, setMatchResults }: {
  matchResults: ResultMap;
  setMatchResults: React.Dispatch<React.SetStateAction<ResultMap>>;
}) {
  async function setResult(matchId: number, result: Outcome | '') {
    const existing = matchResults[matchId] ?? {};
    const row = { ...existing, match_id: matchId, result: result || null };
    await supabase.from('match_results').upsert(row);
    setMatchResults(prev => ({ ...prev, [matchId]: row as typeof prev[number] }));
  }

  return (
    <div className="admin-section">
      <p className="admin-hint">Set the outcome for each group game as it finishes.</p>
      {GROUP_FIXTURES.map(f => {
        const r = matchResults[f.id];
        return (
          <div key={f.id} className="admin-match-row">
            <span className="amr-teams">{f.home} vs {f.away}</span>
            <div className="amr-btns">
              {(['home', 'draw', 'away'] as Outcome[]).map(o => {
                const label = o === 'home' ? f.home : o === 'away' ? f.away : 'Draw';
                return (
                  <button
                    key={o}
                    className={`amr-btn ${r?.result === o ? 'active' : ''}`}
                    onClick={() => setResult(f.id, r?.result === o ? '' : o)}
                  >
                    {label}
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

// ── Knockout Teams Tab ───────────────────────────────────────────────────────

function KnockoutTeamsTab({ matchResults, setMatchResults }: {
  matchResults: ResultMap;
  setMatchResults: React.Dispatch<React.SetStateAction<ResultMap>>;
}) {
  async function setTeams(matchId: number, home: string, away: string) {
    const existing = matchResults[matchId] ?? {};
    const row = { ...existing, match_id: matchId, home, away };
    await supabase.from('match_results').upsert(row);
    setMatchResults(prev => ({ ...prev, [matchId]: row as typeof prev[number] }));
  }

  async function setKnockoutResult(matchId: number, result: Outcome | '') {
    const existing = matchResults[matchId] ?? {};
    const row = { ...existing, match_id: matchId, result: result || null };
    await supabase.from('match_results').upsert(row);
    setMatchResults(prev => ({ ...prev, [matchId]: row as typeof prev[number] }));
  }

  return (
    <div className="admin-section">
      <p className="admin-hint">
        As the bracket resolves, set which two teams play each knockout match.
        Then enter the winner after the game.
      </p>
      {KNOCKOUT_MATCHES.map(m => {
        const r = matchResults[m.id] ?? {};
        return (
          <div key={m.id} className="admin-ko-row">
            <span className="amr-id">M{m.id} · {m.round}</span>
            <div className="admin-ko-teams">
              <input
                placeholder="Home team"
                value={r.home ?? ''}
                onChange={e => setTeams(m.id, e.target.value, r.away ?? '')}
              />
              <span className="ko-vs">vs</span>
              <input
                placeholder="Away team"
                value={r.away ?? ''}
                onChange={e => setTeams(m.id, r.home ?? '', e.target.value)}
              />
            </div>
            {r.home && r.away && (
              <div className="amr-btns">
                <button
                  className={`amr-btn ${r.result === 'home' ? 'active' : ''}`}
                  onClick={() => setKnockoutResult(m.id, r.result === 'home' ? '' : 'home')}
                >{r.home}</button>
                <button
                  className={`amr-btn ${r.result === 'away' ? 'active' : ''}`}
                  onClick={() => setKnockoutResult(m.id, r.result === 'away' ? '' : 'away')}
                >{r.away}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Bracket Results Tab ──────────────────────────────────────────────────────

function BracketResultsTab({ bracketResults, setBracketResults }: {
  bracketResults: Results;
  setBracketResults: React.Dispatch<React.SetStateAction<Results>>;
}) {
  async function save(next: Results) {
    setBracketResults(next);
    await supabase.from('results').upsert({ id: 1, data: next });
  }

  function setGroup(gid: GroupId, field: 'first' | 'second', team: string) {
    const prev = bracketResults.groups?.[gid] ?? { first: '', second: '', third: '' };
    save({
      ...bracketResults,
      groups: { ...bracketResults.groups, [gid]: { ...prev, [field]: team } } as Results['groups'],
    });
  }

  return (
    <div className="admin-section">
      <p className="admin-hint">
        Enter actual group standings (1st/2nd) as the group stage finishes.
        This scores the Bracket Predictor.
      </p>
      {GROUP_IDS.map(gid => {
        const act = bracketResults.groups?.[gid];
        return (
          <div key={gid} className="admin-group-row">
            <span className="admin-group-label">Group {gid}</span>
            <div className="admin-group-inputs">
              <select
                value={act?.first ?? ''}
                onChange={e => setGroup(gid, 'first', e.target.value)}
              >
                <option value="">— 1st —</option>
                {GROUPS[gid].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={act?.second ?? ''}
                onChange={e => setGroup(gid, 'second', e.target.value)}
              >
                <option value="">— 2nd —</option>
                {GROUPS[gid].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
