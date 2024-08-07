const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const db = require('../db');  // Assuming you have a DB setup module
const { authenticateUser } = require('../utils/auth'); // Assuming you have an auth utility

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

if (!fs.existsSync(FOLDER_PATH)) {
    fs.mkdirSync(FOLDER_PATH, { recursive: true });
}

class FilesController {
    static async postUpload(req, res) {
        const token = req.headers.authorization;
        const user = authenticateUser(token);

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId = 0, isPublic = false, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        let parent = null;
        if (parentId !== 0) {
            parent = await db.findFileById(parentId);
            if (!parent) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parent.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const newFile = {
            userId: user.id,
            name,
            type,
            isPublic,
            parentId,
            localPath: '',
        };

        if (type !== 'folder') {
            const fileBuffer = Buffer.from(data, 'base64');
            const localPath = path.join(FOLDER_PATH, uuidv4());
            fs.writeFileSync(localPath, fileBuffer);
            newFile.localPath = localPath;
        }

        const createdFile = await db.createFile(newFile);

        return res.status(201).json(createdFile);
    }
}

module.exports = FilesController;
