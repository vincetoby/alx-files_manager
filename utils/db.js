// utils/db.js

/**
 * @file db.js
 * @description This module defines the DBClient class for managing MongDB connections.
 * and it includes methods to check the connection status and retrieve the count of documents
 * in specific collections.
 */
import { MongoClient } from 'mongodb';

/**
 * @class DBClient
 * @classdesc A client for connecting to MongoDB and performing basic database operations.
 */
class DBClient {
  /**
   * @constructor
   * @description Initializes a new isntance of a DBClient class.
   * Connects to MongoDB using the specified host, port, and database from environment
   * variables or defaults.
   */
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}/${dbName}`;

    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.isConnected = false;

    this.client.connect()
      .then(() => {
        this.isConnected = true;
      })
      .catch(() => {
        // do nothing. omitted 'error' variable from arguments since it is not used.
      });
  }

  /**
   * @method isAlive
   * @description Checks if the connection to MongoDB is successful.
   * @returns {boolean} True if the connection is successful, otherwise false.
   */
  isAlive() {
    return this.isConnected;
  }

  /**
   * @method nbUsers
   * @description Asynchronously returns the number of documents in the 'users' collection.
   * @returns {Promise<number>} The number of documents in the 'users' collection.
   */
  async nbUsers() {
    const users = this.client.db(this.dbName).collection('users');
    return users.countDocuments();
  }

  /**
   * @method nbFiles
   * @description Asynchronously returns the number of documents in the 'files' collection.
   * @returns {Promise<number>} The number of documents in the 'files' collection.
   */
  async nbFiles() {
    const files = this.client.db(this.dbName).collection('files');
    return files.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
