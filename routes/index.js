// index.js

/**
 * @file index.js
 * @description This file defines all the API endpoints for the project
 */
import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

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
 * @summary Authenticates user and returns a token
 */
router.get('/connect', AuthController.getConnect);

/**
 * GET /disconnect
 * @summary Logs out the user by invalidating the token
 */
router.get('/disconnect', AuthController.getDisconnect);

/**
 * GET /users/me
 * @summary Retrieves information about the authenticated user
 */
router.get('/users/me', UsersController.getMe);

/**
 * POST /files
 * @summary Uploads a new file
 */
router.post('/files', FilesController.postUpload);

/**
 * GET /files/:id
 * @summary Retrieves a file document by ID
 */
router.get('/files/:id', FilesController.getShow);

/**
 * GET /files
 * @summary Retrieves all file documents for a specific parentId with pagination
 */
router.get('/files', FilesController.getIndex);

/**
 * PUT /files/:id/publish
 * @summary Updates the visibility of a file to public
 */
router.put('/files/:id/publish', FilesController.putPublish);

/**
 * PUT /files/:id/unpublish
 * @summary Updates the visibility of a file to private
 */
router.put('/files/:id/unpublish', FilesController.putUnpublish);

/**
 * GET /files/:id/data
 * @summary Returns the content of the file document based on the ID.
 */
router.get('/files/:id/data', FilesController.getFile);


export default router;
