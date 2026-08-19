import { route1Data } from "../data/route1data.js";
import { calculateHaversineDistance, calculateETA } from "./geoHelpers.js";

let STOPS = route1Data;

let roadPath = [];
let segments = [];
let totalRouteLength = 0;

function buildSegmentIndex(path) {
  if (!path || path.length < 2) return [];
  const segs = [];
  let cumulative = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const len = calculateHaversineDistance(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
    segs.push({
      startIdx: i,
      endIdx: i + 1,
      startDist: cumulative,
      endDist: cumulative + len,
      length: len,
    });
    cumulative += len;
  }
  return segs;
}

export function setRoadPath(path) {
  roadPath = path;
  segments = buildSegmentIndex(path);
  totalRouteLength = segments.length > 0 ? segments[segments.length - 1].endDist : 0;
  console.log(`Fleet simulator: ${segments.length} segments, ${totalRouteLength.toFixed(0)}m total`);
  initializeBusPositions();
}

export function setStops(stops) {
  STOPS = stops;
  console.log(`Fleet simulator: ${STOPS.length} stops loaded`);
}

function getPointAtDistance(distanceMeters) {
  if (segments.length === 0) return { lat: 0, lng: 0, segmentIndex: 0 };

  const d = ((distanceMeters % totalRouteLength) + totalRouteLength) % totalRouteLength;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (d >= seg.startDist && d <= seg.endDist) {
      const segFrac = seg.length > 0 ? (d - seg.startDist) / seg.length : 0;
      const p1 = roadPath[seg.startIdx];
      const p2 = roadPath[seg.endIdx];
      return {
        lat: p1[0] + (p2[0] - p1[0]) * segFrac,
        lng: p1[1] + (p2[1] - p1[1]) * segFrac,
        segmentIndex: i,
      };
    }
  }

  const last = roadPath[roadPath.length - 1];
  return { lat: last[0], lng: last[1], segmentIndex: segments.length - 1 };
}

let fleet = [
  {
    id: "PBS-R1-101",
    direction: "down",
    label: "To Model Colony",
    distanceAlongRoute: 0,
    color: "#e74c3c",
    speedKmh: 35,
  },
  {
    id: "PBS-R1-102",
    direction: "up",
    label: "To Dockyard",
    distanceAlongRoute: 0,
    color: "#2ecc71",
    speedKmh: 35,
  },
  {
    id: "PBS-R1-103",
    direction: "down",
    label: "To Model Colony",
    distanceAlongRoute: 0,
    color: "#3498db",
    speedKmh: 32,
  },
  {
    id: "PBS-R1-104",
    direction: "up",
    label: "To Dockyard",
    distanceAlongRoute: 0,
    color: "#f39c12",
    speedKmh: 38,
  },
];

function initializeBusPositions() {
  if (totalRouteLength === 0) return;
  fleet[0].distanceAlongRoute = 0;
  fleet[1].distanceAlongRoute = totalRouteLength * 0.9;
  fleet[2].distanceAlongRoute = totalRouteLength * 0.33;
  fleet[3].distanceAlongRoute = totalRouteLength * 0.66;
}

const STOP_RADIUS_METERS = 200;
const SIMULATION_STEP_MS = 2500;

function findNearestStop(lat, lng) {
  let minDist = Infinity;
  let nearestStop = null;
  for (const stop of STOPS) {
    const d = calculateHaversineDistance(lat, lng, stop.lat, stop.lng);
    if (d < minDist) {
      minDist = d;
      nearestStop = stop;
    }
  }
  return { stop: nearestStop, distance: minDist };
}

function getCurrentStopName(lat, lng) {
  const { stop, distance } = findNearestStop(lat, lng);
  if (distance < STOP_RADIUS_METERS) {
    return stop.name;
  }
  return `En route to ${stop.name}`;
}

function getSpeedForLocation(lat, lng) {
  const { stop, distance } = findNearestStop(lat, lng);
  if (distance < STOP_RADIUS_METERS * 2) return 10;
  if (stop.name.includes("Nata Khan") || stop.name.includes("Drigh Road") || stop.name.includes("Karsaz")) return 20;
  if (stop.name.includes("Tower") || stop.name.includes("Fawwara") || stop.name.includes("I.I. Chundrigar")) return 15;
  return 40;
}

export function stepSimulation() {
  const updatedBuses = fleet.map(bus => {
    const speedMps = (bus.speedKmh * 1000) / 3600;
    const distanceToTravel = speedMps * (SIMULATION_STEP_MS / 1000);

    if (bus.direction === "down") {
      bus.distanceAlongRoute += distanceToTravel;
    } else {
      bus.distanceAlongRoute -= distanceToTravel;
    }

    // Wrap around
    if (bus.distanceAlongRoute >= totalRouteLength) {
      bus.distanceAlongRoute = 0;
    } else if (bus.distanceAlongRoute < 0) {
      bus.distanceAlongRoute = totalRouteLength;
    }

    const pos = getPointAtDistance(bus.distanceAlongRoute);
    const speed = getSpeedForLocation(pos.lat, pos.lng);
    const currentStopName = getCurrentStopName(pos.lat, pos.lng);
    bus.speedKmh = speed;

    // Find nearest stop to determine position on route
    let nearestStopIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < STOPS.length; i++) {
      const d = calculateHaversineDistance(pos.lat, pos.lng, STOPS[i].lat, STOPS[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestStopIdx = i;
      }
    }

    // Find next stop ahead in the direction of travel
    let nextStop;
    if (bus.direction === "down") {
      // To Model Colony: next stop is towards start of STOPS array
      nextStop = STOPS[nearestStopIdx - 1] || STOPS[0];
    } else {
      // To Dockyard: next stop is towards end of STOPS array
      nextStop = STOPS[nearestStopIdx + 1] || STOPS[STOPS.length - 1];
    }

    const distToNext = nextStop
      ? calculateHaversineDistance(pos.lat, pos.lng, nextStop.lat, nextStop.lng)
      : 0;
    const eta = calculateETA(distToNext, speed);

    return {
      busId: bus.id,
      direction: bus.direction,
      directionLabel: bus.label,
      color: bus.color,
      location: { lat: pos.lat, lng: pos.lng },
      currentStop: currentStopName,
      nextStop: nextStop ? nextStop.name : "Terminus",
      speed: speed,
      nextStopEta: eta,
    };
  });

  return getFleetState(updatedBuses);
}

export function getFleetState(buses = fleet) {
  return {
    route: "Peoples Bus Service - Route 1",
    terminals: { origin: "Model Colony", destination: "Dockyard" },
    buses,
    timestamp: new Date().toISOString(),
  };
}
