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

    for (const point of roadPath) {
      const d = calculateHaversineDistance(stop.lat, stop.lng, point[0], point[1]);
      if (d < bestDist) {
        bestDist = d;
        bestPoint = point;
      }
    }

    return { ...stop, lat: bestPoint[0], lng: bestPoint[1] };
  });
}