export function calculateHaversineDistance(lat1, lon1, lat2, lon2){
    const R = 6371e3;
    const rad = Math.PI / 180;
    const dlat = (lat2 - lat1) * rad;
    const dlon = (lon2 - lon1) * rad;

    const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R*c;
}

export function calculateETA(distance, speed) {
    if(speed <= 0) return "delayed";
    const hours = (distance/1000) / speed;
    const mins = Math.ceil(hours * 60);
    return mins <= 1? "Arriving": `${mins}mins`;
}

export function snapStopsToRoute(stops, roadPath) {
  if (!roadPath || roadPath.length < 2) return stops;

  return stops.map(stop => {
    let bestDist = Infinity;
    let bestPoint = null;

    const lngScale = Math.cos(stop.lat * Math.PI / 180);
    for (let i = 0; i < roadPath.length - 1; i++) {
      const start = roadPath[i];
      const end = roadPath[i + 1];
      const dx = (end[1] - start[1]) * lngScale;
      const dy = end[0] - start[0];
      const lengthSquared = dx * dx + dy * dy;
      const fraction = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
        (((stop.lng - start[1]) * lngScale) * dx + (stop.lat - start[0]) * dy) / lengthSquared));
      const point = [start[0] + fraction * dy, start[1] + fraction * (end[1] - start[1])];
      const d = calculateHaversineDistance(stop.lat, stop.lng, point[0], point[1]);
      if (d < bestDist) {
        bestDist = d;
        bestPoint = point;
      }
    }

    // Reject unrelated corridors instead of silently moving a stop across town.
    if (bestDist > 250) throw new Error(`R1 stop ${stop.name} is ${Math.round(bestDist)}m from its road route`);
    return { ...stop, lat: bestPoint[0], lng: bestPoint[1] };
  });
}
