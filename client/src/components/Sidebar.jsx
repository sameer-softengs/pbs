import { useState } from 'react';
import Icon from './Icon';
export default function Sidebar({ buses, stops, distance, selectedBus, onSelectBus, onSelectStop, route, onChangeRoute, direction, onDirectionChange }) {
  const [tab,setTab]=useState(route.geometryAvailable===false?'stops':'fleet');
  const visible=buses.filter(bus=>direction==='all'||bus.direction===direction);
  const origin=route.mappedOrigin||route.origin;
  const destination=route.mappedDestination||route.destination;
  return <aside className="sidebar">
    <div className="route-summary">
      <div className="eyebrow">{route.kind||'KARACHI TRANSIT'}<button className="change-route" onClick={onChangeRoute}>Change route ↗</button></div>
      <div className="route-heading"><span className="route-code">{route.code}</span><div><h1>{route.origin}<span>to {route.destination}</span></h1><p>{route.active===false?'Inactive service · ':''}{route.mapAvailable?`${stops.length} published stop locations`:'Area directory'}</p></div></div>
      <div className="route-metrics"><span><Icon name="map" size={15}/>{distance?`${distance.toFixed(1)} km`:'Loading route'}</span><span><Icon name="pin" size={15}/>{stops.length} {route.mapAvailable?'stops':'areas'}</span><span><Icon name="bus" size={15}/>{buses.length} buses</span></div>
    </div>
    <div className="panel-tabs" role="tablist" aria-label="Route details"><button role="tab" aria-selected={tab==='fleet'} className={tab==='fleet'?'active':''} onClick={()=>setTab('fleet')}>Fleet <span>{buses.length}</span></button><button role="tab" aria-selected={tab==='stops'} className={tab==='stops'?'active':''} onClick={()=>setTab('stops')}>Route stops <span>{stops.length}</span></button></div>
    {tab==='fleet'&&<div className="fleet-directions"><div className="direction-buttons" role="group" aria-label="Filter buses by direction">{[['all','All buses'],['up','All UP'],['down','All DOWN']].map(([value,label])=><button key={value} aria-pressed={direction===value} className={direction===value?'active':''} onClick={()=>onDirectionChange(value)}>{label}<span>{value==='all'?buses.length:buses.filter(bus=>bus.direction===value).length}</span></button>)}</div><div className="direction-guide"><span><i className="legend-up"/><strong>UP</strong> {destination} → {origin}</span><span><i className="legend-bus"/><strong>DOWN</strong> {origin} → {destination}</span></div></div>}
    <div className="panel-scroll">
      {tab==='fleet'?<div className="bus-list">{visible.length?visible.map(bus=><button key={bus.busId} className={`bus-card ${selectedBus===bus.busId?'selected':''}`} onClick={()=>onSelectBus(bus.busId)}>
        <div className="bus-card-header"><span className={`bus-symbol ${bus.direction}`}><Icon name="bus"/></span><div><strong>{bus.busId}</strong><span className="bus-destination">{bus.directionLabel}</span></div><span className={`direction-badge ${bus.direction}`}>{bus.direction.toUpperCase()}</span></div>
        <div className="bus-next"><small>NEXT STOP</small><strong>{bus.nextStop}</strong></div><div className="bus-card-footer"><span><Icon name="clock" size={15}/><strong>{bus.nextStopEta}</strong></span><span>{bus.speed} <small>km/h</small></span></div>
      </button>):<div className="empty-state"><Icon name="bus" size={28}/><p>{route.geometryAvailable&&route.active?`No ${direction==='all'?'':direction.toUpperCase()+' '}buses received yet.`:'Demo fleet is unavailable for this route. Explore its stops instead.'}</p></div>}</div>:<ol className="stop-list">{stops.map((stop,i)=><li key={stop.id}><button disabled={!Number.isFinite(stop.lat)} onClick={()=>onSelectStop(stop)}><span className={`stop-node ${i===0||i===stops.length-1?'terminal':''}`}/><span><strong>{stop.name}</strong>{(i===0||i===stops.length-1)&&<small>Terminal</small>}</span><span className="stop-number">{String(i+1).padStart(2,'0')}</span></button></li>)}</ol>}
    </div>
    <div className="panel-note"><span className="status-dot"/><p>{route.note||'Demo fleet updates every 2.5 seconds.'}<br/><span>Positions and arrival times are simulated.</span></p></div>
  </aside>;
}
