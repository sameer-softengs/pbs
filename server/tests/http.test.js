import test from 'node:test';
import assert from 'node:assert/strict';
import {createTransitServer} from '../app.js';

test('API validates route input, restricts origins and returns security headers',async()=>{
  const server=createTransitServer();
  await new Promise(resolve=>server.httpServer.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.httpServer.address().port}`;
  try {
    const response=await fetch(`${base}/api/routes`,{headers:{Origin:'http://127.0.0.1:5173'}});
    assert.equal(response.status,200);
    assert.equal(response.headers.get('access-control-allow-origin'),'http://127.0.0.1:5173');
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');
    assert.equal(response.headers.get('x-frame-options'),'DENY');
    assert.equal(response.headers.get('x-powered-by'),null);
    const directory=await response.json();assert.equal(directory.length,20);
    for(const route of directory){const detail=await (await fetch(`${base}/api/routes/${route.id}`)).json();assert.equal(detail.id,route.id);assert.equal(detail.stops.length,detail.totalStops);}
    assert.equal((await fetch(`${base}/api/routes/r99`)).status,400);
    assert.equal((await fetch(`${base}/api/fleet?route=r1&route=r2`)).status,400);
    assert.equal((await fetch(`${base}/api/routes`,{method:'POST'})).status,405);
    assert.equal((await fetch(`${base}/api/routes`,{headers:{Origin:'https://untrusted.example'}})).status,403);
    assert.equal((await fetch(`${base}/socket.io/?EIO=4&transport=polling`,{headers:{Origin:'https://untrusted.example'}})).status,403);
    assert.equal((await fetch(`${base}/missing`)).status,404);
  } finally {await server.close();}
});
test('API rate limit returns Retry-After and does not leak errors',async()=>{
  const server=createTransitServer();
  await new Promise(resolve=>server.httpServer.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.httpServer.address().port}`;
  try {
    let response;
    for(let i=0;i<121;i++)response=await fetch(`${base}/api/fleet`);
    assert.equal(response.status,429);assert(Number(response.headers.get('retry-after'))>0);
    const body=await response.json();assert.equal(typeof body.error,'string');assert(!('stack' in body));
  } finally {await server.close();}
});
