import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
      color: '#3b82f6',
      weight: 4,
      opacity: 0.7,
      lineCap: 'round',
    });
    polyline.addTo(map);
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

function TerminalLabels({ roadPath }) {
  const map = useMap();
  const labelsRef = useRef([]);

  useEffect(() => {
    labelsRef.current.forEach(l => map.removeLayer(l));
    labelsRef.current = [];

    if (!roadPath || roadPath.length < 2) return;

    const start = roadPath[0];
    const end = roadPath[roadPath.length - 1];

    const startLabel = L.marker([start[0], start[1]], {
      icon: L.divIcon({
        className: '',
        iconSize: [90, 24],
        iconAnchor: [-8, 12],
        html: '<div class="terminal-label">Model Colony</div>',
      }),
    }).addTo(map);

    const endLabel = L.marker([end[0], end[1]], {
      icon: L.divIcon({
        className: '',
        iconSize: [90, 24],
        iconAnchor: [-8, 12],
        html: '<div class="terminal-label">Dockyard</div>',
      }),
    }).addTo(map);

    labelsRef.current = [startLabel, endLabel];

    return () => {
      labelsRef.current.forEach(l => map.removeLayer(l));
      labelsRef.current = [];
    };
  }, [map, roadPath]);

  return null;
}

function BusMarker({ bus }) {
  const isDown = bus.direction === 'down';
  const heading = isDown ? 'Model Colony' : 'Dockyard';
  const dirClass = isDown ? 'down' : 'up';

  const icon = L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:#dc2626;color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-size:14px;font-weight:700;
        border:2px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        cursor:pointer;
        transition:transform 0.15s;
      ">${isDown ? '↑' : '↓'}</div>
    `,
  });

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

export default function FleetMap({ buses = [], routeStops = [], roadPath = [] }) {
  return (
    <div style={{ flex: 1 }}>
      <MapContainer center={[24.8710, 67.0870]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <RoadPathLayer roadPath={roadPath} />
        <TerminalLabels roadPath={roadPath} />

        {Array.isArray(routeStops) && routeStops.map((stop, idx) => (
          <CircleMarker
            key={stop.id || `stop-${idx}`}
            center={[stop.lat, stop.lng]}
            radius={4}
            fillColor="#0d9488"
            color="#fff"
            weight={1.5}
            fillOpacity={1}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span style={{ fontSize: 11, fontWeight: 500 }}>{stop.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {Array.isArray(buses) && buses.filter(bus => bus.location).map((bus) => (
          <BusMarker key={bus.busId} bus={bus} />
        ))}
      </MapContainer>
    </div>
  );
}
