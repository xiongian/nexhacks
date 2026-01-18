const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store active camera streams
  const cameraStreams = new Map();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Camera device connects and starts streaming
    socket.on('camera:register', () => {
      console.log('Camera device registered:', socket.id);
      socket.join('camera-stream');
      cameraStreams.set(socket.id, socket);
      
      // Notify all dashboard clients that a camera is available
      io.to('dashboard').emit('camera:available', { cameraId: socket.id });
    });

    // Dashboard connects and listens for streams
    socket.on('dashboard:register', () => {
      console.log('Dashboard registered:', socket.id);
      socket.join('dashboard');
      
      // Notify if camera is already available
      if (cameraStreams.size > 0) {
        const cameraId = Array.from(cameraStreams.keys())[0];
        socket.emit('camera:available', { cameraId });
      }
    });

    // Camera sends video frame
    socket.on('camera:frame', (data) => {
      // Broadcast to all dashboard clients
      socket.to('dashboard').emit('dashboard:frame', data);
    });

    // Camera sends video stream metadata
    socket.on('camera:stream-ready', (data) => {
      socket.to('dashboard').emit('dashboard:stream-ready', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      cameraStreams.delete(socket.id);
      
      if (socket.rooms.has('camera-stream')) {
        // Camera disconnected, notify dashboards
        io.to('dashboard').emit('camera:disconnected');
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server running on port ${port}`);
  });
});
