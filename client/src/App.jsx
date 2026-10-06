import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { socket } from './services/socket';
import { fetchJson } from './services/api';
import Dashboard from './components/Dashboard';
import RouteSelect from './components/RouteSelect';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './App.css';
const FleetMap=lazy(()=>import('./components/FleetMap'));
const EMPTY={stops:[],roadPath:[]};
export default function App() {
  const [screen,setScreen]=useState('dashboard');
  const [connected,setConnected]=useState(false);
  const [connectionError,setConnectionError]=useState(false);
  const [catalog,setCatalog]=useState([]);
  const [routeId,setRouteId]=useState(null);
  const [telemetry,setTelemetry]=useState({buses:[]});
  const [routeData,setRouteData]=useState(EMPTY);
  const [selectedBus,setSelectedBus]=useState(null);
  const [focusStop,setFocusStop]=useState(null);
  const [direction,setDirection]=useState('all');
  const [routeError,setRouteError]=useState('');
  const [catalogError,setCatalogError]=useState('');
  const [catalogLoading,setCatalogLoading]=useState(true);
  const [routeLoading,setRouteLoading]=useState(false);
  const [catalogRetry,setCatalogRetry]=useState(0);
  const [routeRetry,setRouteRetry]=useState(0);
  const cachedRoutes=useRef(new Map());
  useEffect(()=>{
    const abort=new AbortController();
    fetchJson('/api/routes',abort.signal).then(data=>{
      if(!Array.isArray(data)||data.some(route=>!route.id||!Array.isArray(route.areas)))throw new Error('The route directory could not be loaded.');
      setCatalog(data);setCatalogError('');
    }).catch(error=>{if(!abort.signal.aborted)setCatalogError(error.message==='Failed to fetch'?'Cannot reach the transit service. Please retry.':error.message);})
      .finally(()=>{if(!abort.signal.aborted)setCatalogLoading(false);});
    return ()=>abort.abort();
  },[catalogRetry]);
  useEffect(()=>{
    if(!routeId||screen!=='tracking')return;
    const abort=new AbortController();
    const updateRoute=data=>{
      if(abort.signal.aborted||data?.id!==routeId||!Array.isArray(data.stops)||!Array.isArray(data.roadPath))return;
      cachedRoutes.current.set(routeId,data);setRouteData(data);setRouteError('');setRouteLoading(false);
    };
    const updateTelemetry=data=>{if(data.routeId===routeId&&Array.isArray(data.buses))setTelemetry(data);};
    const onConnect=()=>{setConnected(true);setConnectionError(false);socket.emit('subscribe_route',routeId);};
    const onDisconnect=()=>setConnected(false);
    const onError=()=>{setConnected(false);setConnectionError(true);};
    const onRouteError=data=>setRouteError(data.error||'Unable to open this route. Please retry.');
    socket.on('route_update',updateRoute);socket.on('fleet_telemetry',updateTelemetry);
    socket.on('connect',onConnect);socket.on('disconnect',onDisconnect);socket.on('connect_error',onError);socket.on('route_error',onRouteError);
    socket.connect();
    fetchJson(`/api/routes/${routeId}`,abort.signal).then(updateRoute).catch(error=>{if(!abort.signal.aborted){setRouteError(error.message);setRouteLoading(false);}});
    return ()=>{abort.abort();socket.off('route_update',updateRoute);socket.off('fleet_telemetry',updateTelemetry);socket.off('connect',onConnect);socket.off('disconnect',onDisconnect);socket.off('connect_error',onError);socket.off('route_error',onRouteError);socket.disconnect();};
  },[routeId,screen,routeRetry]);
  const navigate=next=>{setConnected(false);setScreen(next==='tracking'?'route-select':next);};
  const selectRoute=id=>{
    const metadata=catalog.find(route=>route.id===id);if(!metadata)return;
    setRouteData(cachedRoutes.current.get(id)||{...EMPTY,...metadata});setTelemetry({buses:[]});setSelectedBus(null);setFocusStop(null);setDirection('all');setRouteError('');setConnectionError(false);setConnected(false);setRouteLoading(!cachedRoutes.current.has(id));setRouteId(id);setScreen('tracking');
  };
  const retryDirectory=()=>{setCatalogError('');setCatalogLoading(true);setCatalogRetry(count=>count+1);};
  const retryRoute=()=>{setRouteError('');setRouteLoading(true);setConnectionError(false);setRouteRetry(count=>count+1);};
  const visibleBuses=useMemo(()=>telemetry.buses.filter(bus=>direction==='all'||bus.direction===direction),[telemetry.buses,direction]);
  return <div className="app"><Header screen={screen} onNavigate={navigate} connected={connected}/>
    {screen==='dashboard'?<Dashboard onNavigate={navigate} stopCount={44} distance={30.4} routeCount={catalog.length}/>:screen==='route-select'?<RouteSelect routes={catalog} loading={catalogLoading} error={catalogError} onRetry={retryDirectory} onSelect={selectRoute} onBack={()=>navigate('dashboard')}/>:<main className="tracking-layout">
      <Sidebar key={routeId} route={routeData} buses={telemetry.buses} stops={routeData.stops} distance={routeData.distanceKm} direction={direction} onDirectionChange={value=>{setDirection(value);setSelectedBus(null);}} selectedBus={selectedBus} onSelectBus={id=>{setSelectedBus(id);setFocusStop(null);}} onSelectStop={stop=>{setFocusStop(stop);setSelectedBus(null);}} onChangeRoute={()=>navigate('route-select')}/>
      <div className="map-area"><div className="map-topline"><span><span className={`status-dot ${connected?'':'offline'}`}/> {routeData.code} · {routeData.geometryAvailable?'Route map':routeData.mapAvailable?'Stop locations':'Route directory'}</span><span>{routeData.kind||'Karachi transit'}</span></div>
        {routeError&&<div className="map-error" role="alert">{routeError}<button onClick={retryRoute}>Retry</button></div>}
        {!routeError&&connectionError&&<div className="connection-banner" role="status">Fleet connection unavailable. Showing the last received positions.<button onClick={retryRoute}>Reconnect</button></div>}
        {routeLoading&&<div className="route-loading" role="status"><span className="loading-spinner"/>Loading {routeData.code} stops and route…</div>}
        <Suspense fallback={<div className="map-loading" role="status">Opening the map…</div>}><FleetMap key={routeId} routeCode={routeData.code} buses={visibleBuses} routeStops={routeData.stops} roadPath={routeData.roadPath} selectedBus={selectedBus} focusStop={focusStop}/></Suspense>
        {routeData.mapAvailable===false&&!routeLoading&&<div className="directory-overlay"><span className="route-code">{routeData.code}</span><h2>{routeData.origin} → {routeData.destination}</h2><p>Detailed stop coordinates are not available. Explore the route’s areas in the stop list.</p><button onClick={()=>navigate('route-select')}>Explore other routes</button></div>}
        <div className="map-legend">{routeData.geometryAvailable&&<span><i className="legend-route"/>{routeData.code} road estimate</span>}<span><i className="legend-stop"/>Bus stop</span>{!!visibleBuses.length&&<><span><i className="legend-up"/>UP</span><span><i className="legend-bus"/>DOWN</span></>}</div>
      </div>
    </main>}
  </div>;
}
