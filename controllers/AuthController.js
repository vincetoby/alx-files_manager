// controllers/AuthController.js

/**
 * @file AuthController.js
 * @description This file contains authentication logic for the API
 */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * @class AuthController class to handle authentication-related operations.
 */
class AuthController {
  /**
   * Handles GET requests to '/connect' to sign-in the user by generating
   * a new authentication token.
   */
  static async getConnect(req, res) {
    // access the request header 'Authorization'
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // extract credentials - (Basic auth)
    const base64cred = authHeader.split(' ')[1];
    const cred = Buffer.from(base64cred, 'base64').toString('ascii');
    const [email, password] = cred.split(':');

    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // query the database for that user
    const hashedPwd = crypto.createHash('sha1').update(password).digest('hex');
    const usersColl = dbClient.client.db(dbClient.dbName).collection('users');
    const user = await usersColl.findOne({ email, password: hashedPwd });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // the user is present. generate token -random string.
    const token = uuidv4();
    const key = `auth_${token}`;
    // store in redis for 24 hours
    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);

    res.set('X-Token', token).status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    // extract token from request header X-Token
    const token = req.headers['x-token'];

    // retrieve the user linked to that token
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await redisClient.del(`auth_${token}`);
    res.status(204).send();
  }
}

export default AuthController;
