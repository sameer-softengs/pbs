import React from 'react';

export default function Sidebar({ buses }) {
  return (
    <aside className="sidebar">
      <h2>Active Fleet Feed</h2>
      <div className="bus-list">
        {buses.map(bus => (
          <div key={bus.busId} className="bus-card" style={{ borderLeftColor: bus.color }}>
            <div className="bus-card-header">
              <strong>{bus.busId}</strong>
              <span className="direction-tag">{bus.directionLabel}</span>
            </div>
            <p><strong>Current Stop:</strong> {bus.currentStop}</p>
            <p><strong>Next Stop:</strong> {bus.nextStop} ({bus.nextStopEta})</p>
            <p><strong>Speed:</strong> {bus.speed} km/h</p>
          </div>
        ))}
      </div>
    </aside>
  );
}