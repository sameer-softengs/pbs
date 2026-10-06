import test from 'node:test';
import assert from 'node:assert/strict';
import {routes} from '../data/routes.js';
import {route1Data} from '../data/route1data.js';
import {createFleetSimulator} from '../engine/fleetSimulator.js';
import {allowedClientOrigins,createRateLimiter,isRouteId} from '../security.js';

test('route directory retains published coordinates and isolates fleets',()=>{
  assert.equal(routes.size,20);
  assert.deepEqual(routes.get('r1').stops,route1Data);
  for(const [id,route]of routes){
    const simulator=createFleetSimulator(route);
    const state=simulator.step();
    assert.equal(state.routeId,id);
    assert.equal(state.buses.length,route.active&&route.geometryAvailable?4:0);
    for(const bus of state.buses){
      assert(bus.busId.startsWith(`PBS-${route.code}-`));
      assert(Number.isFinite(bus.location.lat)&&Number.isFinite(bus.location.lng));
      assert(route.stops.some(stop=>stop.name===bus.nextStop));
      assert.equal(bus.directionLabel,`To ${bus.direction==='up'?route.mappedOrigin:route.mappedDestination}`);
    }
  }
  const a=createFleetSimulator(routes.get('r1')),b=createFleetSimulator(routes.get('r2'));
  b.step();assert(a.getState().buses.every(bus=>bus.busId.startsWith('PBS-R1-')));
});
test('R1 UP heads toward Khokhrapar and DOWN toward Dockyard',()=>{
  const buses=createFleetSimulator(routes.get('r1')).getState().buses;
  assert.equal(buses.filter(bus=>bus.direction==='up').length,2);
  assert.equal(buses.filter(bus=>bus.direction==='down').length,2);
  for(const bus of buses)assert.equal(bus.directionLabel,bus.direction==='up'?'To Khokhrapar':'To Dockyard');
});
test('reverse published routes align with the directory terminal direction',()=>{
  assert.equal(routes.get('r13').stops[0].name,'Hawksbay Beach');
  assert.equal(routes.get('ev5').stops[0].name,'DHA City Karachi');
});
test('rejects invalid route input and unsafe client origins',()=>{
  for(const value of [null,{},['r1'],'../r1','r1<script>','r99','ev9','R1'])assert.equal(isRouteId(value),false);
  assert(isRouteId('r1')&&isRouteId('ev5'));
  assert.deepEqual([...allowedClientOrigins('http://localhost:5173')],['http://localhost:5173','http://127.0.0.1:5173']);
  for(const value of ['javascript:alert(1)','https://user:pass@example.com','https://example.com/path','https://example.com/?x=1'])assert.throws(()=>allowedClientOrigins(value));
});
test('rate limiter expires entries and bounds memory',()=>{
  const limiter=createRateLimiter({limit:2,windowMs:1000,maxKeys:2});
  assert(limiter.allow('a',0).allowed);assert(limiter.allow('a',1).allowed);
  assert.equal(limiter.allow('a',2).allowed,false);assert(limiter.allow('a',1001).allowed);
  limiter.allow('b',1002);limiter.allow('c',1003);assert.equal(limiter.size,2);
  limiter.prune(3000);assert.equal(limiter.size,0);
});
