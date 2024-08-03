import redis from 'redis';
import { promisify } from 'util';

/**
 * Class for performing operations with Redis service
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
    });

    this.client.on('connect', () => {
      // console.log('Redis client connected to the server');
    });
  }

  /**
   * a func that checks if connection to Redis is Alive
   * @return {boolean} true if connection alive or false otherwise
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * async func that gets value corresponding to key in redis
   * @param {string} key - the key to search for in redis
   * @return {string} the value associated with key
   */
  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  /**
   * Creates a new key in redis with a specific TTL
   * @param {string} key - the key to be saved in redis
   * @param {string} value - the value to be asigned to key
   * @param {number} duration - TTL(time to live) of key in seconds
   * @return {undefined}  No return
   */
  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  /**
   * Deletes key in redis service
   * @param {string} key - the key to be deleted
   * @return {undefined}  No return
   */
  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();


