import { createTransitServer } from './app.js';
const port=Number(process.env.PORT||4000);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535');
const server=createTransitServer({clientUrl:process.env.CLIENT_URL||'http://localhost:5173'});
server.httpServer.on('error',error=>{console.error(`Unable to start server: ${error.code||error.message}`);process.exitCode=1;});
server.httpServer.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Karachi transit API running at http://localhost:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close().then(()=>{process.exitCode=0;}));
