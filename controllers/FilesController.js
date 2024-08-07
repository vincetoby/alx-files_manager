//controllers/FilesController.js

import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import mime from 'mime-types';
import fs from 'fs';
import { promisify } from 'util';
import { join } from 'path';
import Queue from 'bull';
import { ObjectId } from 'mongodb';

const fileQueue = new Queue('fileQueue');

const readFileAsync = promisify(fs.readFile);

class FilesController {
  // POST /files endpoint to handle file upload and add a job to the queue if the file is an image
  static async postUpload(req, res) {
    // Retrieve user based on token
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, type, parentId, isPublic, data } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type or invalid type' });
    }
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    const file = {
      userId: new ObjectId(userId),
      name,
      type,
      parentId: parentId || 0,
      isPublic: isPublic || false,
    };

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

      const localPath = join(folderPath, uuidv4());
      file.localPath = localPath;
      await fs.promises.writeFile(localPath, Buffer.from(data, 'base64'));

      // Add job to the queue if the file is an image
      if (type === 'image') {
        fileQueue.add({ userId, fileId: file._id.toString() });
      }
    }

    const result = await dbClient.db.collection('files').insertOne(file);
    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  // GET /files/:id/data endpoint to return the content of the file document based on the ID
  static async getFile(req, res) {
    const { id } = req.params;
    const { size } = req.query;
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });

    if (!file) return res.status(404).json({ error: 'Not found' });
    if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });
    if (!file.isPublic) {
      const token = req.header('X-Token');
      if (!token) return res.status(404).json({ error: 'Not found' });

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || userId.toString() !== file.userId.toString()) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    let localPath = file.localPath;
    if (size) {
      const sizePath = `${file.localPath}_${size}`;
      if (!fs.existsSync(sizePath)) return res.status(404).json({ error: 'Not found' });
      localPath = sizePath;
    }

    const mimeType = mime.lookup(file.name);
    const fileData = await readFileAsync(localPath);
    res.setHeader('Content-Type', mimeType);
    return res.send(fileData);
  }

  // GET /files/:id endpoint to retrieve the file document based on the ID
  static async getShow(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId),
    });

    if (!file) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(file);
  }

  // GET /files endpoint to retrieve all users file documents for a specific parentId and with pagination
  static async getIndex(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId = 0, page = 0 } = req.query;
    const pageSize = 20;

    const files = await dbClient.db.collection('files')
      .aggregate([
        { $match: { userId: new ObjectId(userId), parentId: parseInt(parentId, 10) } },
        { $skip: pageSize * parseInt(page, 10) },
        { $limit: pageSize },
      ])
      .toArray();

    return res.status(200).json(files);
  }

  // PUT /files/:id/publish endpoint to set isPublic to true on the file document based on the ID
  static async putPublish(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: true } },
      { returnOriginal: false }
    );

    if (!file.value) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(file.value);
  }

  // PUT /files/:id/unpublish endpoint to set isPublic to false on the file document based on the ID
  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: false } },
      { returnOriginal: false }
    );

    if (!file.value) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(file.value);
  }
}

export default FilesController;
