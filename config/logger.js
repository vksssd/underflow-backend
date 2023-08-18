const winston = require('winston');

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
});

module.exports = logger;
