//controllers/FilesController.js

import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import mime from 'mime-types';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  // Other methods...

  /**
   * Handles PUT requests to '/files/:id/publish' to set a file as public.
   */
  static async putPublish(req, res) {
    // Retrieve the token from request header
    const token = req.headers['x-token'];
    // Get the user ID linked to the token
    const userId = await redisClient.get(`auth_${token}`);

    // If the user ID is not found, return Unauthorized
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    // Find the file document by ID
    const file = await dbClient.findFileById(id);

    // If the file does not exist or does not belong to the user, return Not Found
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Update the file's `isPublic` field to true
    file.isPublic = true;
    const updatedFile = await dbClient.client.db(dbClient.dbName).collection('files').findOneAndUpdate(
      { _id: ObjectId(id) },
      { $set: { isPublic: true } },
      { returnOriginal: false }
    );

    // Return the updated file document
    res.status(200).json(updatedFile.value);
  }

  /**
   * Handles PUT requests to '/files/:id/unpublish' to set a file as private.
   */
  static async putUnpublish(req, res) {
    // Retrieve the token from request header
    const token = req.headers['x-token'];
    // Get the user ID linked to the token
    const userId = await redisClient.get(`auth_${token}`);

    // If the user ID is not found, return Unauthorized
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    // Find the file document by ID
    const file = await dbClient.findFileById(id);

    // If the file does not exist or does not belong to the user, return Not Found
    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Update the file's `isPublic` field to false
    file.isPublic = false;
    const updatedFile = await dbClient.client.db(dbClient.dbName).collection('files').findOneAndUpdate(
      { _id: ObjectId(id) },
      { $set: { isPublic: false } },
      { returnOriginal: false }
    );

    // Return the updated file document
    res.status(200).json(updatedFile.value);
  }

  /**
   * Handles GET requests to '/files/:id/data' to return the content of a file.
   */
  static async getFile(req, res) {
    const { id } = req.params;

    // Find the file document by ID
    const file = await dbClient.findFileById(id);

    // If the file does not exist, return Not Found
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // If the file is not public and the user is not authenticated or is not the owner, return Not Found
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!file.isPublic && (!userId || file.userId !== userId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // If the file type is folder, return an error
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    // Get the file path
    const filePath = path.join(FOLDER_PATH, file.localPath);

    // Check if the file exists locally
    try {
      await fs.access(filePath);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Get the MIME-type of the file
    const mimeType = mime.lookup(file.name);

    // Read and return the file content with the correct MIME-type
    const fileContent = await fs.readFile(filePath);
    res.setHeader('Content-Type', mimeType);
    res.send(fileContent);
  }
}

export default FilesController;
