import { useEffect, useState } from 'react';
import { socket } from './services/socket';
import Dashboard from './components/Dashboard';
import RouteSelect from './components/RouteSelect';
import ComingSoon from './components/ComingSoon';
import Header from './components/Header';
import FleetMap from './components/FleetMap';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [telemetry, setTelemetry] = useState({ buses: [], terminals: {} });
  const [routeData, setRouteData] = useState({ stops: [], roadPath: [] });

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/api/route`)
      .then(res => res.json())
      .then(data => setRouteData({ stops: data.stops || [], roadPath: data.roadPath || [] }))
      .catch(err => console.error("Error fetching route:", err));

    socket.on('route_update', (data) => {
      setRouteData({ stops: data.stops || [], roadPath: data.roadPath || [] });
    });

    return () => socket.off('route_update');
  }, []);

  useEffect(() => {
    socket.on('fleet_telemetry', setTelemetry);
    return () => socket.off('fleet_telemetry');
  }, []);

  if (screen === 'dashboard') {
    return <Dashboard onNavigate={setScreen} />;
  }

  if (screen === 'report' || screen === 'suggest') {
    const title = screen === 'report' ? 'Report an Issue' : 'Suggestions';
    return <ComingSoon feature={title} />;
  }

  if (screen === 'route-select') {
    return <RouteSelect onSelect={() => setScreen('tracking')} onBack={() => setScreen('dashboard')} />;
  }

  if (screen === 'track') {
    setScreen('route-select');
    return null;
  }

  return (
    <div className="app">
      <Header
        terminals={telemetry.terminals}
        busCount={telemetry.buses?.length || 0}
        onBack={() => setScreen('dashboard')}
      />
      <FleetMap buses={telemetry.buses} routeStops={routeData.stops} roadPath={routeData.roadPath} />
    </div>
  );
}
