import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

export interface PresenceUser {
  socketId: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: string;
}

export function initSocketHub(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track room presence: assetId -> PresenceUser[]
  const roomPresence = new Map<string, PresenceUser[]>();

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // User joins video review room
    socket.on('asset:join', (data: { assetId: string; user: { id: string; name: string; avatarUrl?: string } }) => {
      const { assetId, user } = data;
      socket.join(`asset_${assetId}`);

      const newUser: PresenceUser = {
        socketId: socket.id,
        userId: user.id || socket.id,
        name: user.name || 'Anonymous Reviewer',
        avatarUrl: user.avatarUrl,
        joinedAt: new Date().toISOString(),
      };

      const existingUsers = roomPresence.get(assetId) || [];
      const updatedUsers = [...existingUsers.filter((u) => u.socketId !== socket.id), newUser];
      roomPresence.set(assetId, updatedUsers);

      // Broadcast active user list to all reviewers in room
      io.to(`asset_${assetId}`).emit('presence:update', updatedUsers);
    });

    // Broadcast new frame comment to room
    socket.on('comment:create', (data: { assetId: string; comment: any }) => {
      socket.to(`asset_${data.assetId}`).emit('comment:new', data.comment);
    });

    // Broadcast comment resolve status change
    socket.on('comment:resolve', (data: { assetId: string; commentId: string; resolved: boolean }) => {
      socket.to(`asset_${data.assetId}`).emit('comment:updated', data);
    });

    // Host Playback Sync (Host Mode)
    socket.on('playback:sync', (data: { assetId: string; action: 'play' | 'pause' | 'seek'; time: number }) => {
      socket.to(`asset_${data.assetId}`).emit('playback:sync', data);
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      for (const [assetId, users] of roomPresence.entries()) {
        const filtered = users.filter((u) => u.socketId !== socket.id);
        roomPresence.set(assetId, filtered);
        io.to(`asset_${assetId}`).emit('presence:update', filtered);
      }
    });
  });

  return io;
}
