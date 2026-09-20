// end_points.js
import express from 'express';
import sql from './db.js';
import supabaseAdmin from './supabaseAdmin.js';
import { verifyToken } from './jwt.js';

// Verify the JWT sent by the frontend and return the user, or null if invalid.
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  // Local verification — no network round-trip to Supabase Auth.
  const user = await verifyToken(token);
  return user;
}

const router = express.Router();

// ============================================
// Existing endpoints
// ============================================

router.get('/test-db', async (req, res) => {
  try {
    const result = await sql`SELECT 1 + 1 AS result`;
    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("DB TEST FAILED:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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

// ============================================
// Auth endpoints
// ============================================

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

    if (!student_email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: student_email,
      password: password,
      email_confirm: true,
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
      return res.status(400).json({ error: authError.message });
    }

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

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = await sql`
      SELECT * FROM profiles WHERE id = ${data.user.id}
    `;

    if (profile.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (role && profile[0].role !== role) {
      return res.status(403).json({ error: 'Incorrect account type' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        first_name: profile[0].first_name,
        last_name: profile[0].last_name,
        role: profile[0].role,
        course: profile[0].course,
        cell_number: profile[0].cell_number
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
});

// ============================================
// Absence request endpoints
// ============================================

// POST /api/requests — create a new absence request
router.post('/requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, dateRange, date_range, detail, replacement, reason } = req.body;
    const finalDateRange = dateRange || date_range;

    if (!type) {
      return res.status(400).json({ error: 'Request type is required' });
    }

    // Single query: INSERT + fetch profile in one round-trip.
    const rows = await sql`
      WITH inserted AS (
        INSERT INTO public.absence_requests (user_id, type, date_range, detail, replacement, reason)
        VALUES (
          ${user.id},
          ${type},
          ${finalDateRange || null},
          ${detail || null},
          ${replacement || null},
          ${reason || null}
        )
        RETURNING *
      )
      SELECT i.*, p.first_name, p.last_name
      FROM inserted i
      JOIN public.profiles p ON p.id = i.user_id
    `;
    const row = rows[0];

    res.status(201).json({
      id: `REQ-${String(row.id).padStart(3, '0')}`,
      rawId: row.id,
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      initials: `${(row.first_name || 'U')[0]}${(row.last_name || '')[0] || ''}`.toUpperCase(),
      type: row.type,
      status: row.status,
      dateRange: row.date_range,
      detail: row.detail,
      replacement: row.replacement,
      reason: row.reason,
      filed: 'Filed recently',
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Could not create request' });
  }
});

// GET /api/requests — list requests (students see own, supervisors see all)
router.get('/requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Single query: it figures out the caller's role AND fetches requests in one shot.
    const rows = await sql`
      SELECT
        r.*,
        p.first_name,
        p.last_name,
        p.student_email,
        ROW_NUMBER() OVER (ORDER BY r.created_at ASC) AS display_seq
      FROM public.absence_requests r
      JOIN public.profiles p ON p.id = r.user_id
      WHERE (
        r.user_id = ${user.id}
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = ${user.id} AND role = 'supervisor'
        )
      )
      ORDER BY r.created_at DESC
    `;

    const formatted = rows.map((row) => ({
      id: `REQ-${String(row.display_seq).padStart(3, '0')}`,
      rawId: row.id,
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      initials: `${(row.first_name || 'U')[0]}${(row.last_name || '')[0] || ''}`.toUpperCase(),
      email: row.student_email || '',
      type: row.type,
      status: row.status,
      dateRange: row.date_range,
      detail: row.detail,
      replacement: row.replacement,
      reason: row.reason,
      filed: 'Filed recently',
      createdAt: row.created_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List requests error:', err);
    res.status(500).json({ error: 'Could not load requests' });
  }
});

// PATCH /api/requests/:id/status — supervisor approves or rejects
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the caller is a supervisor
    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can update request status' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await sql`
      UPDATE public.absence_requests
      SET status = ${status}, reviewed_by = ${user.id}, reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({
      message: 'Status updated',
      id: `REQ-${String(updated[0].id).padStart(3, '0')}`,
      rawId: updated[0].id,
      status: updated[0].status,
    });
  } catch (err) {
    console.error('Update request status error:', err);
    res.status(500).json({ error: 'Could not update request status' });
  }
});


export default router;