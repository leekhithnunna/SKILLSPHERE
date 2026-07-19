const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const notify = require('../utils/notify');

let io = null;

/**
 * Initializes Socket.IO on the given HTTP server.
 * Auth: client connects with `auth: { token }` (the same JWT used for REST).
 * Every authenticated socket auto-joins a `user:<id>` room so the
 * notification service can push events to a specific user from anywhere
 * in the backend without holding a live socket reference.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Not authorized'));

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    // ── Chat: join/leave a conversation room ──────────────────────────────
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Chat: send message ──────────────────────────────────────────────
    socket.on('message:send', async ({ conversationId, text, attachments }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some((p) => p.toString() === socket.userId)) {
          return callback?.({ success: false, message: 'Not authorized for this conversation' });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text || '',
          attachments: attachments || [],
          readBy: [socket.userId],
        });

        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        await message.populate('sender', 'name profileImage');

        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Sockets currently viewing this conversation shouldn't also get a
        // persisted "unread" notification — just the live message event.
        const roomSockets = await io.in(`conversation:${conversationId}`).fetchSockets();
        const viewerIds = new Set(roomSockets.map((s) => s.userId));

        for (const participantId of conversation.participants) {
          const participantIdStr = participantId.toString();
          if (participantIdStr === socket.userId) continue;

          io.to(`user:${participantIdStr}`).emit('message:notify', { conversationId, message });

          if (!viewerIds.has(participantIdStr)) {
            await notify(participantId, {
              type: 'message_received',
              title: `New message from ${message.sender.name}`,
              message: message.text?.slice(0, 100) || 'Sent an attachment',
              link: `/messages/${conversationId}`,
            });
          }
        }

        callback?.({ success: true, data: message });
      } catch (err) {
        callback?.({ success: false, message: err.message });
      }
    });

    // ── Chat: typing indicator ──────────────────────────────────────────
    socket.on('typing:start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { userId: socket.userId, conversationId });
    });

    socket.on('typing:stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId: socket.userId, conversationId });
    });

    // ── Chat: read receipts ──────────────────────────────────────────────
    socket.on('message:read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: socket.userId } },
        { $addToSet: { readBy: socket.userId } }
      );
      socket.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        userId: socket.userId,
      });
    });
  });

  return io;
};

/**
 * Returns the live Socket.IO instance so controllers/services can emit
 * events (e.g. notifications) outside of a socket event handler.
 */
const getIO = () => io;

module.exports = { initSocket, getIO };
