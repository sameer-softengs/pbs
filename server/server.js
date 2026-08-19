import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { route1Data } from './data/route1data.js';
import { getFleetState, stepSimulation, setRoadPath, setStops } from './engine/fleetSimulator.js';
import { fetchRoadPath } from './engine/roadPath.js';
import { snapStopsToRoute } from './engine/geoHelpers.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:${PORT}`;

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com data:; connect-src 'self' ws: wss:; frame-ancestors 'none';");
  next();
});

app.use(cors({ origin: CLIENT_URL }));

const rateLimit = new Map();
const RATE_WINDOW = 10000;
const RATE_MAX = 30;

app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimit.set(ip, { start: now, count: 1 });
    return next();
  }
  entry.count++;
  if (entry.count > RATE_MAX) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

let roadPathData = { path: [], source: 'loading' };

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] }
});

let snappedStops = route1Data;

fetchRoadPath().then(result => {
  roadPathData = result;
  setRoadPath(result.path);
  snappedStops = snapStopsToRoute(route1Data, result.path);
  setStops(snappedStops);
  console.log(`Road path loaded: ${result.source}${result.distance ? ' (' + result.distance.toFixed(1) + 'km)' : ''}`);
  console.log(`Stops snapped to route: ${snappedStops.length} stops`);
  io.emit("route_update", {
    totalStops: snappedStops.length,
    stops: snappedStops,
    roadPath: roadPathData.path,
    roadPathSource: roadPathData.source,
  });
});

setInterval(() => {
  io.emit("fleet_telemetry", stepSimulation());
}, 2500);

io.on("connection", (socket) => {
  socket.emit("fleet_telemetry", stepSimulation());
  if (roadPathData.path.length > 0) {
    socket.emit("route_update", {
      totalStops: snappedStops.length,
      stops: snappedStops,
      roadPath: roadPathData.path,
      roadPathSource: roadPathData.source,
    });
  }
});

app.get('/api/route', (req, res) => {
  res.json({
    totalStops: snappedStops.length,
    stops: snappedStops,
    roadPath: roadPathData.path,
    roadPathSource: roadPathData.source,
  });
});

app.get('/api/fleet', (req, res) => {
  res.json(getFleetState());
});

httpServer.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
