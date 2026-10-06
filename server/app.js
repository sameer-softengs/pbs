import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { routes, routeCatalog } from './data/routes.js';
import { createFleetSimulator } from './engine/fleetSimulator.js';
import { allowedClientOrigins, createRateLimiter, isRouteId } from './security.js';

export function createTransitServer({clientUrl='http://localhost:5173'}={}) {
  const app=express();
  const origins=allowedClientOrigins(clientUrl);
  const requestLimiter=createRateLimiter();
  const connections=new Map();
  app.disable('x-powered-by');app.set('trust proxy',false);app.set('query parser','simple');
  app.use((req,res,next)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    if(req.secure)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
    if(req.headers.origin&&!origins.has(req.headers.origin))return res.status(403).json({error:'Origin not allowed'});
    const result=requestLimiter.allow(req.ip);
    if(!result.allowed){res.setHeader('Retry-After',result.retryAfter);return res.status(429).json({error:'Too many requests. Please try again shortly.'});}
    if(!['GET','HEAD','OPTIONS'].includes(req.method)){res.setHeader('Allow','GET, HEAD, OPTIONS');return res.status(405).json({error:'Method not allowed'});}
    next();
  });
  app.use(cors({origin:Array.from(origins),methods:['GET','HEAD','OPTIONS']}));
  const httpServer=createServer(app);
  httpServer.requestTimeout=15000;httpServer.headersTimeout=10000;
  const io=new Server(httpServer,{
    cors:{origin:Array.from(origins),methods:['GET','POST']},maxHttpBufferSize:16384,
    allowRequest:(req,done)=>done(null,(!req.headers.origin||origins.has(req.headers.origin))&&
      (connections.get(req.socket.remoteAddress)||0)<20),
  });
  const simulators=new Map(Array.from(routes,([id,route])=>[id,createFleetSimulator(route)]));
  const timer=setInterval(()=>{
    for(const [id,simulator]of simulators){
      if(io.sockets.adapter.rooms.get(id)?.size)io.to(id).emit('fleet_telemetry',simulator.step());
    }
  },2500);timer.unref();
  const cleanup=setInterval(()=>requestLimiter.prune(),60000);cleanup.unref();
  io.on('connection',socket=>{
    const ip=socket.conn.remoteAddress;
    connections.set(ip,(connections.get(ip)||0)+1);
    const limiter=createRateLimiter({limit:12,windowMs:10000,maxKeys:1});
    socket.on('disconnect',()=>{const remaining=(connections.get(ip)||1)-1;if(remaining)connections.set(ip,remaining);else connections.delete(ip);});
    socket.on('subscribe_route',id=>{
      if(!limiter.allow('subscribe').allowed){socket.emit('route_error',{error:'Too many route changes. Please wait a moment.'});return;}
      if(!isRouteId(id)||!routes.has(id)){socket.emit('route_error',{error:'Choose a valid Karachi route.'});return;}
      if(socket.data.routeId)socket.leave(socket.data.routeId);
      socket.data.routeId=id;socket.join(id);
      socket.emit('route_update',routes.get(id));
      socket.emit('fleet_telemetry',simulators.get(id).getState());
    });
  });
  app.get('/api/routes',(req,res)=>{res.setHeader('Cache-Control','private, max-age=300');res.json(routeCatalog);});
  app.get('/api/route',(req,res)=>res.json(routes.get('r1')));
  app.get('/api/routes/:id',(req,res)=>{
    if(!isRouteId(req.params.id))return res.status(400).json({error:'Invalid route ID'});
    const route=routes.get(req.params.id);
    if(!route)return res.status(404).json({error:'Route not found'});
    res.setHeader('Cache-Control','private, max-age=300');res.json(route);
  });
  app.get('/api/fleet',(req,res)=>{
    const id=req.query.route||'r1';
    if(!isRouteId(id))return res.status(400).json({error:'Invalid route ID'});
    const simulator=simulators.get(id);
    if(!simulator)return res.status(404).json({error:'Route not found'});
    res.setHeader('Cache-Control','no-store');res.json(simulator.getState());
  });
  app.use((req,res)=>res.status(404).json({error:'Endpoint not found'}));
  app.use((error,req,res,next)=>{
    if(res.headersSent)return next(error);
    console.error('Request failed:',error.message);
    res.status(error.status===400?400:500).json({error:error.status===400?'Invalid request':'Something went wrong. Please try again.'});
  });
  return {app,httpServer,io,async close(){clearInterval(timer);clearInterval(cleanup);await new Promise(resolve=>io.close(resolve));}};
}
