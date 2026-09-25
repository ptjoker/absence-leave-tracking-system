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
    cell_number: profile[0].cell_number,
    student_number: profile[0].student_number,
    level_of_study: profile[0].level_of_study,
    student_email: profile[0].student_email,
    personal_email: profile[0].personal_email,
    created_at: profile[0].created_at
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

// ============================================
// Profile endpoints
// ============================================

// PATCH /api/profile — update the logged-in user's editable profile fields
router.patch('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { course, level_of_study, cell_number, personal_email } = req.body;

    // Only update fields that were provided. Empty strings are allowed (to clear a value).
    const updates = {};
    if (course !== undefined) updates.course = course || null;
    if (level_of_study !== undefined) updates.level_of_study = level_of_study || null;
    if (cell_number !== undefined) updates.cell_number = cell_number || null;
    if (personal_email !== undefined) updates.personal_email = personal_email || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Build the update query dynamically
    const updated = await sql`
      UPDATE public.profiles
      SET
        course = COALESCE(${updates.course ?? null}, course),
        level_of_study = COALESCE(${updates.level_of_study ?? null}, level_of_study),
        cell_number = COALESCE(${updates.cell_number ?? null}, cell_number),
        personal_email = ${updates.personal_email ?? null}
      WHERE id = ${user.id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      message: 'Profile updated',
      profile: {
        id: updated[0].id,
        first_name: updated[0].first_name,
        last_name: updated[0].last_name,
        role: updated[0].role,
        student_number: updated[0].student_number,
        student_email: updated[0].student_email,
        personal_email: updated[0].personal_email,
        course: updated[0].course,
        level_of_study: updated[0].level_of_study,
        cell_number: updated[0].cell_number,
        created_at: updated[0].created_at,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// ============================================
// Supervisor endpoints
// ============================================

// GET /api/assistants — list all student assistants with request stats (supervisors only)
router.get('/assistants', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can view assistants' });
    }

    const rows = await sql`
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.student_number,
        p.student_email,
        p.personal_email,
        p.course,
        p.level_of_study,
        p.cell_number,
        p.created_at,
        COALESCE(COUNT(r.id), 0)::int AS total_requests,
        COALESCE(SUM(CASE WHEN r.status = 'Approved' THEN 1 ELSE 0 END), 0)::int AS approved_requests,
        COALESCE(SUM(CASE WHEN r.status = 'Pending' THEN 1 ELSE 0 END), 0)::int AS pending_requests,
        COALESCE(SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END), 0)::int AS rejected_requests
      FROM public.profiles p
      LEFT JOIN public.absence_requests r ON r.user_id = p.id
      WHERE p.role = 'student'
      GROUP BY p.id
      ORDER BY p.first_name ASC, p.last_name ASC
    `;

    const formatted = rows.map((row) => ({
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      initials: `${(row.first_name || 'U')[0]}${(row.last_name || '')[0] || ''}`.toUpperCase(),
      studentNumber: row.student_number || '',
      email: row.student_email || '',
      personalEmail: row.personal_email || '',
      course: row.course || '',
      level: row.level_of_study || '',
      phone: row.cell_number || '',
      createdAt: row.created_at,
      totalRequests: row.total_requests,
      approvedRequests: row.approved_requests,
      pendingRequests: row.pending_requests,
      rejectedRequests: row.rejected_requests,
      status: row.pending_requests > 0 ? 'Active' : 'Active',
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List assistants error:', err);
    res.status(500).json({ error: 'Could not load assistants' });
  }
});

// ============================================
// Shift endpoints
// ============================================

// POST /api/shifts — create a shift (supervisors only)
router.post('/shifts', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can create shifts' });
    }

    const { user_id, shift_date, start_time, end_time, role, location, notes } = req.body;

    if (!user_id || !shift_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rows = await sql`
      INSERT INTO public.shifts (user_id, shift_date, start_time, end_time, role, location, notes, created_by)
      VALUES (
        ${user_id},
        ${shift_date},
        ${start_time},
        ${end_time},
        ${role || null},
        ${location || null},
        ${notes || null},
        ${user.id}
      )
      RETURNING id, user_id, start_time, end_time, role, location, notes, created_by, created_at, TO_CHAR(shift_date, 'YYYY-MM-DD') AS shift_date
    `;

    const shiftRow = rows[0];

    // Join to get the student's name for the response
    const studentRows = await sql`
      SELECT first_name, last_name FROM public.profiles WHERE id = ${shiftRow.user_id}
    `;
    const student = studentRows[0] || {};

    res.status(201).json({
      id: shiftRow.id,
      userId: shiftRow.user_id,
      studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
      studentInitials: `${(student.first_name || 'U')[0]}${(student.last_name || '')[0] || ''}`.toUpperCase(),
      shiftDate: shiftRow.shift_date,
      startTime: shiftRow.start_time,
      endTime: shiftRow.end_time,
      role: shiftRow.role,
      location: shiftRow.location,
      notes: shiftRow.notes,
      createdAt: shiftRow.created_at,
    });
  } catch (err) {
    console.error('Create shift error:', err);
    res.status(500).json({ error: 'Could not create shift' });
  }
});

// GET /api/shifts — list shifts (students see own, supervisors see all)
router.get('/shifts', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    const role = callerProfile[0]?.role || 'student';

    let rows;
    if (role === 'supervisor') {
      rows = await sql`
        SELECT
          s.id, s.user_id, s.start_time, s.end_time, s.role, s.location, s.notes, s.created_by, s.created_at,
          TO_CHAR(s.shift_date, 'YYYY-MM-DD') AS shift_date,
          p.first_name, p.last_name
        FROM public.shifts s
        JOIN public.profiles p ON p.id = s.user_id
        ORDER BY s.shift_date ASC, s.start_time ASC
      `;
    } else {
      rows = await sql`
        SELECT
          s.id, s.user_id, s.start_time, s.end_time, s.role, s.location, s.notes, s.created_by, s.created_at,
          TO_CHAR(s.shift_date, 'YYYY-MM-DD') AS shift_date,
          p.first_name, p.last_name
        FROM public.shifts s
        JOIN public.profiles p ON p.id = s.user_id
        WHERE s.user_id = ${user.id}
        ORDER BY s.shift_date ASC, s.start_time ASC
      `;
    }

    const formatted = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      studentName: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      studentInitials: `${(row.first_name || 'U')[0]}${(row.last_name || '')[0] || ''}`.toUpperCase(),
      shiftDate: row.shift_date,
      startTime: row.start_time,
      endTime: row.end_time,
      role: row.role,
      location: row.location,
      notes: row.notes,
      createdAt: row.created_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List shifts error:', err);
    res.status(500).json({ error: 'Could not load shifts' });
  }
});

// DELETE /api/shifts/:id — delete a shift (supervisors only)
router.delete('/shifts/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can delete shifts' });
    }

    const { id } = req.params;
    const deleted = await sql`
      DELETE FROM public.shifts WHERE id = ${id} RETURNING id
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json({ message: 'Shift deleted', id: deleted[0].id });
  } catch (err) {
    console.error('Delete shift error:', err);
    res.status(500).json({ error: 'Could not delete shift' });
  }
});

// ============================================
// Session refresh endpoint
// ============================================

// POST /api/refresh — exchange a refresh_token for a new access_token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Missing refresh_token' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
      return res.status(500).json({ error: 'Server auth configuration error' });
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ refresh_token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(401).json({ error: data.error_description || data.error || 'Refresh failed' });
    }

    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Could not refresh session' });
  }
});

export default router;