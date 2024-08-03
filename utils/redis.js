import * as redis from 'redis';
import { promisify } from 'util';

redis.debug_mode = true;

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.isActive = true;

    this.client.on('error', (err) => {
      this.isActive = false;
      console.log('Redis Client did not connect: ', err);
    });

    this.client.on('connect', () => {
      this.isActive = true;
    });
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.isActive;
  }

  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  async set(key, value, duration) {
    try {
      await promisify(this.client.set).bind(this.client)(key, value, 'EX', duration);
    } catch (err) {
      console.error(`Error setting ${key}:`, err);
    }
  }

  async del(key) {
    try {
      await promisify(this.client.del).bind(this.client)(key);
    } catch (err) {
      console.log(`Error deleting ${key}:`, err);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
