// end_points.js
import express from 'express';
import sql from './db.js';
import supabaseAdmin from './supabaseAdmin.js';
import { verifyToken } from './jwt.js';
import rateLimit from 'express-rate-limit';

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


const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again later.'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.'
  }
});


const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification attempts. Please try again later.'
  }
});


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
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const { userId } = req.params;

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
      LIMIT 1
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'User profile not found'
      });
    }

    const callerRole = callerProfile[0].role;

    // Users may view their own profile.
    // Admins and supervisors may view other profiles.
    if (
      user.id !== userId &&
      callerRole !== 'admin' &&
      callerRole !== 'supervisor'
    ) {
      return res.status(403).json({
        error: 'You are not allowed to view this profile'
      });
    }

    const profile = await sql`
      SELECT *
      FROM public.profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (profile.length === 0) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    res.json(profile[0]);

  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      error: 'Something went wrong'
    });
  }
});


// ============================================
// Auth endpoints
// ============================================

// ============================================
// Send Email OTP
// ============================================

// POST /api/auth/send-otp
router.post('/auth/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false
      }
    });

    if (error) {
      console.error('Send OTP error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Send OTP server error:', error);

    res.status(500).json({
      error: 'Could not send OTP'
    });
  }
});


// ============================================
// Verify Email OTP
// ============================================

// POST /api/auth/verify-otp
router.post('/auth/verify-otp', verifyOtpLimiter, async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        error: 'Email and OTP token are required'
      });
    }

    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      console.error('Verify OTP error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      session: data.session,
      user: data.user
    });

  } catch (error) {
    console.error('Verify OTP server error:', error);

    res.status(500).json({
      error: 'Could not verify OTP'
    });
  }
});


// ============================================
// Register
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
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Self-signup is allowed only for Student Assistants
    // and Supervisors. Admin accounts are created by Admin.
    const signupRole = role || 'student';

    if (!['student', 'supervisor'].includes(signupRole)) {
      return res.status(400).json({
        error: 'Invalid registration role'
      });
    }

    // Use the normal Supabase signup flow so that
    // Supabase sends the Confirm Signup email/OTP.
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signUp({
        email: student_email,
        password: password,
        options: {
          data: {
            first_name,
            last_name,
            student_number,
            course,
            level_of_study,
            student_email,
            cell_number,
            role: signupRole
          }
        }
      });

    if (authError) {
      return res.status(400).json({
        error: authError.message
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        error: 'Registration did not create a user'
      });
    }


    res.status(201).json({
      success: true,
      message: 'Registration successful. A verification code has been sent to your email.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: signupRole
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);

    res.status(500).json({
      error: 'Something went wrong during registration'
    });
  }
});


// ============================================
// Login
// ============================================

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { data, error } =
      await supabaseAdmin.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const profile = await sql`
      SELECT * FROM profiles WHERE id = ${data.user.id}
    `;

    if (profile.length === 0) {
      return res.status(404).json({
        error: 'User profile not found'
      });
    }

    if (role && profile[0].role !== role) {
      return res.status(403).json({
        error: 'Incorrect account type'
      });
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

    res.status(500).json({
      error: 'Something went wrong during login'
    });
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
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const {
      type,
      dateRange,
      date_range,
      detail,
      replacement,
      reason
    } = req.body;

    const finalDateRange = dateRange || date_range;

    if (!type) {
      return res.status(400).json({
        error: 'Request type is required'
      });
    }

    const rows = await sql`
      WITH inserted AS (
        INSERT INTO public.absence_requests
          (user_id, type, date_range, detail, replacement, reason)
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
      SELECT
        i.*,
        p.first_name,
        p.last_name
      FROM inserted i
      JOIN public.profiles p
        ON p.id = i.user_id
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
      createdAt: row.created_at
    });

  } catch (err) {
    console.error('Create request error:', err);

    res.status(500).json({
      error: 'Could not create request'
    });
  }
});


// GET /api/requests — list requests
// Students see their own, supervisors see all
router.get('/requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const rows = await sql`
      SELECT
        r.*,
        p.first_name,
        p.last_name,
        p.student_email,
        ROW_NUMBER() OVER (
          ORDER BY r.created_at ASC
        ) AS display_seq
      FROM public.absence_requests r
      JOIN public.profiles p
        ON p.id = r.user_id
      WHERE (
        r.user_id = ${user.id}
        OR EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE id = ${user.id}
          AND role = 'supervisor'
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
      createdAt: row.created_at
    }));

    res.json(formatted);

  } catch (err) {
    console.error('List requests error:', err);

    res.status(500).json({
      error: 'Could not load requests'
    });
  }
});


// PATCH /api/requests/:id/status
// Supervisor approves or rejects
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({
        error: 'Only supervisors can update request status'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status'
      });
    }

    const updated = await sql`
      UPDATE public.absence_requests
      SET
        status = ${status},
        reviewed_by = ${user.id},
        reviewed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({
        error: 'Request not found'
      });
    }

    res.json({
      message: 'Status updated',
      id: `REQ-${String(updated[0].id).padStart(3, '0')}`,
      rawId: updated[0].id,
      status: updated[0].status
    });

  } catch (err) {
    console.error('Update request status error:', err);

    res.status(500).json({
      error: 'Could not update request status'
    });
  }
});


// ============================================
// Profile endpoints
// ============================================

// PATCH /api/profile
router.patch('/profile', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const {
      course,
      level_of_study,
      cell_number,
      personal_email
    } = req.body;

    const updates = {};

    if (course !== undefined) {
      updates.course = course || null;
    }

    if (level_of_study !== undefined) {
      updates.level_of_study = level_of_study || null;
    }

    if (cell_number !== undefined) {
      updates.cell_number = cell_number || null;
    }

    if (personal_email !== undefined) {
      updates.personal_email = personal_email || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

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
      return res.status(404).json({
        error: 'Profile not found'
      });
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
        created_at: updated[0].created_at
      }
    });

  } catch (err) {
    console.error('Update profile error:', err);

    res.status(500).json({
      error: 'Could not update profile'
    });
  }
});


// ============================================
// Supervisor endpoints
// ============================================

// GET /api/assistants
router.get('/assistants', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({
        error: 'Only supervisors can view assistants'
      });
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
        COALESCE(
          SUM(
            CASE
              WHEN r.status = 'Approved' THEN 1
              ELSE 0
            END
          ),
          0
        )::int AS approved_requests,
        COALESCE(
          SUM(
            CASE
              WHEN r.status = 'Pending' THEN 1
              ELSE 0
            END
          ),
          0
        )::int AS pending_requests,
        COALESCE(
          SUM(
            CASE
              WHEN r.status = 'Rejected' THEN 1
              ELSE 0
            END
          ),
          0
        )::int AS rejected_requests
      FROM public.profiles p
      LEFT JOIN public.absence_requests r
        ON r.user_id = p.id
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
      status: 'Active'
    }));

    res.json(formatted);

  } catch (err) {
    console.error('List assistants error:', err);

    res.status(500).json({
      error: 'Could not load assistants'
    });
  }
});


// ============================================
// Shift endpoints
// ============================================

// POST /api/shifts
router.post('/shifts', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({
        error: 'Only supervisors can create shifts'
      });
    }

    const {
      user_id,
      shift_date,
      start_time,
      end_time,
      role,
      location,
      notes
    } = req.body;

    if (!user_id || !shift_date || !start_time || !end_time) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const rows = await sql`
      INSERT INTO public.shifts
        (
          user_id,
          shift_date,
          start_time,
          end_time,
          role,
          location,
          notes,
          created_by
        )
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
      RETURNING
        id,
        user_id,
        start_time,
        end_time,
        role,
        location,
        notes,
        created_by,
        created_at,
        TO_CHAR(shift_date, 'YYYY-MM-DD') AS shift_date
    `;

    const shiftRow = rows[0];

    const studentRows = await sql`
      SELECT first_name, last_name
      FROM public.profiles
      WHERE id = ${shiftRow.user_id}
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
      createdAt: shiftRow.created_at
    });

  } catch (err) {
    console.error('Create shift error:', err);

    res.status(500).json({
      error: 'Could not create shift'
    });
  }
});


// GET /api/shifts
router.get('/shifts', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    const role = callerProfile[0]?.role || 'student';

    let rows;

    if (role === 'supervisor') {
      rows = await sql`
        SELECT
          s.id,
          s.user_id,
          s.start_time,
          s.end_time,
          s.role,
          s.location,
          s.notes,
          s.created_by,
          s.created_at,
          TO_CHAR(s.shift_date, 'YYYY-MM-DD') AS shift_date,
          p.first_name,
          p.last_name
        FROM public.shifts s
        JOIN public.profiles p
          ON p.id = s.user_id
        ORDER BY s.shift_date ASC, s.start_time ASC
      `;
    } else {
      rows = await sql`
        SELECT
          s.id,
          s.user_id,
          s.start_time,
          s.end_time,
          s.role,
          s.location,
          s.notes,
          s.created_by,
          s.created_at,
          TO_CHAR(s.shift_date, 'YYYY-MM-DD') AS shift_date,
          p.first_name,
          p.last_name
        FROM public.shifts s
        JOIN public.profiles p
          ON p.id = s.user_id
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
      createdAt: row.created_at
    }));

    res.json(formatted);

  } catch (err) {
    console.error('List shifts error:', err);

    res.status(500).json({
      error: 'Could not load shifts'
    });
  }
});


// DELETE /api/shifts/:id
router.delete('/shifts/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({
        error: 'Only supervisors can delete shifts'
      });
    }

    const { id } = req.params;

    const deleted = await sql`
      DELETE FROM public.shifts
      WHERE id = ${id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return res.status(404).json({
        error: 'Shift not found'
      });
    }

    res.json({
      message: 'Shift deleted',
      id: deleted[0].id
    });

  } catch (err) {
    console.error('Delete shift error:', err);

    res.status(500).json({
      error: 'Could not delete shift'
    });
  }
});


// ============================================
// Session refresh endpoint
// ============================================

// POST /api/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'Missing refresh_token'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error(
        'Missing SUPABASE_URL or SUPABASE_ANON_KEY'
      );

      return res.status(500).json({
        error: 'Server auth configuration error'
      });
    }

    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`
        },
        body: JSON.stringify({
          refresh_token
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(401).json({
        error:
          data.error_description ||
          data.error ||
          'Refresh failed'
      });
    }

    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      expires_in: data.expires_in
    });

  } catch (err) {
    console.error('Refresh error:', err);

    res.status(500).json({
      error: 'Could not refresh session'
    });
  }
});


// ============================================
// Admin endpoints
// ============================================

// GET /api/admin/assistants
router.get('/admin/assistants', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can view assistants'
      });
    }

    const rows = await sql`
      SELECT
        id,
        first_name,
        last_name,
        student_number,
        student_email,
        personal_email,
        course,
        level_of_study,
        cell_number,
        created_at
      FROM public.profiles
      WHERE role = 'student'
      ORDER BY first_name ASC, last_name ASC
    `;

    const assistants = rows.map((row) => ({
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      studentNumber: row.student_number || '',
      studentEmail: row.student_email || '',
      personalEmail: row.personal_email || '',
      course: row.course || '',
      levelOfStudy: row.level_of_study || '',
      cellNumber: row.cell_number || '',
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      count: assistants.length,
      assistants
    });

  } catch (error) {
    console.error('Admin assistants error:', error);

    res.status(500).json({
      error: 'Could not load assistants'
    });
  }
});


// ============================================
// Admin - Student Assistant Account Management
// ============================================

// POST /api/admin/assistants
router.post('/admin/assistants', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can create student assistant accounts'
      });
    }

    const {
      first_name,
      last_name,
      student_number,
      course,
      level_of_study,
      student_email,
      cell_number,
      personal_email,
      password
    } = req.body;

    if (
      !first_name ||
      !last_name ||
      !student_number ||
      !course ||
      !level_of_study ||
      !student_email ||
      !password
    ) {
      return res.status(400).json({
        error:
          'First name, last name, student number, course, level of study, student email and password are required'
      });
    }

    const existingProfile = await sql`
      SELECT id, student_email, student_number
      FROM public.profiles
      WHERE student_email = ${student_email}
         OR student_number = ${student_number}
      LIMIT 1
    `;

    if (existingProfile.length > 0) {
      if (existingProfile[0].student_email === student_email) {
        return res.status(409).json({
          error: 'A user with this student email already exists'
        });
      }

      if (existingProfile[0].student_number === student_number) {
        return res.status(409).json({
          error: 'A user with this student number already exists'
        });
      }
    }

    const {
      data: authData,
      error: authError
    } = await supabaseAdmin.auth.admin.createUser({
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
        cell_number: cell_number || null,
        personal_email: personal_email || null,
        role: 'student'
      }
    });

    if (authError) {
      console.error(
        'Admin create assistant Auth error:',
        authError
      );

      return res.status(400).json({
        error: authError.message
      });
    }

    const newUserId = authData.user.id;

    try {
      const profileRows = await sql`
        INSERT INTO public.profiles (
          id,
          first_name,
          last_name,
          student_number,
          course,
          level_of_study,
          student_email,
          cell_number,
          personal_email,
          role
        )
        VALUES (
          ${newUserId},
          ${first_name},
          ${last_name},
          ${student_number},
          ${course},
          ${level_of_study},
          ${student_email},
          ${cell_number || null},
          ${personal_email || null},
          'student'
        )
        ON CONFLICT (id)
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          student_number = EXCLUDED.student_number,
          course = EXCLUDED.course,
          level_of_study = EXCLUDED.level_of_study,
          student_email = EXCLUDED.student_email,
          cell_number = EXCLUDED.cell_number,
          personal_email = EXCLUDED.personal_email,
          role = 'student'
        RETURNING
          id,
          first_name,
          last_name,
          student_number,
          course,
          level_of_study,
          student_email,
          cell_number,
          personal_email,
          role,
          created_at
      `;

      const profile = profileRows[0];

      return res.status(201).json({
        success: true,
        message: 'Student assistant account created successfully',
        assistant: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          studentNumber: profile.student_number,
          course: profile.course,
          levelOfStudy: profile.level_of_study,
          studentEmail: profile.student_email,
          cellNumber: profile.cell_number,
          personalEmail: profile.personal_email,
          role: profile.role,
          createdAt: profile.created_at
        }
      });

    } catch (profileError) {
      console.error(
        'Admin create assistant profile error:',
        profileError
      );

      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      return res.status(500).json({
        error: 'Assistant account could not be completed'
      });
    }

  } catch (error) {
    console.error(
      'Admin create assistant error:',
      error
    );

    return res.status(500).json({
      error: 'Could not create student assistant account'
    });
  }
});


// ============================================
// Admin - Supervisor Account Management
// ============================================

// GET /api/admin/supervisors
router.get('/admin/supervisors', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can view supervisors'
      });
    }

    const rows = await sql`
      SELECT
        id,
        first_name,
        last_name,
        student_email,
        personal_email,
        cell_number,
        created_at
      FROM public.profiles
      WHERE role = 'supervisor'
      ORDER BY first_name ASC, last_name ASC
    `;

    const supervisors = rows.map((row) => ({
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      studentEmail: row.student_email || '',
      personalEmail: row.personal_email || '',
      cellNumber: row.cell_number || '',
      role: 'supervisor',
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      count: supervisors.length,
      supervisors
    });

  } catch (error) {
    console.error('Admin supervisors error:', error);

    res.status(500).json({
      error: 'Could not load supervisors'
    });
  }
});


// ============================================
// Admin - Supervisor Account Management
// ============================================

// POST /api/admin/supervisors
router.post('/admin/supervisors', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can create supervisor accounts'
      });
    }

    const {
      first_name,
      last_name,
      student_email,
      cell_number,
      personal_email,
      password
    } = req.body;

    if (
      !first_name ||
      !last_name ||
      !student_email ||
      !password
    ) {
      return res.status(400).json({
        error:
          'First name, last name, student email and password are required'
      });
    }

    const existingProfile = await sql`
      SELECT id
      FROM public.profiles
      WHERE student_email = ${student_email}
      LIMIT 1
    `;

    if (existingProfile.length > 0) {
      return res.status(409).json({
        error: 'A user with this email already exists'
      });
    }

    const {
      data: authData,
      error: authError
    } = await supabaseAdmin.auth.admin.createUser({
      email: student_email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        student_email,
        cell_number: cell_number || null,
        personal_email: personal_email || null,
        role: 'supervisor'
      }
    });

    if (authError) {
      console.error(
        'Admin create supervisor Auth error:',
        authError
      );

      return res.status(400).json({
        error: authError.message
      });
    }

    const newUserId = authData.user.id;

    try {
      const profileRows = await sql`
        INSERT INTO public.profiles (
          id,
          first_name,
          last_name,
          student_email,
          cell_number,
          personal_email,
          role
        )
        VALUES (
          ${newUserId},
          ${first_name},
          ${last_name},
          ${student_email},
          ${cell_number || null},
          ${personal_email || null},
          'supervisor'
        )
        ON CONFLICT (id)
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          student_email = EXCLUDED.student_email,
          cell_number = EXCLUDED.cell_number,
          personal_email = EXCLUDED.personal_email,
          role = 'supervisor'
        RETURNING
          id,
          first_name,
          last_name,
          student_email,
          cell_number,
          personal_email,
          role,
          created_at
      `;

      const profile = profileRows[0];

      return res.status(201).json({
        success: true,
        message: 'Supervisor account created successfully',
        supervisor: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          studentEmail: profile.student_email,
          cellNumber: profile.cell_number,
          personalEmail: profile.personal_email,
          role: profile.role,
          createdAt: profile.created_at
        }
      });

    } catch (profileError) {
      console.error(
        'Admin create supervisor profile error:',
        profileError
      );

      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      return res.status(500).json({
        error: 'Supervisor account could not be completed'
      });
    }

  } catch (error) {
    console.error(
      'Admin create supervisor error:',
      error
    );

    return res.status(500).json({
      error: 'Could not create supervisor account'
    });
  }
});


// ============================================
// Admin - Remove Student Assistant Account
// ============================================

// DELETE /api/admin/assistants/:id
router.delete('/admin/assistants/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can remove student assistant accounts'
      });
    }

    const { id } = req.params;

    if (id === user.id) {
      return res.status(400).json({
        error: 'You cannot remove your own admin account'
      });
    }

    const targetProfile = await sql`
      SELECT
        id,
        first_name,
        last_name,
        student_email,
        role
      FROM public.profiles
      WHERE id = ${id}
    `;

    if (targetProfile.length === 0) {
      return res.status(404).json({
        error: 'Student assistant not found'
      });
    }

    if (targetProfile[0].role !== 'student') {
      return res.status(400).json({
        error:
          'This endpoint can only remove student assistant accounts'
      });
    }

    const requestRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.absence_requests
      WHERE user_id = ${id}
    `;

    const shiftRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.shifts
      WHERE user_id = ${id}
    `;

    const requestCount = requestRows[0].count;
    const shiftCount = shiftRows[0].count;

    if (requestCount > 0 || shiftCount > 0) {
      return res.status(409).json({
        error:
          'This student assistant cannot be removed because they have existing system records',
        absenceRequests: requestCount,
        shifts: shiftCount
      });
    }

    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error(
        'Admin delete assistant Auth error:',
        authError
      );

      return res.status(400).json({
        error: authError.message
      });
    }

    await sql`
      DELETE FROM public.profiles
      WHERE id = ${id}
    `;

    res.json({
      success: true,
      message:
        'Student assistant account removed successfully',
      assistant: {
        id: targetProfile[0].id,
        name:
          `${targetProfile[0].first_name || ''} ${targetProfile[0].last_name || ''}`.trim(),
        email: targetProfile[0].student_email || ''
      }
    });

  } catch (error) {
    console.error(
      'Admin delete assistant error:',
      error
    );

    res.status(500).json({
      error: 'Could not remove student assistant account'
    });
  }
});


// ============================================
// Admin - Remove Supervisor Account
// ============================================

// DELETE /api/admin/supervisors/:id
router.delete('/admin/supervisors/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can remove supervisor accounts'
      });
    }

    const { id } = req.params;

    if (id === user.id) {
      return res.status(400).json({
        error: 'You cannot remove your own admin account'
      });
    }

    const targetProfile = await sql`
      SELECT
        id,
        first_name,
        last_name,
        student_email,
        role
      FROM public.profiles
      WHERE id = ${id}
    `;

    if (targetProfile.length === 0) {
      return res.status(404).json({
        error: 'Supervisor not found'
      });
    }

    if (targetProfile[0].role !== 'supervisor') {
      return res.status(400).json({
        error:
          'This endpoint can only remove supervisor accounts'
      });
    }

    const reviewedRequestRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.absence_requests
      WHERE reviewed_by = ${id}
    `;

    const createdShiftRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.shifts
      WHERE created_by = ${id}
    `;

    const reviewedRequestCount =
      reviewedRequestRows[0].count;

    const createdShiftCount =
      createdShiftRows[0].count;

    if (
      reviewedRequestCount > 0 ||
      createdShiftCount > 0
    ) {
      return res.status(409).json({
        error:
          'This supervisor cannot be removed because they have existing system records',
        reviewedRequests: reviewedRequestCount,
        createdShifts: createdShiftCount
      });
    }

    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error(
        'Admin delete supervisor Auth error:',
        authError
      );

      return res.status(400).json({
        error: authError.message
      });
    }

    await sql`
      DELETE FROM public.profiles
      WHERE id = ${id}
    `;

    res.json({
      success: true,
      message: 'Supervisor account removed successfully',
      supervisor: {
        id: targetProfile[0].id,
        name:
          `${targetProfile[0].first_name || ''} ${targetProfile[0].last_name || ''}`.trim(),
        email: targetProfile[0].student_email || ''
      }
    });

  } catch (error) {
    console.error(
      'Admin delete supervisor error:',
      error
    );

    res.status(500).json({
      error: 'Could not remove supervisor account'
    });
  }
});


// ============================================
// Admin - Edit Student Assistant Account
// ============================================

// PATCH /api/admin/assistants/:id
router.patch('/admin/assistants/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can edit student assistant accounts'
      });
    }

    const { id } = req.params;

    const targetProfile = await sql`
      SELECT
        id,
        first_name,
        last_name,
        student_number,
        course,
        level_of_study,
        student_email,
        cell_number,
        personal_email,
        role
      FROM public.profiles
      WHERE id = ${id}
    `;

    if (targetProfile.length === 0) {
      return res.status(404).json({
        error: 'Student assistant not found'
      });
    }

    if (targetProfile[0].role !== 'student') {
      return res.status(400).json({
        error:
          'This endpoint can only edit student assistant accounts'
      });
    }

    const {
      first_name,
      last_name,
      student_number,
      course,
      level_of_study,
      cell_number,
      personal_email
    } = req.body;

    const hasUpdate =
      first_name !== undefined ||
      last_name !== undefined ||
      student_number !== undefined ||
      course !== undefined ||
      level_of_study !== undefined ||
      cell_number !== undefined ||
      personal_email !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    if (student_number !== undefined) {
      const duplicateStudentNumber = await sql`
        SELECT id
        FROM public.profiles
        WHERE student_number = ${student_number}
          AND id <> ${id}
        LIMIT 1
      `;

      if (duplicateStudentNumber.length > 0) {
        return res.status(409).json({
          error:
            'A user with this student number already exists'
        });
      }
    }

    const updatedRows = await sql`
      UPDATE public.profiles
      SET
        first_name = COALESCE(${first_name ?? null}, first_name),
        last_name = COALESCE(${last_name ?? null}, last_name),
        student_number = COALESCE(${student_number ?? null}, student_number),
        course = COALESCE(${course ?? null}, course),
        level_of_study = COALESCE(${level_of_study ?? null}, level_of_study),
        cell_number = COALESCE(${cell_number ?? null}, cell_number),
        personal_email = COALESCE(${personal_email ?? null}, personal_email)
      WHERE id = ${id}
        AND role = 'student'
      RETURNING
        id,
        first_name,
        last_name,
        student_number,
        course,
        level_of_study,
        student_email,
        cell_number,
        personal_email,
        role,
        created_at
    `;

    if (updatedRows.length === 0) {
      return res.status(404).json({
        error: 'Student assistant could not be updated'
      });
    }

    const profile = updatedRows[0];

    res.json({
      success: true,
      message:
        'Student assistant details updated successfully',
      assistant: {
        id: profile.id,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        studentNumber: profile.student_number || '',
        course: profile.course || '',
        levelOfStudy: profile.level_of_study || '',
        studentEmail: profile.student_email || '',
        cellNumber: profile.cell_number || '',
        personalEmail: profile.personal_email || '',
        role: profile.role,
        createdAt: profile.created_at
      }
    });

  } catch (error) {
    console.error(
      'Admin edit assistant error:',
      error
    );

    res.status(500).json({
      error: 'Could not update student assistant account'
    });
  }
});


// ============================================
// Admin - Edit Supervisor Account
// ============================================

// PATCH /api/admin/supervisors/:id
router.patch('/admin/supervisors/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can edit supervisor accounts'
      });
    }

    const { id } = req.params;

    const targetProfile = await sql`
      SELECT
        id,
        first_name,
        last_name,
        student_email,
        cell_number,
        personal_email,
        role
      FROM public.profiles
      WHERE id = ${id}
    `;

    if (targetProfile.length === 0) {
      return res.status(404).json({
        error: 'Supervisor not found'
      });
    }

    if (targetProfile[0].role !== 'supervisor') {
      return res.status(400).json({
        error:
          'This endpoint can only edit supervisor accounts'
      });
    }

    const {
      first_name,
      last_name,
      cell_number,
      personal_email
    } = req.body;

    const hasUpdate =
      first_name !== undefined ||
      last_name !== undefined ||
      cell_number !== undefined ||
      personal_email !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    const updatedRows = await sql`
      UPDATE public.profiles
      SET
        first_name = COALESCE(${first_name ?? null}, first_name),
        last_name = COALESCE(${last_name ?? null}, last_name),
        cell_number = COALESCE(${cell_number ?? null}, cell_number),
        personal_email = COALESCE(${personal_email ?? null}, personal_email)
      WHERE id = ${id}
        AND role = 'supervisor'
      RETURNING
        id,
        first_name,
        last_name,
        student_email,
        cell_number,
        personal_email,
        role,
        created_at
    `;

    if (updatedRows.length === 0) {
      return res.status(404).json({
        error: 'Supervisor could not be updated'
      });
    }

    const profile = updatedRows[0];

    res.json({
      success: true,
      message: 'Supervisor details updated successfully',
      supervisor: {
        id: profile.id,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        studentEmail: profile.student_email || '',
        cellNumber: profile.cell_number || '',
        personalEmail: profile.personal_email || '',
        role: profile.role,
        createdAt: profile.created_at
      }
    });

  } catch (error) {
    console.error(
      'Admin edit supervisor error:',
      error
    );

    res.status(500).json({
      error: 'Could not update supervisor account'
    });
  }
});


// ============================================
// Export router
// ============================================

export default router;