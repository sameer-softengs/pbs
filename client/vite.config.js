import { randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const policy="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://tile.openstreetmap.org; connect-src 'self' http://localhost:4000 http://127.0.0.1:4000 ws://localhost:* ws://127.0.0.1:*; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
const headers={
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':policy,
};
const placeholder='__PBS_DEVELOPMENT_NONCE__';
function developmentNonce(){
  return {name:'pbs-development-csp',apply:'serve',configureServer(server){
    server.middlewares.use((req,res,next)=>{
      const nonce=randomBytes(16).toString('base64');
      const end=res.end;
      res.end=function(chunk,...args){
        if(chunk&&String(res.getHeader('Content-Type')).includes('text/html')&&!res.headersSent){
          const html=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);
          chunk=html.replaceAll(placeholder,nonce);
          res.removeHeader('Content-Length');
          res.setHeader('Cache-Control','no-store');
          res.setHeader('Content-Security-Policy',policy.replace("script-src 'self'",`script-src 'self' 'nonce-${nonce}'`));
        }
        return end.call(this,chunk,...args);
      };
      next();
    });
  }};
}
export default defineConfig(({command})=>({
  plugins:[react(),developmentNonce()],
  html:command==='serve'?{cspNonce:placeholder}:undefined,
  server:{host:'127.0.0.1',port:5173,strictPort:true,headers},
  preview:{host:'127.0.0.1',headers},
}));
