import { useState } from 'react';
import { supabase } from '../lib/supabase';

const PLAYERS = ['Avash', 'Riti', 'Sabun', 'Sumaly', 'Ujjwal', 'Utsabi'];

interface Props {
  onSelect: (name: string) => void;
}

type Step = 'pick-name' | 'set-pin' | 'enter-pin';

export function NamePicker({ onSelect }: Props) {
  const [step, setStep]       = useState<Step>('pick-name');
  const [chosen, setChosen]   = useState('');
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleNameClick(name: string) {
    setLoading(true);
    setError('');
    // Check if this player already has a pin set
    const { data } = await supabase
      .from('predictions')
      .select('data')
      .eq('player', name)
      .maybeSingle();
    setLoading(false);
    setChosen(name);

    if (data?.data?.pin) {
      setStep('enter-pin');
    } else {
      setStep('set-pin');
    }
  }

  async function handleSetPin() {
    if (pin.length < 4) { setError('PIN must be 4 digits.'); return; }
    setLoading(true);
    // Save PIN as part of prediction data (upsert creates the row if missing)
    const { data: existing } = await supabase
      .from('predictions')
      .select('data')
      .eq('player', chosen)
      .maybeSingle();

    const currentData = (existing?.data as Record<string, unknown>) ?? {};
    await supabase.from('predictions').upsert({
      player: chosen,
      data: { ...currentData, pin },
      updated_at: new Date().toISOString(),
    });
    setLoading(false);
    onSelect(chosen);
  }

  async function handleEnterPin() {
    setLoading(true);
    const { data } = await supabase
      .from('predictions')
      .select('data')
      .eq('player', chosen)
      .maybeSingle();
    setLoading(false);

    if ((data?.data as Record<string, unknown>)?.pin === pin) {
      onSelect(chosen);
    } else {
      setError('Wrong PIN. Try again.');
      setPin('');
    }
  }

  if (step === 'pick-name') {
    return (
      <div className="name-picker">
        <h1>⚽ World Cup 2026</h1>
        <p>Who are you?</p>
        {loading && <p style={{ color: '#888', fontSize: '0.85rem' }}>Checking…</p>}
        <div className="player-grid">
          {PLAYERS.map((name) => (
            <button key={name} onClick={() => !loading && handleNameClick(name)} className="player-btn">
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'set-pin') {
    return (
      <div className="name-picker">
        <h1>⚽ World Cup 2026</h1>
        <p>Welcome, <strong>{chosen}</strong>! Set a 4-digit PIN to protect your picks.</p>
        <p style={{ color: '#888', fontSize: '0.8rem' }}>
          Anyone entering your name will need this PIN — including you on other devices.
        </p>
        <input
          className="pin-input"
          type="number"
          placeholder="4-digit PIN"
          maxLength={4}
          value={pin}
          onChange={e => { setPin(e.target.value.slice(0, 4)); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSetPin()}
          autoFocus
        />
        {error && <p className="pin-error">{error}</p>}
        <button className="player-btn" onClick={handleSetPin} disabled={loading || pin.length < 4}>
          {loading ? 'Saving…' : 'Set PIN & Enter →'}
        </button>
        <button className="pin-back" onClick={() => { setStep('pick-name'); setPin(''); setError(''); }}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="name-picker">
      <h1>⚽ World Cup 2026</h1>
      <p>Enter your PIN for <strong>{chosen}</strong></p>
      <input
        className="pin-input"
        type="number"
        placeholder="4-digit PIN"
        maxLength={4}
        value={pin}
        onChange={e => { setPin(e.target.value.slice(0, 4)); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && handleEnterPin()}
        autoFocus
      />
      {error && <p className="pin-error">{error}</p>}
      <button className="player-btn" onClick={handleEnterPin} disabled={loading || pin.length < 4}>
        {loading ? 'Checking…' : 'Enter →'}
      </button>
      <button className="pin-back" onClick={() => { setStep('pick-name'); setPin(''); setError(''); }}>
        ← Back
      </button>
    </div>
  );
}
