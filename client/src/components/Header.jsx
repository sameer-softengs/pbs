import Icon from './Icon';
export default function Header({ screen, onNavigate, connected }) {
  return <header className="header">
    <button className="brand" onClick={() => onNavigate('dashboard')} aria-label="PBS overview">
      <img className="brand-logo" src="/logo.svg" width="44" height="44" alt=""/>
      <span><strong>PBS<span className="brand-dot">.</span></strong><small>PEOPLES BUS SERVICE</small></span>
    </button>
    <nav className="main-nav" aria-label="Main navigation">
      {[['dashboard','grid','Overview'],['route-select','map','Routes'],['tracking','target','Bus tracker']].map(([id,icon,label]) =>
        <button key={id} aria-label={label} aria-current={screen === id ? 'page' : undefined} className={screen === id ? 'active' : ''} onClick={() => onNavigate(id)}><Icon name={icon} size={17}/><span>{label}</span></button>)}
    </nav>
    <div className="connection"><span className={`status-dot ${connected ? '' : 'offline'}`}/><span>{screen !== 'tracking' ? 'Karachi route explorer' : connected ? 'Simulation connected' : 'Connecting…'}</span><span className="city-tag">Karachi, PK</span></div>
  </header>;
}
