import { createTransitServer } from './app.js';

const port = Number(process.env.PORT || 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be between 1 and 65535');
}

const clientUrl =
  process.env.CLIENT_URL ||
  'http://localhost:5173';

const host =
  process.env.HOST ||
  '0.0.0.0';

const server = createTransitServer({
  clientUrl
});

server.httpServer.on('error', error => {
  console.error(
    `Unable to start server: ${error.code || error.message}`
  );

  process.exitCode = 1;
});

server.httpServer.listen(port, host, () => {
  console.log(`Karachi transit API running on port ${port}`);
  console.log(`Allowed client URL: ${clientUrl}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    try {
      console.log(`${signal} received. Closing server...`);

      await server.close();

      console.log('Server closed successfully.');
      process.exitCode = 0;
    } catch (error) {
      console.error(
        'Error while closing server:',
        error
      );

      process.exitCode = 1;
    }
  });
}