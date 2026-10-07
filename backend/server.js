// server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import apiRoutes from './end_points.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Supporting documents (PNG/JPG) are sent as base64 inside the JSON body,
// so the default 100kb limit is far too small.
app.use(express.json({ limit: '8mb' }));

// Mount your routes at the /api path
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});