// server.js

/**
 * @file server.js
 * @description This file serves as the entry point for the Express server.
 */
import express from 'express';
import routes from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to parse incoming URL-encoded data with extended mode
app.use(express.urlencoded({ extended: true }));

// Load API routes from routes/index.js
app.use('/', routes);

/**
 * Starts the Express server and listens on the specified port.
 * Logs a message to indicate the server is running.
 */
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});

export default app;
