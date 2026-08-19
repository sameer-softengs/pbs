export default function RouteSelect({ onSelect, onBack }) {
  const routes = [
    { id: 'r1', from: 'Model Colony', to: 'Dockyard', code: 'R1', active: true, km: 28 },
    { id: 'r2', from: 'Gulshan-e-Hadeed', to: 'Tower', code: 'R9', active: false, km: 42 },
    { id: 'r3', from: 'Numaish', to: 'Ibrahim Hyderi', code: 'R10', active: false, km: 30 },
    { id: 'r4', from: 'Power House', to: 'Tower', code: 'R4', active: false, km: 21 },
    { id: 'r5', from: 'North Karachi', to: 'Korangi', code: 'R2', active: false, km: 31 },
    { id: 'r6', from: 'Hawksbay', to: 'Tower', code: 'R13', active: false, km: 19 },
  ];

  return (
    <div className="rs">
      <div className="rs-top">
        <button className="rs-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <span className="rs-title">Select Route</span>
      </div>

      <div className="rs-body">
        {routes.map((r, i) => (
          <button
            key={r.id}
            className={`rs-card ${r.active ? 'active' : 'dim'}`}
            onClick={() => r.active && onSelect(r.id)}
            disabled={!r.active}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rs-card-left">
              <span className="rs-code">{r.code}</span>
              <div className="rs-card-info">
                <span className="rs-route">{r.from} → {r.to}</span>
                <span className="rs-km">{r.km} km</span>
              </div>
            </div>
            {r.active ? (
              <span className="rs-pill live">
                <span className="rs-dot" />
                Live
              </span>
            ) : (
              <span className="rs-pill">Soon</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
