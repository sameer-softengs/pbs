import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef, useMemo, useState, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './Icon';

function MapTools({ roadPath, routeStops, buses, selectedBus, focusStop }) {
  const map = useMap();
  const focusedBus = useRef(null);
  useEffect(() => {
    // OSM attribution remains visible; remove Leaflet's optional library credit.
    map.attributionControl.setPrefix(false);
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    if (roadPath.length < 2 && routeStops.length > 1) {
      map.fitBounds(L.latLngBounds(routeStops.map(stop=>[stop.lat,stop.lng])), { padding: [45,45] });
    }
  }, [map, roadPath, routeStops]);
  useEffect(() => {
    if (focusStop) map.flyTo([focusStop.lat, focusStop.lng], 16, { duration: 0.6 });
  }, [map, focusStop]);
  useEffect(() => {
    if (!selectedBus) { focusedBus.current = null; return; }
    const bus = buses.find(item => item.busId === selectedBus);
    if (bus?.location && focusedBus.current !== selectedBus) {
      map.flyTo([bus.location.lat, bus.location.lng], 15, { duration: 0.6 });
      focusedBus.current = selectedBus;
    }
  }, [map, buses, selectedBus]);
  return <button className="map-recenter" title="Fit the full R1 route" aria-label="Fit the full R1 route" onClick={() => {
    const points=roadPath.length>1?roadPath:routeStops.map(stop=>[stop.lat,stop.lng]);
    if(points.length>1)map.fitBounds(L.latLngBounds(points),{padding:[45,45]});
  }}><Icon name="target"/></button>;
}

function RoadPathLayer({ roadPath }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!roadPath || roadPath.length < 2) return;

    const polyline = L.polyline(roadPath.map(p => [p[0], p[1]]), {
      color: '#d8433d',
      weight: 4,
      opacity: 0.85,
      lineCap: 'round',
    });
    polyline.addTo(map);
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    layerRef.current = polyline;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, roadPath]);

  return null;
}

function TerminalLabels({ routeStops }) {
  const map = useMap();
  useEffect(() => {
    if (routeStops.length < 2) return;
    const labels=[routeStops[0],routeStops.at(-1)].map(stop=>{
      const label=document.createElement('div');
      label.className='terminal-label';label.textContent=stop.name;
      return L.marker([stop.lat,stop.lng],{icon:L.divIcon({className:'',iconSize:[90,24],iconAnchor:[-8,12],html:label})}).addTo(map);
    });
    return ()=>labels.forEach(label=>map.removeLayer(label));
  },[map,routeStops]);
  return null;
}

const StopMarker=memo(function StopMarker({ stop, index, selected, routeCode }) {
  const marker = useRef(null);
  const map = useMap();
  useEffect(() => {
    if (!selected) return;
    const open = () => marker.current?.openPopup();
    map.once('moveend', open);
    return () => map.off('moveend', open);
  }, [map, selected]);
  return <CircleMarker ref={marker} center={[stop.lat, stop.lng]} radius={selected ? 8 : 5}
    fillColor={selected ? '#d8433d' : '#fff'} color="#d8433d" weight={2} fillOpacity={1}>
    <Tooltip direction="top" offset={[0, -7]}>{stop.name}</Tooltip>
    <Popup maxWidth={280}>
      <div className="stop-popup">
        <span className="eyebrow">{routeCode} · STOP {String(index + 1).padStart(2, '0')}</span>
        <h3>{stop.name}</h3>
        <p>Bus stop location</p>
        <dl><dt>Latitude</dt><dd>{stop.lat.toFixed(6)}</dd><dt>Longitude</dt><dd>{stop.lng.toFixed(6)}</dd></dl>
      </div>
    </Popup>
  </CircleMarker>;
});

function BusMarker({ bus }) {
  const isDown = bus.direction === 'down';
  const heading = bus.directionLabel.replace(/^To /, '');
  const dirClass = isDown ? 'down' : 'up';

  const icon = useMemo(()=>L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:${isDown ? '#dc4038' : '#285b88'};color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:700;
        border:2px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        cursor:pointer;
        transition:transform 0.15s;
      ">${isDown ? '↑' : '↓'}</div>
    `,
  }), [isDown]);

  return (
    <Marker position={[bus.location.lat, bus.location.lng]} icon={icon}>
      <Popup maxWidth={240} closeButton={false}>
        <div className="bus-popup">
          <div className="bus-popup-header">
            <span className="bus-popup-id">{bus.busId}</span>
            <span className={`bus-popup-direction ${dirClass}`}>To {heading}</span>
          </div>
          <div className="bus-popup-row">
            <span className="label">Location</span>
            <span className="value">{bus.currentStop}</span>
          </div>
          <div className="bus-popup-row">
            <span className="label">Next Stop</span>
            <span className="value">{bus.nextStop}</span>
          </div>
          <div className="bus-popup-row">
            <span className="label">ETA</span>
            <span className="bus-popup-eta">{bus.nextStopEta}</span>
          </div>
          <div className="bus-popup-row">
            <span className="label">Speed</span>
            <span className="bus-popup-speed">{bus.speed} <small>km/h</small></span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function FleetMap({ buses = [], routeStops = [], roadPath = [], selectedBus, focusStop, routeCode = 'R1' }) {
  const [tileError,setTileError]=useState(false);
  const [tileRetry,setTileRetry]=useState(0);
  const tileEvents=useMemo(()=>({tileerror:()=>setTileError(true)}),[]);
  const mappedStops=useMemo(()=>routeStops.filter(stop=>Number.isFinite(stop.lat)&&Number.isFinite(stop.lng)),[routeStops]);
  return (
    <div className="map-canvas">
      <MapContainer center={[24.8710, 67.0870]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer key={tileRetry} eventHandlers={tileEvents}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {tileError&&<div className="tile-error" role="status">Map tiles could not load. Stops and route are still shown.<button onClick={()=>{setTileError(false);setTileRetry(count=>count+1);}}>Retry map</button></div>}
        <RoadPathLayer roadPath={roadPath} />
        <MapTools roadPath={roadPath} routeStops={mappedStops} buses={buses} selectedBus={selectedBus} focusStop={focusStop}/>
        <TerminalLabels routeStops={mappedStops} />

        {mappedStops.map((stop, idx) => (
          <StopMarker key={stop.id || `stop-${idx}`} stop={stop} index={idx} routeCode={routeCode} selected={focusStop?.id === stop.id}/>
        ))}

        {Array.isArray(buses) && buses.filter(bus => bus.location).map((bus) => (
          <BusMarker key={bus.busId} bus={bus} />
        ))}
      </MapContainer>
    </div>
  );
}
