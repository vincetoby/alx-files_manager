// controllers/FilesController.js
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

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

    const fileData = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

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

  // Implement other methods for FilesController if needed
}

export default FilesController;
