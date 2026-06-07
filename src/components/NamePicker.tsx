const PLAYERS = ['Ujjwal', 'Sumaly', 'Utsabi', 'Sabun', 'Riti', 'Avash'];

interface Props {
  onSelect: (name: string) => void;
}

export function NamePicker({ onSelect }: Props) {
  return (
    <div className="name-picker">
      <h1>⚽ World Cup 2026</h1>
      <p>Who are you?</p>
      <div className="player-grid">
        {PLAYERS.map((name) => (
          <button key={name} onClick={() => onSelect(name)} className="player-btn">
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
