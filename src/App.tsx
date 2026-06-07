import { useState } from 'react';
import { NamePicker } from './components/NamePicker';
import { GroupPicker } from './components/GroupPicker';
import { Bracket } from './components/Bracket';
import { MatchList } from './components/MatchList';
import './App.css';

const LOCK_TIME = new Date('2026-06-11T18:00:00Z');

type View = 'home' | 'groups' | 'bracket' | 'match';

export default function App() {
  const [player, setPlayer] = useState<string | null>(
    () => localStorage.getItem('wc2026_player')
  );
  const [view, setView] = useState<View>('home');
  const isLocked = Date.now() >= LOCK_TIME.getTime();

  function selectPlayer(name: string) {
    localStorage.setItem('wc2026_player', name);
    setPlayer(name);
  }

  // No logout — once you pick your name it's yours for this device.
  // Prevents accidentally switching to someone else's picks.

  if (!player) return <NamePicker onSelect={selectPlayer} />;

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">⚽ WC 2026</span>
        <nav>
          <button onClick={() => setView('home')}    className={view === 'home'    ? 'active' : ''}>Home</button>
          <button onClick={() => setView('groups')}  className={view === 'groups'  ? 'active' : ''}>Groups</button>
          <button onClick={() => setView('bracket')} className={view === 'bracket' ? 'active' : ''}>Bracket</button>
          <button onClick={() => setView('match')}   className={view === 'match'   ? 'active' : ''}>Match Picks</button>
        </nav>
        <span className="player-tag">👤 {player}</span>
      </header>

      <main className="app-main">
        {view === 'home' && (
          <div className="home-view">
            <h2>Welcome, {player}!</h2>
            <p>Six friends. Two contests. One pot of $60.</p>

            {isLocked ? (
              <div className="status locked">
                🔒 Bracket picks are locked. Check the leaderboard!
              </div>
            ) : (
              <div className="status open">
                🟢 Bracket picks open until{' '}
                <strong>June 11, 2026 at 18:00 UTC</strong>
              </div>
            )}

            <div className="contest-cards">
              <div className="contest-card" onClick={() => setView('groups')}>
                <h3>🏆 Bracket Predictor</h3>
                <p>Pick every team through the knockout bracket before kickoff. Big points for calling the champion.</p>
                <button>Go →</button>
              </div>
              <div className="contest-card" onClick={() => setView('match')}>
                <h3>🎯 Match Predictor</h3>
                <p>Predict Home / Draw / Away for all 72 group games + every knockout match. Locks per game.</p>
                <button>Go →</button>
              </div>
            </div>
          </div>
        )}

        {view === 'groups' && (
          <GroupPicker
            player={player}
            onComplete={() => setView('bracket')}
          />
        )}

        {view === 'bracket' && (
          <Bracket player={player} />
        )}

        {view === 'match' && (
          <MatchList player={player} />
        )}
      </main>
    </div>
  );
}
