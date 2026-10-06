import { readFileSync } from 'node:fs';

// Checked-in OSM geometry avoids runtime routing outages. A single OSM way
// cannot describe this multi-road bus corridor.
export async function fetchRoadPath() {
  const route = JSON.parse(readFileSync(new URL('../data/route1-road.json', import.meta.url), 'utf8'));
  if (route.path.length < 2 || !route.path.every(point =>
    point.length === 2 && point.every(Number.isFinite))) {
    throw new Error('Invalid R1 road geometry');
  }
  return { path: route.path, source: route.source, distance: route.distanceKm };
}
