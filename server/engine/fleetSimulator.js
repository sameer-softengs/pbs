import { calculateHaversineDistance, calculateETA } from './geoHelpers.js';

// Each route owns its fleet, so subscribing to one never changes another route.
export function createFleetSimulator(route) {
  const path=route.roadPath;
  const stops=route.stops.filter(stop=>Number.isFinite(stop.lat)&&Number.isFinite(stop.lng));
  const cumulative=[0];
  for(let i=1;i<path.length;i++)cumulative.push(cumulative[i-1]+calculateHaversineDistance(...path[i-1],...path[i]));
  const total=cumulative.at(-1);
  const ready=route.active&&path.length>1&&stops.length>1&&total>0;
  const project=stop=>{
    let best=Infinity,along=0;
    const scale=Math.cos(stop.lat*Math.PI/180);
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],dx=(b[1]-a[1])*scale,dy=b[0]-a[0],len=dx*dx+dy*dy;
      const t=len?Math.max(0,Math.min(1,((stop.lng-a[1])*scale*dx+(stop.lat-a[0])*dy)/len)):0;
      const d=calculateHaversineDistance(stop.lat,stop.lng,a[0]+t*dy,a[1]+t*(b[1]-a[1]));
      if(d<best){best=d;along=cumulative[i-1]+t*(cumulative[i]-cumulative[i-1]);}
    }
    return {...stop,along};
  };
  const routeStops=ready?stops.map(project).sort((a,b)=>a.along-b.along):[];
  const fleet=ready?[0.06,0.88,0.35,0.65].map((fraction,i)=>({id:`PBS-${route.code}-${101+i}`,direction:i%2?'down':'up',distance:fraction*total})):[];
  let previous=Date.now();
  const position=distance=>{
    let low=1,high=cumulative.length-1;
    while(low<high){const middle=(low+high)>>1;if(cumulative[middle]<distance)low=middle+1;else high=middle;}
    const i=low;
    const len=cumulative[i]-cumulative[i-1],t=len?(distance-cumulative[i-1])/len:0;
    return {lat:path[i-1][0]+t*(path[i][0]-path[i-1][0]),lng:path[i-1][1]+t*(path[i][1]-path[i-1][1])};
  };
  const state=()=>({routeId:route.id,route:route.code,terminals:{origin:route.origin,destination:route.destination},timestamp:new Date().toISOString(),buses:fleet.map(bus=>{
    const forward=bus.direction==='up';
    const nearest=routeStops.reduce((a,b)=>Math.abs(a.along-bus.distance)<Math.abs(b.along-bus.distance)?a:b);
    const next=forward?routeStops.find(s=>s.along>=bus.distance)||routeStops.at(-1):routeStops.findLast(s=>s.along<=bus.distance)||routeStops[0];
    const speed=Math.abs(nearest.along-bus.distance)<200?10:35;
    return {busId:bus.id,direction:bus.direction,directionLabel:`To ${forward?route.mappedOrigin:route.mappedDestination}`,location:position(bus.distance),speed,
      currentStop:Math.abs(nearest.along-bus.distance)<150?nearest.name:`En route to ${next.name}`,nextStop:next.name,nextStopEta:calculateETA(Math.abs(next.along-bus.distance),speed)};
  })});
  return {getState:state,step(){
    const now=Date.now(),seconds=Math.min((now-previous)/1000,5);previous=now;
    for(const bus of fleet){
      const nearest=routeStops.reduce((a,b)=>Math.abs(a.along-bus.distance)<Math.abs(b.along-bus.distance)?a:b);
      const speed=Math.abs(nearest.along-bus.distance)<200?10:35;
      bus.distance+=(bus.direction==='up'?1:-1)*speed/3.6*seconds;
      if(bus.distance>=total){bus.distance=total;bus.direction='down';}
      if(bus.distance<=0){bus.distance=0;bus.direction='up';}
    }
    return state();
  }};
}
