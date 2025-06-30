const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '0.0.0.0',
  port: process.env.REDIS_PORT || 6379
});

module.exports = redisClient;