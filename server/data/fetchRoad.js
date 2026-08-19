// Final approach: route with carefully placed guide points on Shahrah-e-Faisal
// Then snap stops to the clean route

const stops = [
  { n: 'Khokrapar', lat: 24.8941, lng: 67.1980 },
  { n: 'Saudabad', lat: 24.8917, lng: 67.1951 },
  { n: 'RCD Ground', lat: 24.8921, lng: 67.1913 },
  { n: 'Kala Board', lat: 24.8948, lng: 67.1848 },
  { n: 'Malir Halt', lat: 24.8965, lng: 67.1610 },
  { n: 'Colony Gate', lat: 24.8906, lng: 67.1490 },
  { n: 'Nata Khan Bridge', lat: 24.8858, lng: 67.1366 },
  { n: 'Drigh Road', lat: 24.8799, lng: 67.1218 },
  { n: 'PAF Base Faisal', lat: 24.8766, lng: 67.1049 },
  { n: 'Laal Kothi', lat: 24.8725, lng: 67.0949 },
  { n: 'Karsaz', lat: 24.8700, lng: 67.0838 },
  { n: 'Nursery', lat: 24.8610, lng: 67.0629 },
  { n: 'FTC Building', lat: 24.8569, lng: 67.0465 },
  { n: 'Regent Plaza', lat: 24.8534, lng: 67.0367 },
  { n: 'Hotel Metropole', lat: 24.8522, lng: 67.0315 },
  { n: 'Fawwara Chowk', lat: 24.8568, lng: 67.0254 },
  { n: 'Arts Council', lat: 24.8535, lng: 67.0185 },
  { n: 'Shaheen Complex', lat: 24.8494, lng: 67.0125 },
  { n: 'I.I. Chundrigar', lat: 24.8503, lng: 67.0059 },
  { n: 'Tower', lat: 24.8488, lng: 66.9968 },
  { n: 'Fisheries', lat: 24.8436, lng: 66.9833 },
  { n: 'Dockyard', lat: 24.8368, lng: 66.9726 }
];

// Key: route through STOPS only, but use continue_straight
// Test 1: all stops as waypoints with continue_straight
const coords = stops.map(s => `${s.lng.toFixed(4)},${s.lat.toFixed(4)}`).join(';');
const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&continue_straight=true`;

fetch(url).then(r => r.json()).then(d => {
  if (d.code !== 'Ok') { console.log('Error:', d.code); return; }
  const r = d.routes[0];
  const geom = r.geometry.coordinates;
  console.log('Route:', (r.distance/1000).toFixed(1), 'km,', geom.length, 'points');
  
  // Check each stop
  stops.forEach((s, i) => {
    const wp = d.waypoints[i];
    console.log(`  ${s.n}: snapped ${Math.round(wp.distance)}m`);
  });
  
  // Check for sharp turns (zigzags) - angle between consecutive segments
  let sharpTurns = 0;
  for (let i = 2; i < geom.length; i++) {
    const dx1 = geom[i-1][0] - geom[i-2][0];
    const dy1 = geom[i-1][1] - geom[i-2][1];
    const dx2 = geom[i][0] - geom[i-1][0];
    const dy2 = geom[i][1] - geom[i-1][1];
    const angle = Math.abs(Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1));
    if (angle > 0.8) sharpTurns++;
  }
  console.log('Sharp turns:', sharpTurns, '(of', geom.length, 'points)');
}).catch(e => console.error(e));
