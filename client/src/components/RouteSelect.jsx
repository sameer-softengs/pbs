import { useState } from 'react';
import Icon from './Icon';
export default function RouteSelect({ routes, onSelect, onBack, loading, error, onRetry }) {
  const [query,setQuery]=useState('');
  const [kind,setKind]=useState('all');
  const visible=routes.filter(r=>(kind==='all'||r.kind===kind)&&`${r.code} ${r.origin} ${r.destination} ${r.areas.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="rs">
    <div className="rs-top"><button className="rs-back" onClick={onBack}>← Overview</button><div><h1 className="rs-title">Karachi routes</h1><p className="routes-subtitle">Explore {routes.length} bus routes across the city.</p></div></div>
    <div className="route-search"><Icon name="map" size={19}/><input aria-label="Search route, terminal, or area" placeholder="Search a route, terminal, or area…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Filter by service" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">All services</option>{[...new Set(routes.map(r=>r.kind))].map(k=><option key={k}>{k}</option>)}</select></div>
    <p className="routes-result">{visible.length} routes · Select a route to explore its stops</p>
    <div className="rs-body">{visible.map(r=><button key={r.id} className="rs-card active" onClick={()=>onSelect(r.id)}>
      <div className="rs-card-left"><span className={`rs-code ${r.kind==='Electric'?'electric':''}`}>{r.code}</span><div className="rs-card-info"><span className="rs-route">{r.origin} → {r.destination}</span><span className="rs-km">{r.kind} · {r.officialDistanceKm ? `${r.officialDistanceKm} km` : 'Distance unlisted'} · {r.totalStops} {r.mapAvailable?'stops':'areas'}</span><span className="route-coverage">{r.geometryAvailable?'Road map + demo fleet':r.mapAvailable?'Stop map':'Area directory'}{!r.active?' · Inactive service':''}</span></div></div><Icon name="chevron" size={16}/>
    </button>)}</div>
    {error&&<div className="directory-error" role="alert"><p>{error}</p><button onClick={onRetry}>Try again</button></div>}
    {loading&&<div className="empty-state" role="status"><span className="loading-spinner"/>Loading the route directory…</div>}
    {!loading&&!error&&!visible.length&&<div className="empty-state">No routes match your search.</div>}
  </main>;
}
