import redisClient from '../utils/redis';

describe('redisClient', () => {
  it('should set and get a key correctly', async () => {
    await redisClient.set('test_key', 'test_value');
    const value = await redisClient.get('test_key');
    expect(value).toBe('test_value');
  });

  it('should delete a key correctly', async () => {
    await redisClient.set('test_key', 'test_value');
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).toBe(null);
  });
});
