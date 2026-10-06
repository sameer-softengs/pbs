import { existsSync, readFileSync } from 'node:fs';
import { route1Data } from './route1data.js';
const read = relative => JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'));
const entries = read('./routes/catalog.json');
const r1 = read('./route1-road.json');
function closestIndex(path, stop) {
  let best=Infinity,index=0;
  path.forEach((p,i)=>{const d=(p[0]-stop.lat)**2+(p[1]-stop.lng)**2;if(d<best){best=d;index=i;}});
  return index;
}
export const routes = new Map(entries.map(entry=>{
  let data={stops:[],path:[],distanceKm:0,source:'directory'};
  if(entry.id==='r1') data={...r1,stops:route1Data};
  else if(entry.id==='dd1') {
    const stops=route1Data.slice(3,42);
    const path=r1.path.slice(closestIndex(r1.path,stops.at(-1)),closestIndex(r1.path,stops[0])+1);
    data={stops,path,distanceKm:entry.officialDistanceKm,source:'shared-r1-corridor'};
  } else {
    const file=new URL(`./routes/${entry.id}.json`,import.meta.url);
    if(existsSync(file))data=JSON.parse(readFileSync(file,'utf8'));
  }
  // Normalize published reverse listings to outer terminal -> city terminal.
  if(['r13','ev5'].includes(entry.id)){data.stops.reverse();data.path.reverse();}
  const mapped=data.stops.length>1;
  const stops=mapped?data.stops:entry.areas.map((name,i)=>({id:`${entry.code}_${i}`,name}));
  const roadPath=data.path||[];
  return [entry.id,{
    ...entry,stops,totalStops:stops.length,roadPath,roadPathSource:data.source,
    distanceKm:data.distanceKm||entry.officialDistanceKm,
    mapAvailable:mapped,geometryAvailable:roadPath.length>1,
    mappedOrigin:mapped?stops[0].name:null,mappedDestination:mapped?stops.at(-1).name:null,
    note: entry.id==='r9'?'Published stop coverage includes Port Grand beyond Tower.':entry.id==='r12'?'Published stop variant: Khokhrapar No.5 to Lines Area, via Lucky Star.':
      entry.id==='ev3'?'Published stop coverage starts at Check Post 5 Malir Cantt.':
      !mapped?'Area directory only. Detailed stop coordinates are not available for this route.':
      roadPath.length<2?'Published stops are mapped. A checked road reconstruction is not available yet.':'',
  }];
}));
export const routeCatalog=Array.from(routes.values()).map(({stops,roadPath,...route})=>route);
