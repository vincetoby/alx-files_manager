//controllers/FilesController.js

import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  /**
   * Handles POST requests to '/files' to upload a new file.
   */
  static async postUpload(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    // Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract file information from request body
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    // Validate file information
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const acceptedTypes = ['folder', 'file', 'image'];
    if (!type || !acceptedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Check if parentId is valid (if applicable)
    let parentFile = null;
    if (parentId !== 0) {
      parentFile = await dbClient.findFileById(parentId);

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Prepare file data for storage
    const fileData = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

    // Handle different file types (folder vs. file)
    if (type === 'folder') {
      const newFile = await dbClient.createFile(fileData);
      return res.status(201).json(newFile);
    } else {
      const folderPath = path.resolve(FOLDER_PATH);
      await fs.mkdir(folderPath, { recursive: true });

      const fileId = uuidv4();
      const localPath = path.join(folderPath, fileId);
      await fs.writeFile(localPath, Buffer.from(data, 'base64'));

      fileData.localPath = localPath;

      const newFile = await dbClient.createFile(fileData);
      return res.status(201).json(newFile);
    }
  }

  /**
   * Handles GET requests to '/files/:id' to retrieve a file document by ID.
   */
  static async getShow(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    // Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve file ID from request parameters
    const { id } = req.params;
    const file = await dbClient.findFileById(id);

    // Check if file belongs to the authenticated user
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  /**
   * Handles GET requests to '/files' to retrieve files based on parentId with pagination.
   */
  static async getIndex(req, res) {
    // Retrieve the token from request headers
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    // Check if the user is authenticated
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve query parameters
    const { parentId = 0, page = 0 } = req.query;
    const pageSize = 20;

    // Define aggregation pipeline for MongoDB
    const pipeline = [
      { $match: { userId, parentId } },
      { $skip: page * pageSize },
      { $limit: pageSize },
    ];

    // Retrieve files based on aggregation pipeline
    const files = await dbClient.client.db(dbClient.dbName).collection('files').aggregate(pipeline).toArray();
    return res.status(200).json(files);
  }
}

export default FilesController;
