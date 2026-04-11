const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3002 });

console.log('WebSocket server running on ws://localhost:3002');

// Export active connection count for metrics
module.exports.getActiveConnections = () => wss.clients.size;

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connected',
    timestamp: Date.now(),
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (err) {
      console.error('WebSocket message error:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

// Export for use in main server
module.exports = wss;
