const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config();

const http = require('http');
const connectDB = require('./config/db');
const app = require('./app');
const { initSocket } = require('./socket');
const { startDeadlineReminderJob } = require('./jobs/deadlineReminderJob');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start server
const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  startDeadlineReminderJob();

  server.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`
    );
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
