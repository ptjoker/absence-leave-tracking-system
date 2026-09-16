// end_points.js
import express from 'express';
import sql from './db.js';
import supabaseAdmin from './supabaseAdmin.js';

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

// NEW: Registration Endpoint
router.post('/register', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      student_number,
      course,
      level_of_study,
      student_email,
      cell_number,
      password,
      role
    } = req.body;

    // 1. Basic validation
    if (!student_email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 2. Create the user in Supabase Auth
    // Note: We pass all the profile data inside "user_metadata". 
    // Our database trigger will automatically pick this up and insert it into the profiles table.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: student_email,
      password: password,
      email_confirm: true, // Automatically confirms the user for testing (remove this in production)
      user_metadata: {
        first_name,
        last_name,
        student_number,
        course,
        level_of_study,
        student_email,
        cell_number,
        role: role || 'student'
      }
    });

    if (authError) {
      // Handle common errors like "User already registered"
      return res.status(400).json({ error: authError.message });
    }

    // 3. Return success
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Something went wrong during registration' });
  }
});

export default router;