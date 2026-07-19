const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('./sendEmail');
const { getIO } = require('../socket');

/**
 * Creates a notification, pushes it in real time via Socket.IO, and
 * optionally emails it. Used across gigs/proposals/payments/reviews/etc.
 * so every module funnels through one consistent notification path.
 */
const notify = async (userId, { type, title, message = '', link = '', meta = {} }, { email = false } = {}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
    meta,
  });

  const io = getIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  if (email) {
    try {
      const user = await User.findById(userId).select('email name');
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: title,
          html: `<p>Hi ${user.name},</p><p>${message}</p>${
            link ? `<p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}${link}">View details</a></p>` : ''
          }`,
        });
      }
    } catch (err) {
      console.error('[notify] Failed to send email:', err.message);
    }
  }

  return notification;
};

module.exports = notify;
