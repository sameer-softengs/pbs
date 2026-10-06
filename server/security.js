export function isRouteId(value) {
  return typeof value === 'string' && /^(r(?:[1-9]|1[0-4])|ev[1-5]|dd1)$/.test(value);
}
export function allowedClientOrigins(clientUrl) {
  const url=new URL(clientUrl);
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('CLIENT_URL must be a plain HTTP(S) origin');
  const origins=new Set([url.origin]);
  if(['localhost','127.0.0.1'].includes(url.hostname)){
    url.hostname=url.hostname==='localhost'?'127.0.0.1':'localhost';origins.add(url.origin);
  }
  return origins;
}
export function createRateLimiter({limit=120,windowMs=60000,maxKeys=5000}={}) {
  const entries=new Map();
  return {allow(key,now=Date.now()){
    let entry=entries.get(key);
    if(!entry||now-entry.start>=windowMs){
      if(!entry&&entries.size>=maxKeys)entries.delete(entries.keys().next().value);
      entry={start:now,count:0};entries.set(key,entry);
    }
    entry.count++;
    return {allowed:entry.count<=limit,retryAfter:Math.max(1,Math.ceil((entry.start+windowMs-now)/1000))};
  },prune(now=Date.now()){for(const [key,entry]of entries)if(now-entry.start>=windowMs)entries.delete(key);},get size(){return entries.size;}};
}
