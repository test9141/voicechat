import express from 'express';
import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const app = express();
const server: Server = app.listen(9060);
const wss = new WebSocketServer({ port: 9061 });

interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
}

const rooms: { [key: string]: Set<ExtendedWebSocket> } = {};

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (_, res) => {
  res.redirect(`/${randomUUID()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

wss.on('connection', function connection(ws: ExtendedWebSocket) {
  ws.on('error', console.error);

  ws.on('message', function message(data: string) {
    const { event, roomId, userId } = JSON.parse(data.toString());
    console.log(event, roomId, userId);

    if (event === 'join-room') {
      ws.roomId = roomId;

      if (!rooms[roomId]) rooms[roomId] = new Set();
      rooms[roomId].add(ws);

      rooms[roomId].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ event: 'user-connected', id: userId }));
        }
      });

      ws.on('close', () => {
        if (ws.roomId && rooms[ws.roomId]) {
          rooms[ws.roomId].forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ event: 'user-disconnected', id: userId }));
            }
          });
          rooms[ws.roomId].delete(ws);
        }
      });
    }
  });
});   
