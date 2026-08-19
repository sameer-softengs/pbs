export default function Header({ terminals, busCount, onBack }) {
  return (
    <header className="header">
      <div className="header-left">
        {onBack && <button className="back-btn-sm" onClick={onBack}>←</button>}
        <span className="header-title">PBS Route 1</span>
        <span className="live-badge">Live</span>
      </div>
      <div className="header-right">
        <span className="header-route">
          <span>{terminals?.origin || 'Model Colony'}</span>
          {' → '}
          <span>{terminals?.destination || 'Dockyard'}</span>
        </span>
        <span className="bus-count">{busCount} buses</span>
      </div>
    </header>
  );
}
