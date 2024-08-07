//worker.js

import Bull from 'bull';
import dbClient from './utils/db';

// Create a Bull queue for user-related tasks
const userQueue = new Bull('userQueue');

// Process the userQueue
userQueue.process(async (job, done) => {
  const { userId } = job.data;

  if (!userId) {
    return done(new Error('Missing userId'));
  }

  const user = await dbClient.db.collection('users').findOne({ _id: new ObjectID(userId) });

  if (!user) {
    return done(new Error('User not found'));
  }

  console.log(`Welcome ${user.email}!`);
  done();
});

// Create a Bull queue for file-related tasks
const fileQueue = new Bull('fileQueue');

// Process the fileQueue
fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    return done(new Error('Missing fileId'));
  }
  if (!userId) {
    return done(new Error('Missing userId'));
  }

  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(fileId), userId });

  if (!file) {
    return done(new Error('File not found'));
  }

  const imageThumbnail = require('image-thumbnail');
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const originalPath = file.localPath;
    const sizes = [500, 250, 100];

    for (const size of sizes) {
      const thumbnail = await imageThumbnail(originalPath, { width: size });
      const thumbnailPath = `${originalPath}_${size}`;
      await fs.writeFile(thumbnailPath, thumbnail);
    }
    done();
  } catch (error) {
    done(error);
  }
});
