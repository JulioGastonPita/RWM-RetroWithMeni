const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { registerHandlers } = require('./socket/handlers');
const { version } = require('./package.json');

const dev = process.env.NODE_ENV !== 'production';

if (!dev && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable must be set in production');
  process.exit(1);
}
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Set the app version for the frontend
process.env.NEXT_PUBLIC_APP_VERSION = version;

// Use Webpack instead of Turbopack in dev to avoid Windows junction point issues
// with native modules listed in serverExternalPackages (e.g. better-sqlite3)
const app = next({ dev, hostname, port, ...(dev ? { webpack: true } : {}) });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/socket.io')) return;
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const allowedOrigin = dev ? '*' : (process.env.ALLOWED_ORIGIN || 'http://localhost:3000');
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  registerHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
