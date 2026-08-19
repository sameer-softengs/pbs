export default function ComingSoon({ feature }) {
  return (
    <div className="cs">
      <div className="cs-box">
        <div className="cs-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="12" stroke="#d4d4d4" strokeWidth="1.5" fill="none"/>
            <path d="M16 10v8" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="16" cy="22" r="1" fill="#999"/>
          </svg>
        </div>
        <h2>{feature}</h2>
        <p>This feature will be available during the production release.</p>
        <button className="cs-btn" onClick={() => window.location.reload()}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
