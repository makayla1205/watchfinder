const { createClient } = require('redis');

const client = createClient({
  url: process.env.UPSTASH_REDIS_URL
});

client.on('error', err => console.error('Redis Client Error', err));

(async () => {
  await client.connect();
  console.log('✅ Redis connected');
})();

module.exports = client;