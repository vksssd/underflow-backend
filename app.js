const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./config/logger');
const securityMiddleware = require('./middleware/securityMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const questionRoutes = require('./app/routes/questionRoute');
const database = require('./config/database');

const app = express();
app.use(bodyParser.json());

// Set up security middleware
securityMiddleware(app);

// Set up routes
app.use('/question', questionRoutes);

// Set up error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

// Wrap server setup and application logic in a try-catch block
(async () => {
  try {
    // Wait for database connection before starting the server
    await database;

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      // Optionally, you can exit the process here
      // process.exit(1);
    });

    // Gracefully handle process termination
    process.on('SIGINT', () => {
      logger.info('Server shutting down...');
      server.close(() => {
        logger.info('Server has been shut down.');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Error starting server:', error);
  }
})();
