// Refresh road reconstructions for the downloaded stop directories.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { calculateHaversineDistance } from '../../engine/geoHelpers.js';
const folder = new URL('./', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('catalog.json', folder)));
const distance = (a,b) => calculateHaversineDistance(a.lat,a.lng,b.lat,b.lng);
const bearing = (a,b) => (Math.atan2((b.lng-a.lng)*Math.cos(a.lat*Math.PI/180),b.lat-a.lat)*180/Math.PI+360)%360;
const files = readdirSync(folder).filter(file => /^(r\d+|ev\d+)\.json$/.test(file) && (!process.env.ROUTE_IDS || process.env.ROUTE_IDS.split(',').includes(file.replace('.json',''))));
async function build(file) {
  const target = new URL(file,folder);
  const data = JSON.parse(readFileSync(target));
  const stops = data.stops;
  const route = catalog.find(r=>`${r.id}.json`===file);
  const anchors = [0];
  let accumulated=0;
  for(let i=1;i<stops.length-1;i++) {
    accumulated+=distance(stops[i-1],stops[i]);
    const turn=Math.abs(((bearing(stops[Math.max(0,i-2)],stops[i])-bearing(stops[i],stops[Math.min(stops.length-1,i+2)])+540)%360)-180);
    if(accumulated>2500 || (turn>55 && accumulated>600)) { anchors.push(i);accumulated=0; }
  }
  anchors.push(stops.length-1);
  if (process.env.ALL_STOPS === "1") { anchors.splice(0, anchors.length, ...stops.map((_,i)=>i)); }
  const coords=anchors.map(i=>`${stops[i].lng},${stops[i].lat}`).join(';');
  const params=new URLSearchParams({overview:'full',geometries:'geojson',continue_straight:'true',
    bearings:anchors.map(i=>`${Math.round(i===stops.length-1?bearing(stops[i-1],stops[i]):bearing(stops[i],stops[Math.min(i+2,stops.length-1)]))},45`).join(';'),
    radiuses:anchors.map(()=>'500').join(';')});
  try {
    const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?${params}`,{signal:AbortSignal.timeout(45000)});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const result=await response.json();
    if(result.code!=='Ok')throw new Error(result.code);
    const road=result.routes[0];
    if(road.distance<5000 || road.distance>route.officialDistanceKm*1800)throw new Error('Unexpected road distance');
    const path=road.geometry.coordinates.map(([lng,lat])=>[lat,lng]).reverse();
    let maxOffset=0;
    for(const stop of stops) {
      let best=Infinity;
      const scale=Math.cos(stop.lat*Math.PI/180);
      for(let i=0;i<path.length-1;i++) {
        const a=path[i],b=path[i+1];
        const dx=(b[1]-a[1])*scale,dy=b[0]-a[0],len=dx*dx+dy*dy;
        const t=len?Math.max(0,Math.min(1,((stop.lng-a[1])*scale*dx+(stop.lat-a[0])*dy)/len)):0;
        best=Math.min(best,calculateHaversineDistance(stop.lat,stop.lng,a[0]+t*dy,a[1]+t*(b[1]-a[1])));
      }
      maxOffset=Math.max(maxOffset,best);
    }
    if(maxOffset>600)throw new Error(`Stops ${Math.round(maxOffset)}m from reconstruction`);
    writeFileSync(target,JSON.stringify({...data,path,source:'road-reconstruction',distanceKm:road.distance/1000,maxStopOffsetMeters:Math.round(maxOffset),generatedAt:new Date().toISOString().slice(0,10)},null,2)+'\n');
    console.log(route.code,'saved',Math.round(road.distance/100)/10,'km;',stops.length,'stops; maximum offset',Math.round(maxOffset),'m');
  } catch(error) { console.log(route.code,'stop-map only:',error.message); }
}
for(let i=0;i<files.length;i+=3) await Promise.all(files.slice(i,i+3).map(build));
