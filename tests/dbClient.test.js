import { expect } from 'chai';
import dbClient from '../utils/db';

describe('dbClient', () => {
  it('should return a MongoDB connection', async () => {
    const collections = await dbClient.db.listCollections().toArray();
    expect(collections).to.be.an('array');
  });

  it('should insert and retrieve a document', async () => {
    const collection = dbClient.db.collection('test');
    const mockDocument = { name: 'test' };
    await collection.insertOne(mockDocument);

    const retrievedDocument = await collection.findOne({ name: 'test' });
    expect(retrievedDocument.name).to.equal('test');

    await collection.deleteMany({});
  });
});
