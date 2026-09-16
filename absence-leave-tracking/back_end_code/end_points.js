// end_points.js
import express from 'express';
import sql from './db.js';

const router = express.Router();

// Example: Get a user's profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await sql`
      SELECT * FROM profiles WHERE id = ${userId}
    `;
    
    if (profile.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile[0]);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/test-db', async (req, res) => {
  try {
    const result = await sql`SELECT 1 + 1 AS result`;
    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("DB TEST FAILED:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;