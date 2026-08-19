export default function Dashboard({ onNavigate }) {
  return (
    <div className="dash">
      <div className="dash-bg" />

      <div className="dash-content">
        <div className="dash-brand">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="5" y="6" width="22" height="16" rx="3" fill="#fff"/>
              <rect x="7" y="8" width="7" height="6" rx="1" fill="#bfdbfe"/>
              <rect x="16" y="8" width="9" height="6" rx="1" fill="#bfdbfe"/>
              <rect x="5" y="16" width="22" height="2" fill="#fecaca"/>
              <circle cx="11" cy="25" r="2" fill="#fff"/>
              <circle cx="21" cy="25" r="2" fill="#fff"/>
              <rect x="13" y="23.5" width="6" height="2" rx="0.5" fill="#fbbf24"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">PBS</span>
            <span className="brand-sub">Peoples Bus Service</span>
          </div>
        </div>

        <div className="dash-head">
          <h1>Welcome back</h1>
          <p>Choose an option to get started</p>
        </div>

        <div className="dash-actions">
          <button className="action-card live" onClick={() => onNavigate('track')}>
            <div className="action-left">
              <div className="action-icon live-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="3" fill="#fff"/>
                  <path d="M10 2v3M10 15v3M2 10h3M15 10h3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="10" cy="10" r="7" stroke="#fff" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <div>
                <span className="action-title">Track My Bus</span>
                <span className="action-desc">Live GPS · Real-time arrivals</span>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          <button className="action-card disabled" disabled>
            <div className="action-left">
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 14l4-4 3 3 4-5 3 3" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="3" width="16" height="14" rx="2" stroke="#999" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <div>
                <span className="action-title">Report an Issue</span>
                <span className="action-desc">Delays · Safety · Service</span>
              </div>
            </div>
            <span className="soon-tag">Soon</span>
          </button>

          <button className="action-card disabled" disabled>
            <div className="action-left">
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="4" stroke="#999" strokeWidth="1.5" fill="none"/>
                  <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke="#999" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <div>
                <span className="action-title">Suggestions</span>
                <span className="action-desc">Route improvements · Feedback</span>
              </div>
            </div>
            <span className="soon-tag">Soon</span>
          </button>
        </div>

        <span className="dash-version">Prototype v1.0 · OpenStreetMap</span>
      </div>
    </div>
  );
}
