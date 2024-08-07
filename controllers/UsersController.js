// UsersController.js

/**
 * @file controllers/UsersController.js
 * @description This file contains the logic for handling user-related
 * requests
 */
import crypto from 'crypto';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectID } from 'mongodb';
import Bull from 'bull';

// Create a Bull queue for user-related tasks
const userQueue = new Bull('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const emailExists = await dbClient.db.collection('users').findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const sha1 = require('sha1');
    const hashedPassword = sha1(password);
    const user = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    const userId = user.insertedId.toString();

    // Add job to userQueue for sending welcome email
    userQueue.add({ userId });

    return res.status(201).json({ id: userId, email });
  }
}

export default UsersController;
