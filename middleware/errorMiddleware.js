const logger = require('../config/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorMiddleware;
