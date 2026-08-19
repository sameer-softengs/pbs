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
  [24.8429864,66.9775646],[24.8488943,66.9813292],[24.8490651,66.983686],
  [24.849613,66.9890886],[24.8464175,66.9912806],[24.8456163,66.9913256],
  [24.8448444,66.9918065],[24.8449885,66.9927583],[24.8456571,66.9930445],
  [24.8464556,66.9930628],[24.8475005,66.9947553],[24.8476101,66.9949014],
  [24.8480405,66.9953028],[24.8486959,66.9966922],[24.8493803,67.0040366],
  [24.8499896,67.0100285],[24.8505763,67.0160789],[24.8508198,67.0186893],
  [24.8496441,67.0205782],[24.8502851,67.0211465],[24.8536984,67.0276902],
  [24.8536379,67.0281274],[24.8498099,67.0305009],[24.8504547,67.0317145],
  [24.8513188,67.0322369],[24.8519618,67.0332875],[24.8525685,67.0345476],
  [24.8528341,67.0348496],[24.8544947,67.0357616],[24.8549784,67.0363501],
  [24.8553558,67.0383712],[24.8567843,67.0431037],[24.8571562,67.0445025],
  [24.8571701,67.0463419],[24.8577824,67.0485048],[24.8595007,67.0530441],
  [24.8596826,67.0541566],[24.859689,67.059803],[24.8607848,67.064973],
  [24.8632532,67.0733319],[24.8644609,67.0758738],[24.8671147,67.0830386],
  [24.8722264,67.0916857],[24.8735318,67.0933526],[24.8744878,67.0949393],
  [24.8751905,67.0972958],[24.8762765,67.1011428],[24.8778895,67.1044474],
  [24.8828256,67.1135642],[24.8853048,67.1191255],[24.8867931,67.1242804],
  [24.8870684,67.1280883],[24.8872529,67.1334216],[24.8869371,67.1389767],
  [24.8869035,67.1502626],[24.8868905,67.1633008],[24.885499,67.1679407],
  [24.8848109,67.1734307],[24.8845625,67.1749976],[24.884887,67.1754123],
  [24.8888663,67.1768149],[24.8906955,67.1773962],[24.9118789,67.1848603],
  [24.9120794,67.1849458],[24.9122495,67.185238],[24.9123479,67.1857336],
  [24.9120608,67.1981057],
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
