// index.js

/**
 * @file index.js
 * @description This file defines all the API endpoints for the project
 */
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const router = express.Router();

/**
 * GET /status
 * @summary Returns the status of Redis and the database.
 * @returns {Object} 200 - { "redis": true, "db": true }
 */
router.get('/status', AppController.getStatus);

/**
 * GET /stats
 * @summary Returns the statistics about users and files in the database.
 * @returns {Object} 200 - { "users": 12, "files": 1231 }
 */
router.get('/stats', AppController.getStats);

/**
 * POST /users
 * @summary Adds users to the database
 */
router.post('/users', UsersController.postNew);

/**
 * GET /connect
 * @summary
 * @returns
 */
router.get('/connect', AuthController.getConnect);

/**
 * GET /disconnect
 * @summary
 * @returns
 */
router.get('/disconnect', AuthController.getDisconnect);

/**
 * GET /users/me
 * @summary
 * @returns
 */
router.get('/users/me', UsersController.getMe);

router.post('/files', FilesController.postUpload);

// should retrieve the file document based on the ID
router.get('/files/:id', FilesController.getShow);

// should retrieve all users file documents for a
// specific parentId and with pagination
router.get('/files', FilesController.getIndex);

// should set isPublic to true on the file document based on the ID
router.put('/files/:id/publish', FilesController.putPublish);

// should set isPublic to false on the file document based on the ID
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// should return the content of the file document based on the ID
router.get('/files/:id/data', FilesController.getFile);

export default router;
