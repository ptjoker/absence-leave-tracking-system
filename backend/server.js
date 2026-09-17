// server.js
import express from 'express';
import 'dotenv/config';
import apiRoutes from './end_points.js'; // Import your routes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Mount your routes at the /api path
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});