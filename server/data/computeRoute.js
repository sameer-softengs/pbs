import { readFileSync, writeFileSync } from 'node:fs';
import { route1Data } from './route1data.js';
import { snapStopsToRoute } from '../engine/geoHelpers.js';

const file = new URL('./route1-road.json', import.meta.url);
const saved = JSON.parse(readFileSync(file, 'utf8'));
const anchors = saved.routingAnchors;
const coords = anchors.map(({ stopIndex }) => {
  const stop = route1Data[stopIndex];
  return `${stop.lng},${stop.lat}`;
}).join(';');
const params = new URLSearchParams({
  overview: 'full', geometries: 'geojson', steps: 'false',
  continue_straight: 'true',
  bearings: anchors.map(({ bearing }) => `${bearing},20`).join(';'),
  radiuses: anchors.map(() => '300').join(';'),
});
const response = await fetch(`${saved.geometrySource}/route/v1/driving/${coords}?${params}`, {
  signal: AbortSignal.timeout(45000),
});
if (!response.ok) throw new Error(`Routing service returned ${response.status}`);
const data = await response.json();
if (data.code !== 'Ok' || !data.routes?.length) throw new Error(`Routing failed: ${data.code}`);
const route = data.routes[0];
if (route.distance < 27000 || route.distance > 34000) throw new Error('Unexpected R1 corridor distance');
const path = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]).reverse();
snapStopsToRoute(route1Data, path);
writeFileSync(file, JSON.stringify({
  ...saved, generatedAt: new Date().toISOString().slice(0, 10),
  distanceKm: Math.round(route.distance) / 1000, path,
}, null, 2) + '\n');
console.log(`Saved ${path.length} points, ${(route.distance / 1000).toFixed(1)} km`);
