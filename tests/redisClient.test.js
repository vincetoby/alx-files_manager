import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('redisClient', () => {
  before(async () => {
    await redisClient.set('test_key', 'test_value');
  });

  after(async () => {
    await redisClient.del('test_key');
  });

  it('should set and get a key correctly', async () => {
    const value = await redisClient.get('test_key');
    expect(value).to.equal('test_value');
  });

  it('should delete a key correctly', async () => {
    await redisClient.del('test_key');
    const value = await redisClient.get('test_key');
    expect(value).to.be.null;
  });
});
