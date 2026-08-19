import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const lines = readFileSync(envPath, 'utf8').split('\n');
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return env;
  } catch { return {}; }
}

const env = loadEnv();
const OSM_WAY_ID = env.OSM_WAY_ID || '1550864977';

const FALLBACK_PATH = [
  [24.8941,67.1980],[24.8917,67.1951],[24.8921,67.1913],[24.8948,67.1848],
  [24.8958,67.1750],[24.8965,67.1610],[24.8935,67.1550],[24.8906,67.1490],
  [24.8880,67.1430],[24.8858,67.1366],[24.8830,67.1300],[24.8799,67.1218],
  [24.8780,67.1130],[24.8766,67.1049],[24.8745,67.1000],[24.8725,67.0949],
  [24.8712,67.0890],[24.8700,67.0838],[24.8655,67.0730],[24.8610,67.0629],
  [24.8590,67.0550],[24.8569,67.0465],[24.8550,67.0420],[24.8534,67.0367],
  [24.8522,67.0315],[24.8530,67.0290],[24.8545,67.0270],[24.8568,67.0254],
  [24.8555,67.0220],[24.8535,67.0185],[24.8515,67.0155],[24.8494,67.0125],
  [24.8498,67.0090],[24.8503,67.0059],[24.8495,67.0000],[24.8488,66.9968],
  [24.8462,66.9900],[24.8436,66.9833],[24.8400,66.9780],[24.8368,66.9726],
];

function simplifyPath(points, minDistMeters = 30) {
  if (points.length <= 2) return points;
  const simplified = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = simplified[simplified.length - 1];
    const cur = points[i];
    const dx = (cur[1] - prev[1]) * 111320 * Math.cos(cur[0] * Math.PI / 180);
    const dy = (cur[0] - prev[0]) * 110540;
    if (Math.sqrt(dx * dx + dy * dy) > minDistMeters) {
      simplified.push(cur);
    }
  }
  simplified.push(points[points.length - 1]);
  return simplified;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalDistanceKm(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return total / 1000;
}

async function fetchWayNodes(wayId) {
  const url = `https://www.openstreetmap.org/api/0.6/way/${wayId}.json`;
  console.log(`Fetching OSM Way ${wayId} metadata...`);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`OSM API way returned ${res.status}`);
  const data = await res.json();
  const way = data.elements?.[0];
  if (!way || !way.nodes || way.nodes.length === 0) {
    throw new Error(`Way ${wayId} not found or has no nodes`);
  }
  return way.nodes;
}

async function fetchNodeCoords(nodeIds) {
  const ids = nodeIds.join(',');
  const url = `https://www.openstreetmap.org/api/0.6/nodes?nodes=${ids}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`OSM API nodes returned ${res.status}`);
  const data = await res.json();
  return data.elements;
}

async function fetchOSMApiWay(wayId) {
  const nodeIds = await fetchWayNodes(wayId);
  console.log(`Way ${wayId} has ${nodeIds.length} nodes`);

  const nodes = await fetchNodeCoords(nodeIds);
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const path = nodeIds
    .map(id => nodeMap.get(id))
    .filter(n => n != null)
    .map(n => [n.lat, n.lon]);

  if (path.length === 0) throw new Error('No valid coordinates found for way nodes');

  const distance = totalDistanceKm(path);

  console.log(`OSM Way ${wayId}: ${distance.toFixed(1)}km, ${path.length} points`);
  return { path, source: `osm-way-${wayId}`, distance };
}

async function fetchOverpassWay(wayId) {
  const query = `[out:json][timeout:25];way(${wayId});out geom;`;
  const url = `https://overpass-api.de/api/interpreter`;

  console.log(`Trying Overpass API for Way ${wayId}...`);
  const res = await fetch(url, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Overpass API returned ${res.status}`);

  const data = await res.json();
  const way = data.elements?.find(e => e.type === 'way');
  if (!way || !way.geometry || way.geometry.length === 0) {
    throw new Error(`Way ${wayId} not found in Overpass response`);
  }

  const path = way.geometry.map(node => [node.lat, node.lon]);
  const distance = totalDistanceKm(path);

  console.log(`Overpass Way ${wayId}: ${distance.toFixed(1)}km, ${path.length} points`);
  return { path, source: `osm-way-${wayId}`, distance };
}

export async function fetchRoadPath() {
  try {
    const result = await fetchOverpassWay(OSM_WAY_ID);
    return result;
  } catch (err) {
    console.error(`Overpass failed: ${err.message}`);
  }

  try {
    const result = await fetchOSMApiWay(OSM_WAY_ID);
    return result;
  } catch (err) {
    console.error(`OSM API failed: ${err.message}`);
  }

  console.log('Using fallback static path');
  return { path: FALLBACK_PATH, source: 'fallback', distance: totalDistanceKm(FALLBACK_PATH) };
}
