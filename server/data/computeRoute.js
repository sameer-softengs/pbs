// Test: OSRM with widely-spaced waypoints that are ALL on Shahrah-e-Faisal
// Using only stops that are definitely on the main road, spaced >2km apart

const waypoints = [
  [67.1980, 24.8941], // 1. Khokrapar (start)
  [67.1610, 24.8965], // 5. Malir Halt (3.7km along road)
  [67.1218, 24.8799], // 8. Drigh Road (4.2km)
  [67.0838, 24.8700], // 11. Karsaz (3.8km)
  [67.0465, 24.8569], // 13. FTC (3.8km)
  [67.0254, 24.8568], // 16. Fawwara Chowk (2.1km)
  [66.9968, 24.8488], // 20. Tower (2.9km)
  [66.9726, 24.8368], // 22. Dockyard (2.7km)
];

const coords = waypoints.map(p => p.join(',')).join(';');
const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&continue_straight=true`;

fetch(url).then(r => r.json()).then(d => {
  if (d.code !== 'Ok') { console.log('Error:', d); return; }
  const r = d.routes[0];
  const geom = r.geometry.coordinates.map(c => [c[1], c[0]]);
  console.log(`Route: ${(r.distance/1000).toFixed(1)}km, ${geom.length} points, ${Math.round(r.duration/60)} min`);
  
  // Check distance should be 28-35km
  if (r.distance < 25000 || r.distance > 40000) {
    console.log('WARNING: Distance outside expected range (28-35km)');
  } else {
    console.log('Distance OK - within expected range');
  }
  
  // Verify all 22 stops are close to route
  const stops = [
    [24.8941,67.1980],[24.8917,67.1951],[24.8921,67.1913],[24.8948,67.1848],
    [24.8965,67.1610],[24.8906,67.1490],[24.8858,67.1366],[24.8799,67.1218],
    [24.8766,67.1049],[24.8725,67.0949],[24.8700,67.0838],[24.8610,67.0629],
    [24.8569,67.0465],[24.8534,67.0367],[24.8522,67.0315],[24.8568,67.0254],
    [24.8535,67.0185],[24.8494,67.0125],[24.8503,67.0059],[24.8488,66.9968],
    [24.8436,66.9833],[24.8368,66.9726]
  ];
  const names = [
    'Khokrapar','Saudabad','RCD Ground','Kala Board','Malir Halt','Colony Gate',
    'Nata Khan','Drigh Road','PAF Base','Laal Kothi','Karsaz','Nursery',
    'FTC','Regent Plaza','Hotel Metropole','Fawwara Chowk','Arts Council',
    'Shaheen Complex','I.I. Chundrigar','Tower','Fisheries','Dockyard'
  ];
  
  console.log('\nStop deviations from route:');
  let maxDev = 0;
  stops.forEach((s, i) => {
    let minD = Infinity, closest = 0;
    for (let j = 0; j < geom.length; j++) {
      const p = geom[j];
      const dx = (p[1] - s[1]) * 111320 * Math.cos(s[0] * Math.PI / 180);
      const dy = (p[0] - s[0]) * 110540;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minD) { minD = d; closest = j; }
    }
    if (minD > maxDev) maxDev = minD;
    const status = minD < 50 ? 'OK' : minD < 200 ? 'CLOSE' : 'FAR';
    console.log(`  ${names[i].padEnd(18)} ${minD < 1000 ? Math.round(minD)+'m' : (minD/1000).toFixed(1)+'km'} [${status}]`);
  });
  console.log(`\nMax deviation: ${Math.round(maxDev)}m`);
  
  // Simplify
  const simplified = [geom[0]];
  for (let i = 1; i < geom.length; i++) {
    const prev = simplified[simplified.length - 1];
    const cur = geom[i];
    const dx = (cur[1] - prev[1]) * 111320 * Math.cos(cur[0] * Math.PI / 180);
    const dy = (cur[0] - prev[0]) * 110540;
    if (Math.sqrt(dx * dx + dy * dy) > 50) {
      simplified.push(cur);
    }
  }
  simplified.push(geom[geom.length - 1]);
  console.log(`\nSimplified: ${simplified.length} points (from ${geom.length})`);
}).catch(e => console.error(e));
