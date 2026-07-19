import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Redis connection using the URL from your .env file
const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
    console.log('⚡ Connected to Upstash Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export default redis;