// server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import apiRoutes from './end_points.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount your routes at the /api path
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});