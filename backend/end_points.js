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
  // Local verification â€” no network round-trip to Supabase Auth.
  const user = await verifyToken(token);
  if (user) {
    const profile = await sql`
      SELECT registration_status
      FROM public.profiles
      WHERE id = ${user.id}
      LIMIT 1
    `;
    if (profile[0]?.registration_status && profile[0].registration_status !== 'approved') {
      return null;
    }
    await recordUserPresence(user.id, req);
  }
  return user;
}

const router = express.Router();
const MAX_SUPPORTING_DOCUMENT_BYTES = 5 * 1024 * 1024;
const DOCUMENT_REQUIRED_TYPES = new Set(['sick leave', 'exam leave']);
const ONLINE_WINDOW_MINUTES = 5;

async function recordUserPresence(userId, req) {
  try {
    await sql`
      INSERT INTO public.user_presence (user_id, ip_address, user_agent, last_seen_at)
      VALUES (
        ${userId},
        ${req.ip || null},
        ${String(req.get('user-agent') || '').slice(0, 512) || null},
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        last_seen_at = EXCLUDED.last_seen_at
    `;
  } catch (error) {
    console.error('Record user presence error:', error);
  }
}

async function createNotification({ userId, type, title, message }) {
  if (!userId || !type || !title || !message) {
    console.error('Notification creation skipped: required values are missing');
    return null;
  }

  try {
    const existing = await sql`
      SELECT id
      FROM public.notifications
      WHERE user_id = ${userId}
        AND type = ${type}
        AND title = ${title}
        AND message = ${message}
      LIMIT 1
    `;
    if (existing.length > 0) return existing[0];

    const rows = await sql`
      INSERT INTO public.notifications (user_id, type, title, message, is_read)
      VALUES (${userId}, ${type}, ${title}, ${message}, FALSE)
      RETURNING id, user_id, type, title, message, is_read, created_at
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

async function notifyProfiles({ role, type, title, message }) {
  try {
    const recipients = await sql`
      SELECT id
      FROM public.profiles
      WHERE role = ${role}
        AND account_status = 'active'
        AND registration_status = 'approved'
    `;
    await Promise.all(recipients.map(({ id }) => createNotification({
      userId: id,
      type,
      title,
      message
    })));
  } catch (error) {
    console.error(`Notify ${role}s error:`, error);
  }
}

function parseSupportingDocument(value) {
  if (!value) return { document: null, error: null };
  if (typeof value !== 'object' || typeof value.fileName !== 'string' || typeof value.dataUrl !== 'string') {
    return { document: null, error: 'Choose a valid PNG or JPG supporting document.' };
  }

  const match = value.dataUrl.match(/^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return { document: null, error: 'Supporting documents must be PNG or JPG images.' };

  const [, contentType, encoded] = match;
  const contents = Buffer.from(encoded, 'base64');
  if (contents.length === 0 || contents.length > MAX_SUPPORTING_DOCUMENT_BYTES) {
    return { document: null, error: 'Supporting document must be no larger than 5 MB.' };
  }
  if (contents.toString('base64') !== encoded) {
    return { document: null, error: 'The supporting document is invalid.' };
  }

  const isPng = contentType === 'image/png'
    && contents.length >= 8
    && contents.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = contentType === 'image/jpeg'
    && contents.length >= 3
    && contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff;
  if (!isPng && !isJpeg) return { document: null, error: 'The selected file does not match its PNG or JPG format.' };

  const fileName = value.fileName.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255);
  if (!fileName) return { document: null, error: 'The supporting document must have a file name.' };

  return {
    document: { fileName, contentType, size: contents.length, data: encoded },
    error: null,
  };
}

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again later.'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.'
  }
});


const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
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

// POST /api/auth/resend-signup-otp
router.post('/auth/resend-signup-otp', otpLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email
    });

    if (error) {
      console.error('Resend signup OTP error:', error);
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'A new verification code was sent to your email.',
      registrationComplete: false
    });
  } catch (error) {
    console.error('Resend signup OTP server error:', error);
    res.status(500).json({
      error: 'Could not resend the verification code'
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
      type: 'signup'
    });

    if (error) {
      console.error('Verify OTP error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    const verifiedProfile = await sql`
      UPDATE public.profiles
      SET email_verified_at = COALESCE(email_verified_at, NOW())
      WHERE id = ${data.user.id}
      RETURNING registration_status
    `;
    if (verifiedProfile.length === 0) {
      return res.status(404).json({ error: 'Registration profile not found' });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      registrationComplete: Boolean(data.user?.email_confirmed_at),
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

    const pendingProfile = await sql`
      INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        student_number,
        course,
        level_of_study,
        student_email,
        cell_number,
        role,
        registration_status,
        email_verified_at,
        registration_rejection_reason,
        registration_reviewed_by,
        registration_reviewed_at
      )
      VALUES (
        ${authData.user.id},
        ${first_name},
        ${last_name},
        ${student_number || null},
        ${course || null},
        ${level_of_study || null},
        ${student_email},
        ${cell_number || null},
        ${signupRole},
        'pending',
        NULL,
        NULL,
        NULL,
        NULL
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
        role = EXCLUDED.role,
        registration_status = 'pending',
        email_verified_at = NULL,
        registration_rejection_reason = NULL,
        registration_reviewed_by = NULL,
        registration_reviewed_at = NULL
      RETURNING id
    `;
    if (pendingProfile.length === 0) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: 'Registration profile could not be prepared'
      });
    }
    await notifyProfiles({
      role: 'admin',
      type: 'registration_pending',
      title: 'New registration awaiting approval',
      message: `${first_name} ${last_name} submitted a new ${signupRole} registration for review.`
    });

    res.status(202).json({
      success: true,
      registrationComplete: false,
      approvalStatus: 'pending',
      message: 'Registration pending. Verify your email with the OTP to complete registration.',
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
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!data.user?.email_confirmed_at) {
      return res.status(403).json({
        error: 'Please verify your email with the OTP before logging in.'
      });
    }

    const profile = await sql`
      SELECT * FROM profiles WHERE id = ${data.user.id}
    `;

    if (profile.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (profile[0].registration_status === 'pending') {
      return res.status(403).json({
        error: 'Your email is verified, but your registration is awaiting administrator approval.',
        code: 'REGISTRATION_PENDING'
      });
    }

    if (profile[0].registration_status === 'rejected') {
      return res.status(403).json({
        error: 'Your registration was rejected by an administrator.',
        code: 'REGISTRATION_REJECTED',
        reason: profile[0].registration_rejection_reason || null
      });
    }

    if (profile[0].account_status === 'disabled') {
  return res.status(403).json({
    error: 'This account has been disabled. Please contact an administrator.'
  });
}

    if (role && profile[0].role !== role) {
      return res.status(403).json({ error: 'Incorrect account type' });
    }

    await recordUserPresence(data.user.id, req);

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

router.get('/notifications', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true';
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
    const rows = await sql`
      SELECT id, type, title, message, is_read, created_at
      FROM public.notifications
      WHERE user_id = ${user.id}
        AND (${unreadOnly} = FALSE OR is_read = FALSE)
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    res.json({
      success: true,
      notifications: rows.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        isRead: row.is_read,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Could not load notifications' });
  }
});

router.get('/notifications/unread-count', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await sql`
      SELECT COUNT(*)::int AS unread_count
      FROM public.notifications
      WHERE user_id = ${user.id} AND is_read = FALSE
    `;
    res.json({ success: true, unreadCount: rows[0]?.unread_count || 0 });
  } catch (error) {
    console.error('Unread notification count error:', error);
    res.status(500).json({ error: 'Could not load unread notification count' });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await sql`
      UPDATE public.notifications
      SET is_read = TRUE
      WHERE id = ${req.params.id} AND user_id = ${user.id}
      RETURNING id, is_read
    `;
    if (!rows.length) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true, notification: rows[0] });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Could not update notification' });
  }
});

router.patch('/notifications/read-all', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await sql`
      UPDATE public.notifications
      SET is_read = TRUE
      WHERE user_id = ${user.id} AND is_read = FALSE
      RETURNING id
    `;
    res.json({ success: true, updatedCount: rows.length });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Could not update notifications' });
  }
});

router.delete('/notifications', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await sql`
      DELETE FROM public.notifications
      WHERE user_id = ${user.id}
      RETURNING id
    `;
    res.json({ success: true, deletedCount: rows.length });
  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ error: 'Could not clear notifications' });
  }
});

// POST /api/requests â€” create a new absence request
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
    const parsedDocument = parseSupportingDocument(req.body.supportingDocument);
    if (parsedDocument.error) return res.status(400).json({ error: parsedDocument.error });
    if (DOCUMENT_REQUIRED_TYPES.has(String(type).trim().toLowerCase()) && !parsedDocument.document) {
      return res.status(400).json({ error: 'A supporting document is required for Sick Leave and Exam Leave.' });
    }

    // Single query: INSERT + fetch profile in one round-trip.
    const rows = await sql`
      WITH inserted AS (
        INSERT INTO public.absence_requests (user_id, type, date_range, detail, replacement, reason, supporting_document)
        VALUES (
          ${user.id},
          ${type},
          ${finalDateRange || null},
          ${detail || null},
          ${replacement || null},
          ${reason || null},
          ${parsedDocument.document ? sql.json(parsedDocument.document) : null}
        )
        RETURNING
          id,
          user_id,
          type,
          status,
          date_range,
          detail,
          replacement,
          reason,
          created_at,
          CASE
          WHEN jsonb_typeof(supporting_document) = 'object'
          THEN supporting_document - 'data'
          ELSE NULL
        END AS supporting_document
      )
      SELECT i.*, p.first_name, p.last_name
      FROM inserted i
      JOIN public.profiles p ON p.id = i.user_id
    `;
    const row = rows[0];
    await createNotification({
      userId: user.id,
      type: 'leave_request_submitted',
      title: 'Leave request submitted',
      message: `Your ${row.type} request (${row.id}) has been submitted and is awaiting review.`
    });
    await notifyProfiles({
      role: 'supervisor',
      type: 'leave_request_pending',
      title: 'New leave request',
      message: `${row.first_name || 'A student'} submitted ${row.type} request ${row.id} for review.`
    });

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
      supportingDocument: row.supporting_document ? {
        fileName: row.supporting_document.fileName,
        contentType: row.supporting_document.contentType,
        size: row.supporting_document.size,
      } : null,
      filed: 'Filed recently',
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Could not create request' });
  }
});

// GET /api/requests â€” list requests (students see own, supervisors see all)
router.get('/requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Single query: it figures out the caller's role AND fetches requests in one shot.
    const rows = await sql`
      SELECT
        r.id,
        r.user_id,
        r.type,
        r.status,
        r.date_range,
        r.detail,
        r.replacement,
        r.reason,
        r.created_at,
        CASE
          WHEN jsonb_typeof(r.supporting_document) = 'object'
          THEN r.supporting_document - 'data'
          ELSE NULL
        END AS supporting_document,
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
      supportingDocument: row.supporting_document ? {
        fileName: row.supporting_document.fileName,
        contentType: row.supporting_document.contentType,
        size: row.supporting_document.size,
      } : null,
      filed: 'Filed recently',
      createdAt: row.created_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List requests error:', err);
    res.status(500).json({ error: 'Could not load requests' });
  }
});

// PATCH /api/requests/:id — update a student's pending request.
router.patch('/requests/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existingRows = await sql`
      SELECT type, supporting_document, status
      FROM public.absence_requests
      WHERE id = ${req.params.id} AND user_id = ${user.id}
      LIMIT 1
    `;
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Request not found' });
    if (existing.status !== 'Pending') {
      return res.status(409).json({ error: 'Only pending requests can be edited.' });
    }

    const type = req.body.type ?? existing.type;
    if (typeof type !== 'string' || !type.trim()) {
      return res.status(400).json({ error: 'Request type is required' });
    }

    const hasDocument = Object.prototype.hasOwnProperty.call(req.body, 'supportingDocument');
    const parsedDocument = hasDocument
      ? parseSupportingDocument(req.body.supportingDocument)
      : { document: existing.supporting_document, error: null };
    if (parsedDocument.error) return res.status(400).json({ error: parsedDocument.error });
    if (DOCUMENT_REQUIRED_TYPES.has(type.trim().toLowerCase()) && !parsedDocument.document) {
      return res.status(400).json({ error: 'A supporting document is required for Sick Leave and Exam Leave.' });
    }

    const dateRange = req.body.dateRange ?? req.body.date_range;
    const detail = req.body.detail ?? req.body.comments ?? null;
    const replacement = req.body.replacement ?? null;
    const reason = req.body.reason ?? null;
    const updated = await sql`
      UPDATE public.absence_requests
      SET
        type = ${type.trim()},
        date_range = ${dateRange || null},
        detail = ${detail || null},
        replacement = ${replacement || null},
        reason = ${reason || null},
        supporting_document = ${parsedDocument.document ? sql.json(parsedDocument.document) : null}
      WHERE id = ${req.params.id}
        AND user_id = ${user.id}
        AND status = 'Pending'
      RETURNING id, status
    `;
    if (!updated.length) {
      return res.status(409).json({ error: 'This request is no longer pending and cannot be edited.' });
    }
    res.json({ message: 'Request updated', rawId: updated[0].id, status: updated[0].status });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Could not update request' });
  }
});

// DELETE /api/requests/:id — mark a student's pending request as cancelled.
router.delete('/requests/:id', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const cancelled = await sql`
      UPDATE public.absence_requests
      SET status = 'Cancelled'
      WHERE id = ${req.params.id}
        AND user_id = ${user.id}
        AND status = 'Pending'
      RETURNING id, status
    `;
    if (!cancelled.length) {
      const ownedRequest = await sql`
        SELECT status FROM public.absence_requests
        WHERE id = ${req.params.id} AND user_id = ${user.id}
        LIMIT 1
      `;
      if (!ownedRequest.length) return res.status(404).json({ error: 'Request not found' });
      return res.status(409).json({ error: 'Only pending requests can be cancelled.' });
    }
    res.json({ message: 'Request cancelled', rawId: cancelled[0].id, status: cancelled[0].status });
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ error: 'Could not cancel request' });
  }
});

// PATCH /api/requests/:id/status â€” supervisor approves or rejects
router.get('/requests/:id/document', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const caller = await sql`SELECT role FROM public.profiles WHERE id = ${user.id} LIMIT 1`;
    if (!caller.length) return res.status(403).json({ error: 'User profile not found' });

    const rows = await sql`
      SELECT user_id, supporting_document
      FROM public.absence_requests
      WHERE id = ${req.params.id}
      LIMIT 1
    `;
    if (!rows.length) return res.status(404).json({ error: 'Request not found' });
    if (String(rows[0].user_id) !== String(user.id) && caller[0].role !== 'supervisor' && caller[0].role !== 'admin') {
      return res.status(403).json({ error: 'You are not allowed to view this supporting document' });
    }
    if (!rows[0].supporting_document) {
      return res.status(404).json({ error: 'No supporting document was attached to this request' });
    }

    const document = rows[0].supporting_document;
        if (
      typeof document !== 'object' ||
      typeof document.contentType !== 'string' ||
      typeof document.data !== 'string'
    ) {
      return res.status(422).json({ error: 'The supporting document is missing or malformed.' });
    }
    res.set('Cache-Control', 'no-store');
    res.json({
      fileName: document.fileName,
      contentType: document.contentType,
      size: document.size,
      dataUrl: `data:${document.contentType};base64,${document.data}`,
    });
  } catch (err) {
    console.error('Load request document error:', err);
    res.status(500).json({ error: 'Could not load the supporting document' });
  }
});

// GET /api/admin/requests — read-only aggregate of leave and shift-swap requests.
// Filtering is performed here so an admin never has to download unrelated requests.
router.get('/admin/requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const caller = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id} LIMIT 1
    `;
    if (caller[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view all requests' });
    }

    const query = String(req.query.q || '').trim();
    const status = String(req.query.status || '').trim();
    const type = String(req.query.type || '').trim().toLowerCase();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();
    const validDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (!validDate(from) || !validDate(to)) {
      return res.status(400).json({ error: 'Date filters must use YYYY-MM-DD format' });
    }
    if (from && to && from > to) {
      return res.status(400).json({ error: 'The start date cannot be after the end date' });
    }
    if (type && !['leave', 'shift-swap'].includes(type)) {
      return res.status(400).json({ error: 'Request type must be leave or shift-swap' });
    }
    const statuses = new Set(['pending', 'approved', 'declined', 'cancelled']);
    if (status && !statuses.has(status.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid request status filter' });
    }

    const leaveRows = type === 'shift-swap' ? [] : await sql`
      SELECT
        r.id, r.type, r.status, r.date_range, r.detail, r.replacement, r.reason,
        r.created_at, r.reviewed_by, r.reviewed_at, r.supporting_document,
        p.id AS student_id, p.first_name, p.last_name, p.student_number,
        p.student_email, reviewer.first_name AS reviewer_first_name,
        reviewer.last_name AS reviewer_last_name
      FROM public.absence_requests r
      JOIN public.profiles p ON p.id = r.user_id
      LEFT JOIN public.profiles reviewer ON reviewer.id = r.reviewed_by
      WHERE (
        ${query} = ''
        OR concat_ws(' ', p.first_name, p.last_name, p.student_number, p.student_email) ILIKE ${`%${query}%`}
        OR concat_ws(' ', r.type, r.date_range, r.reason, r.detail) ILIKE ${`%${query}%`}
      )
      AND (${status} = '' OR lower(r.status) = ${status.toLowerCase()})
      AND (${from} = '' OR r.created_at::date >= ${from || '1900-01-01'}::date)
      AND (${to} = '' OR r.created_at::date <= ${to || '9999-12-31'}::date)
      ORDER BY r.created_at DESC
    `;

    const swapRows = type === 'leave' ? [] : await sql`
      SELECT
        r.id, r.status, r.reason, r.colleague_reason, r.supervisor_reason,
        r.created_at, r.colleague_decided_at, r.supervisor_decided_at,
        r.requester_user_id, r.colleague_user_id,
        requester.first_name AS requester_first_name,
        requester.last_name AS requester_last_name,
        requester.student_number AS requester_student_number,
        requester.student_email AS requester_email,
        colleague.first_name AS colleague_first_name,
        colleague.last_name AS colleague_last_name,
        requester_shift.shift_date AS requester_shift_date,
        requester_shift.start_time AS requester_start_time,
        requester_shift.end_time AS requester_end_time,
        colleague_shift.shift_date AS colleague_shift_date,
        colleague_shift.start_time AS colleague_start_time,
        colleague_shift.end_time AS colleague_end_time
      FROM public.shift_swap_requests r
      JOIN public.profiles requester ON requester.id = r.requester_user_id
      JOIN public.profiles colleague ON colleague.id = r.colleague_user_id
      JOIN public.shifts requester_shift ON requester_shift.id = r.requester_shift_id
      JOIN public.shifts colleague_shift ON colleague_shift.id = r.colleague_shift_id
      WHERE (
        ${query} = ''
        OR concat_ws(' ', requester.first_name, requester.last_name, requester.student_number, requester.student_email) ILIKE ${`%${query}%`}
        OR concat_ws(' ', r.reason, r.colleague_reason, r.supervisor_reason) ILIKE ${`%${query}%`}
      )
      AND (
        ${status} = ''
        OR (${status.toLowerCase()} = 'pending' AND r.status IN ('pending_colleague', 'pending_supervisor'))
        OR (${status.toLowerCase()} = 'approved' AND r.status = 'approved')
        OR (${status.toLowerCase()} = 'declined' AND r.status = 'rejected')
      )
      AND (${from} = '' OR r.created_at::date >= ${from || '1900-01-01'}::date)
      AND (${to} = '' OR r.created_at::date <= ${to || '9999-12-31'}::date)
      ORDER BY r.created_at DESC
    `;

    const leave = leaveRows.map((row) => ({
      id: `REQ-${String(row.id).padStart(3, '0')}`,
      rawId: row.id,
      requestType: 'Leave',
      requestDate: row.created_at,
      requestedDate: row.date_range,
      status: row.status,
      decision: ['Approved', 'Rejected'].includes(row.status) ? row.status : 'Pending',
      studentAssistant: {
        id: row.student_id,
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
        studentNumber: row.student_number || '',
        email: row.student_email || '',
      },
      reason: row.reason || row.detail || '',
      details: { leaveType: row.type || '', dates: row.date_range || '', replacement: row.replacement || '' },
      supportingDocument: row.supporting_document ? {
        fileName: row.supporting_document.fileName,
        contentType: row.supporting_document.contentType,
        size: row.supporting_document.size,
      } : null,
      supervisorDecision: row.reviewed_at ? {
        decision: row.status,
        comments: '',
        decisionDate: row.reviewed_at,
        supervisor: `${row.reviewer_first_name || ''} ${row.reviewer_last_name || ''}`.trim() || null,
      } : null,
      approvalHistory: row.reviewed_at ? [{ status: row.status, date: row.reviewed_at }] : [{ status: row.status, date: row.created_at }],
    }));

    const swaps = swapRows.map((row) => {
      const status = row.status === 'approved' ? 'Approved' : row.status === 'rejected' ? 'Declined' : 'Pending';
      const requesterName = `${row.requester_first_name || ''} ${row.requester_last_name || ''}`.trim() || 'Unknown';
      const colleagueName = `${row.colleague_first_name || ''} ${row.colleague_last_name || ''}`.trim() || 'Unknown';
      return {
        id: `SWAP-${row.id}`,
        rawId: row.id,
        requestType: 'Shift Swap',
        requestDate: row.created_at,
        requestedDate: row.requester_shift_date,
        status,
        decision: status,
        studentAssistant: {
          id: row.requester_user_id,
          name: requesterName,
          studentNumber: row.requester_student_number || '',
          email: row.requester_email || '',
        },
        reason: row.reason || '',
        details: {
          originalShift: { date: row.requester_shift_date, start: row.requester_start_time, end: row.requester_end_time },
          proposedShift: { date: row.colleague_shift_date, start: row.colleague_start_time, end: row.colleague_end_time },
          replacementStudentAssistant: colleagueName,
          replacementResponse: row.colleague_reason || null,
        },
        supervisorDecision: row.supervisor_decided_at ? {
          decision: status,
          comments: row.supervisor_reason || '',
          decisionDate: row.supervisor_decided_at,
        } : null,
        approvalHistory: [
          { status: 'Submitted', date: row.created_at },
          ...(row.colleague_decided_at ? [{ status: row.status === 'rejected' && !row.supervisor_decided_at ? 'Declined by replacement' : 'Accepted by replacement', date: row.colleague_decided_at }] : []),
          ...(row.supervisor_decided_at ? [{ status, date: row.supervisor_decided_at }] : []),
        ],
      };
    });

    res.json({ requests: [...leave, ...swaps].sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)) });
  } catch (error) {
    console.error('Admin list all requests error:', error);
    res.status(500).json({ error: 'Could not load all requests' });
  }
});

// PATCH /api/requests/:id/status — supervisor approves or rejects
// PATCH /api/requests/:id/status — supervisor approves or rejects
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can update request status' });
    }

    let { id } = req.params;
    // If the frontend sends "REQ-001", strip it down to "1" for the database query
    if (String(id).includes('-')) {
      id = String(id).split('-').pop();
    }

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

// PATCH /api/profile â€” update the logged-in user's editable profile fields
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
        p.registration_status,
        p.registration_rejection_reason,
        COALESCE(COUNT(r.id), 0)::int AS total_requests,
        COALESCE(SUM(CASE WHEN r.status = 'Approved' THEN 1 ELSE 0 END), 0)::int AS approved_requests,
        COALESCE(SUM(CASE WHEN r.status = 'Pending' THEN 1 ELSE 0 END), 0)::int AS pending_requests,
        COALESCE(SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END), 0)::int AS rejected_requests
      FROM public.profiles p
      LEFT JOIN public.absence_requests r ON r.user_id = p.id
      WHERE p.role = 'student'
      GROUP BY p.id
      ORDER BY p.registration_status ASC, p.first_name ASC, p.last_name ASC
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
      // Send the real registration status so the frontend knows whether to show Approve/Decline buttons
      status: row.registration_status === 'approved' ? 'active' 
            : row.registration_status === 'rejected' ? 'declined' 
            : 'pending',
      rejectionReason: row.registration_rejection_reason || null,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List assistants error:', err);
    res.status(500).json({ error: 'Could not load assistants' });
  }
});

// ============================================
// Timetable endpoints
// ============================================

// Base64 PNG/JPG/PDF validation. 5 MB hard cap, same as absence documents.
const MAX_TIMETABLE_BYTES = 5 * 1024 * 1024;

function parseTimetablePayload(value) {
  if (!value || typeof value !== 'object') {
    return { file: null, error: 'Missing timetable payload' };
  }
  const { fileName, contentType, dataUrl } = value;
  if (typeof fileName !== 'string' || !fileName.trim()) {
    return { file: null, error: 'fileName is required' };
  }
  if (typeof contentType !== 'string' || !contentType.trim()) {
    return { file: null, error: 'contentType is required' };
  }
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return { file: null, error: 'dataUrl must be a data: URL' };
  }

  // dataUrl looks like: data:<mime>;base64,<payload>
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return { file: null, error: 'Malformed dataUrl' };
  const meta = dataUrl.slice(5, comma);        // "<mime>;base64"
  const encoded = dataUrl.slice(comma + 1);
  if (!meta.endsWith(';base64')) return { file: null, error: 'Only base64 payloads are supported' };

  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_TIMETABLE_BYTES) {
    return { file: null, error: 'Timetable must be between 1 byte and 5 MB.' };
  }
  if (buffer.toString('base64') !== encoded) {
    return { file: null, error: 'Malformed base64 payload' };
  }

  const allowed = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
  ]);
  if (!allowed.has(contentType)) {
    return { file: null, error: 'Timetable must be a PDF, PNG, or JPEG.' };
  }

  const safeName = fileName.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255);
  if (!safeName) return { file: null, error: 'Invalid fileName' };

  return {
    file: {
      fileName: safeName,
      contentType,
      size: buffer.length,
      data: encoded,
    },
    error: null,
  };
}

// POST /api/timetables — student uploads their timetable
router.post('/timetables', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'student') {
      return res.status(403).json({ error: 'Only students can upload timetables' });
    }

    const parsed = parseTimetablePayload(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    // One timetable per student — replace any existing upload.
    const rows = await sql`
      WITH deleted AS (
        DELETE FROM public.timetables WHERE user_id = ${user.id}
      )
      INSERT INTO public.timetables
        (user_id, file_name, content_type, file_size, data)
      VALUES (
        ${user.id},
        ${parsed.file.fileName},
        ${parsed.file.contentType},
        ${parsed.file.size},
        ${parsed.file.data}
      )
      RETURNING id, user_id, file_name, content_type, file_size, uploaded_at
    `;

    const row = rows[0];
    res.status(201).json({
      id: row.id,
      userId: row.user_id,
      fileName: row.file_name,
      contentType: row.content_type,
      fileSize: row.file_size,
      uploadedAt: row.uploaded_at,
    });
  } catch (err) {
    console.error('Upload timetable error:', err);
    res.status(500).json({ error: 'Could not upload timetable' });
  }
});

// GET /api/timetables — supervisor sees every upload, student sees own
router.get('/timetables', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    const role = callerProfile[0]?.role;
    if (!role) return res.status(404).json({ error: 'Profile not found' });

    let rows;
    if (role === 'supervisor' || role === 'admin') {
      rows = await sql`
        SELECT
          t.id, t.user_id, t.file_name, t.content_type, t.file_size, t.uploaded_at,
          p.first_name, p.last_name, p.student_number
        FROM public.timetables t
        JOIN public.profiles p ON p.id = t.user_id
        ORDER BY t.uploaded_at DESC
      `;
    } else {
      rows = await sql`
        SELECT
          t.id, t.user_id, t.file_name, t.content_type, t.file_size, t.uploaded_at,
          p.first_name, p.last_name, p.student_number
        FROM public.timetables t
        JOIN public.profiles p ON p.id = t.user_id
        WHERE t.user_id = ${user.id}
        ORDER BY t.uploaded_at DESC
      `;
    }

    const formatted = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      studentNumber: row.student_number || '',
      fileName: row.file_name,
      contentType: row.content_type,
      fileSize: row.file_size,
      uploadDate: row.uploaded_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List timetables error:', err);
    res.status(500).json({ error: 'Could not load timetables' });
  }
});

// GET /api/timetables/:id/file — returns the actual base64 data URL
router.get('/timetables/:id/file', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    const role = callerProfile[0]?.role;

    const rows = await sql`
      SELECT user_id, file_name, content_type, data
      FROM public.timetables
      WHERE id = ${req.params.id}
      LIMIT 1
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Timetable not found' });

    const row = rows[0];
    if (String(row.user_id) !== String(user.id) && role !== 'supervisor' && role !== 'admin') {
      return res.status(403).json({ error: 'You are not allowed to view this timetable' });
    }

    res.json({
      fileName: row.file_name,
      contentType: row.content_type,
      dataUrl: `data:${row.content_type};base64,${row.data}`,
    });
  } catch (err) {
    console.error('Load timetable file error:', err);
    res.status(500).json({ error: 'Could not load timetable file' });
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

    const body = req.body || {};

    // Accept camelCase and snake_case.
    const user_id    = body.user_id    ?? body.userId;
    const shift_date = body.shift_date ?? body.shiftDate;
    const start_time = body.start_time ?? body.startTime;
    let   end_time   = body.end_time   ?? body.endTime;
    const role       = body.role       ?? null;
    const location   = body.location   ?? body.position ?? null;
    const notes      = body.notes      ?? null;
    const duration   = body.duration   ?? null;

    if (!user_id || !shift_date || !start_time) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['user_id', 'shift_date', 'start_time'],
      });
    }

    // Derive end_time from duration if the client didn't send one.
    if (!end_time && duration) {
      const match = /^([0-9]{1,2}):([0-9]{2})$/.exec(String(start_time).trim());
      const hours = Number(String(duration).replace(/[^0-9.]/g, ''));
      if (match && !Number.isNaN(hours) && hours > 0) {
        const total = Number(match[1]) * 60 + Number(match[2]) + Math.round(hours * 60);
        const hh = String(Math.floor((total % (24 * 60)) / 60)).padStart(2, '0');
        const mm = String(total % 60).padStart(2, '0');
        end_time = `${hh}:${mm}`;
      }
    }

    if (!end_time) {
      return res.status(400).json({
        error: 'end_time is required (or send a duration so it can be derived)',
      });
    }

    const shiftDateValue = new Date(`${shift_date}T00:00:00`);
    const currentYear = new Date().getFullYear();
    if (
      Number.isNaN(shiftDateValue.getTime())
      || !/^\d{4}-\d{2}-\d{2}$/.test(shift_date)
      || shiftDateValue.getFullYear() !== currentYear
    ) {
      return res.status(400).json({ error: 'Only dates in the current year can be used to assign shifts.' });
    }

    const timeToMinutes = (value) => {
      if (!/^\d{2}:\d{2}$/.test(value)) return NaN;
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const startMinutes = timeToMinutes(start_time);
    const endMinutes = timeToMinutes(end_time);
    const day = shiftDateValue.getDay();
    const opening = day === 6 ? 9 * 60 : 8 * 60;
    const closing = day === 5 ? 16 * 60 : day === 6 ? 17 * 60 : 21 * 60;
    if (
      Number.isNaN(startMinutes)
      || Number.isNaN(endMinutes)
      || startMinutes < opening
      || endMinutes <= startMinutes
      || endMinutes > closing
    ) {
      const window = day === 5 ? '08:00 and 16:00' : day === 6 ? '09:00 and 17:00' : '08:00 and 21:00';
      return res.status(400).json({ error: `Shift times must fall between ${window}.` });
    }

    const rows = await sql`
      INSERT INTO public.shifts (user_id, shift_date, start_time, end_time, role, location, notes, created_by)
      VALUES (
        ${user_id},
        ${shift_date},
        ${start_time},
        ${end_time},
        ${role},
        ${location},
        ${notes},
        ${user.id}
      )
      RETURNING id, user_id, start_time, end_time, role, location, notes, created_by, created_at,
                TO_CHAR(shift_date, 'YYYY-MM-DD') AS shift_date
    `;

    const shiftRow = rows[0];

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

// GET /api/shifts â€” list shifts (students see own, supervisors see all)
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

// DELETE /api/shifts/:id â€” delete a shift (supervisors only)
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

// POST /api/refresh â€” exchange a refresh_token for a new access_token
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



// ============================================
// Admin endpoints
// ============================================

// GET /api/admin/registration-requests
router.get('/admin/registration-requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const caller = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id} LIMIT 1
    `;
    if (caller[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view registration requests' });
    }

    const status = String(req.query.status || 'pending').trim().toLowerCase();
    const role = String(req.query.role || '').trim().toLowerCase();
    const search = String(req.query.q || '').trim();
    if (!['pending', 'approved', 'rejected', 'all'].includes(status)) {
      return res.status(400).json({ error: 'Invalid registration status filter' });
    }
    if (role && !['student', 'supervisor'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or supervisor' });
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
        p.role,
        p.registration_status,
        p.registration_rejection_reason,
        p.registration_reviewed_by,
        p.registration_reviewed_at,
        p.email_verified_at,
        p.created_at,
        reviewer.first_name AS reviewer_first_name,
        reviewer.last_name AS reviewer_last_name
      FROM public.profiles p
      LEFT JOIN public.profiles reviewer ON reviewer.id = p.registration_reviewed_by
      WHERE p.role IN ('student', 'supervisor')
        AND (${status} = 'all' OR p.registration_status = ${status})
        AND (${role} = '' OR p.role = ${role})
        AND (
          ${search} = ''
          OR concat_ws(' ', p.first_name, p.last_name, p.student_number, p.student_email, p.personal_email, p.course)
            ILIKE ${`%${search}%`}
        )
      ORDER BY p.created_at DESC
    `;

    res.json({
      success: true,
      count: rows.length,
      requests: rows.map((row) => ({
        id: row.id,
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
        studentNumber: row.student_number || '',
        studentEmail: row.student_email || '',
        personalEmail: row.personal_email || '',
        course: row.course || '',
        levelOfStudy: row.level_of_study || '',
        cellNumber: row.cell_number || '',
        role: row.role,
        registrationStatus: row.registration_status,
        emailVerified: Boolean(row.email_verified_at),
        rejectionReason: row.registration_rejection_reason || null,
        reviewedAt: row.registration_reviewed_at || null,
        reviewer: row.registration_reviewed_by ? {
          id: row.registration_reviewed_by,
          name: `${row.reviewer_first_name || ''} ${row.reviewer_last_name || ''}`.trim() || 'Unknown'
        } : null,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Admin registration requests error:', error);
    res.status(500).json({ error: 'Could not load registration requests' });
  }
});

// PATCH /api/admin/registration-requests/:id/approve
router.patch('/admin/registration-requests/:id/approve', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const caller = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id} LIMIT 1
    `;
    if (caller[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can approve registrations' });
    }

    const rows = await sql`
      UPDATE public.profiles
      SET
        registration_status = 'approved',
        registration_rejection_reason = NULL,
        registration_reviewed_by = ${user.id},
        registration_reviewed_at = NOW()
      WHERE id = ${req.params.id}
        AND role IN ('student', 'supervisor')
        AND registration_status = 'pending'
        AND email_verified_at IS NOT NULL
      RETURNING id, first_name, last_name, student_email, role, registration_status, registration_reviewed_at
    `;
    if (rows.length === 0) {
      return res.status(409).json({
        error: 'Registration must be pending and email-verified before approval'
      });
    }

    await createNotification({
      userId: rows[0].id,
      type: 'registration_approved',
      title: 'Registration approved',
      message: 'Your registration has been approved. You can now log in.'
    });
    res.json({
      success: true,
      message: 'Registration approved successfully',
      registration: rows[0]
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({ error: 'Could not approve registration' });
  }
});

// PATCH /api/admin/registration-requests/:id/reject
router.patch('/admin/registration-requests/:id/reject', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const caller = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id} LIMIT 1
    `;
    if (caller[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can reject registrations' });
    }

    const reason = String(req.body.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ error: 'A rejection reason is required' });
    }

    const rows = await sql`
      UPDATE public.profiles
      SET
        registration_status = 'rejected',
        registration_rejection_reason = ${reason.slice(0, 1000)},
        registration_reviewed_by = ${user.id},
        registration_reviewed_at = NOW()
      WHERE id = ${req.params.id}
        AND role IN ('student', 'supervisor')
        AND registration_status = 'pending'
      RETURNING id, first_name, last_name, student_email, role, registration_status,
        registration_rejection_reason, registration_reviewed_at
    `;
    if (rows.length === 0) {
      return res.status(409).json({ error: 'Only pending registrations can be rejected' });
    }

    await createNotification({
      userId: rows[0].id,
      type: 'registration_rejected',
      title: 'Registration rejected',
      message: `Your registration was rejected: ${rows[0].registration_rejection_reason}`
    });
    res.json({
      success: true,
      message: 'Registration rejected successfully',
      registration: rows[0]
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({ error: 'Could not reject registration' });
  }
});


// GET /api/admin/overview
router.get('/admin/overview', async (req, res) => {
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
      LIMIT 1
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can view the admin overview'
      });
    }

    const totals = await sql`
      SELECT
        COUNT(*) FILTER (WHERE role = 'student')::int AS total_student_assistants,
        COUNT(*) FILTER (WHERE role = 'supervisor')::int AS total_supervisors,
        COUNT(*) FILTER (
          WHERE role = 'student' AND account_status = 'active'
        )::int AS active_student_assistants,
        COUNT(*) FILTER (
          WHERE role = 'supervisor' AND account_status = 'active'
        )::int AS active_supervisors,
        COUNT(*) FILTER (
          WHERE role = 'student' AND account_status = 'disabled'
        )::int AS disabled_student_assistants,
        COUNT(*) FILTER (
          WHERE role = 'supervisor' AND account_status = 'disabled'
        )::int AS disabled_supervisors,
        COUNT(*) FILTER (
          WHERE role IN ('student', 'supervisor') AND registration_status = 'pending'
        )::int AS pending_registrations
      FROM public.profiles
      WHERE role IN ('student', 'supervisor')
    `;

    res.json({
      success: true,
      overview: {
        totalStudentAssistants: totals[0].total_student_assistants,
        totalSupervisors: totals[0].total_supervisors,
        activeAccounts:
          totals[0].active_student_assistants +
          totals[0].active_supervisors,
        disabledAccounts:
          totals[0].disabled_student_assistants +
          totals[0].disabled_supervisors,
        activeStudentAssistants: totals[0].active_student_assistants,
        activeSupervisors: totals[0].active_supervisors,
        disabledStudentAssistants: totals[0].disabled_student_assistants,
        disabledSupervisors: totals[0].disabled_supervisors,
        pendingRegistrations: totals[0].pending_registrations
      }
    });

  } catch (error) {
    console.error('Admin overview error:', error);

    res.status(500).json({
      error: 'Could not load admin overview'
    });
  }
});

// GET /api/admin/active-users — list active student assistants and supervisors.
router.get('/admin/active-users', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
      LIMIT 1
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can view active users'
      });
    }

    const search = String(req.query.q || '').trim();
    const requestedRole = String(req.query.role || '').trim().toLowerCase();
    if (requestedRole && !['student', 'supervisor'].includes(requestedRole)) {
      return res.status(400).json({
        error: 'Role must be student or supervisor'
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
        role,
        account_status,
        created_at,
        user_presence.ip_address AS presence_ip_address,
        user_presence.user_agent AS presence_user_agent,
        user_presence.last_seen_at AS presence_last_seen_at
      FROM public.profiles
      LEFT JOIN public.user_presence ON user_presence.user_id = profiles.id
      WHERE account_status = 'active'
        AND role IN ('student', 'supervisor')
        AND (${requestedRole} = '' OR role = ${requestedRole})
        AND (
          ${search} = ''
          OR concat_ws(
            ' ',
            first_name,
            last_name,
            student_number,
            student_email,
            personal_email,
            course
          ) ILIKE ${`%${search}%`}
        )
      ORDER BY first_name ASC, last_name ASC, created_at ASC
    `;

    const users = rows.map((row) => ({
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      studentNumber: row.student_number || '',
      studentEmail: row.student_email || '',
      personalEmail: row.personal_email || '',
      course: row.course || '',
      levelOfStudy: row.level_of_study || '',
      cellNumber: row.cell_number || '',
      role: row.role,
      accountStatus: row.account_status,
      createdAt: row.created_at,
      online: row.presence_last_seen_at
        ? new Date(row.presence_last_seen_at).getTime() >= Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000
        : false,
      ipAddress: row.presence_ip_address || null,
      lastSeenAt: row.presence_last_seen_at || null,
      userAgent: row.presence_user_agent || null
    }));

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Admin active users error:', error);
    res.status(500).json({
      error: 'Could not load active users'
    });
  }
});

// GET /api/admin/assistants
router.get('/admin/assistants', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check that the logged-in user is an admin
    const callerProfile = await sql`
      SELECT role
      FROM public.profiles
      WHERE id = ${user.id}
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can view assistants'
      });
    }

    // Get all student assistants
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
        account_status,
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
      accountStatus: row.account_status,
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
// Create a new student assistant account (admins only)
router.post('/admin/assistants', async (req, res) => {
  try {
    // 1. Verify that the request contains a valid admin token
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // 2. Check that the logged-in user is an admin
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

    // 3. Get the new assistant's details
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

    // 4. Validate required fields
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
        error: 'First name, last name, student number, course, level of study, student email and password are required'
      });
    }

    // 5. Check if the email or student number already exists
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

    // 6. Create the authentication account
    // The role is deliberately fixed to "student".
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
      console.error('Admin create assistant Auth error:', authError);

      return res.status(400).json({
        error: authError.message
      });
    }

    const newUserId = authData.user.id;

    try {
      // 7. Create/update the profile
      // This also works if your database trigger has already created
      // an empty profile row for the new Auth user.
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
          role,
          registration_status
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
          'student',
          'approved'
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
          role = 'student',
          registration_status = 'approved'
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
          registration_status,
          created_at
      `;

      const profile = profileRows[0];

      // 8. Return the newly created account
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
      console.error('Admin create assistant profile error:', profileError);

      // Remove the Auth user if creating the profile failed.
      // This prevents an Auth account from being left without
      // a corresponding profile.
      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      return res.status(500).json({
        error: 'Assistant account could not be completed'
      });
    }

  } catch (error) {
    console.error('Admin create assistant error:', error);

    return res.status(500).json({
      error: 'Could not create student assistant account'
    });
  }
});


// ============================================
// Admin - Supervisor Account Management
// ============================================

// GET /api/admin/supervisors
// View all supervisor accounts (admins only)
router.get('/admin/supervisors', async (req, res) => {
  try {
    // 1. Verify the logged-in user
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // 2. Verify that the logged-in user is an admin
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

    // 3. Get all supervisor profiles
    const rows = await sql`
      SELECT
        id,
        first_name,
        last_name,
        student_email,
        personal_email,
        cell_number,
        account_status,
        created_at
      FROM public.profiles
      WHERE role = 'supervisor'
      ORDER BY first_name ASC, last_name ASC
    `;

    // 4. Format the response
    const supervisors = rows.map((row) => ({
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
      studentEmail: row.student_email || '',
      personalEmail: row.personal_email || '',
      cellNumber: row.cell_number || '',
      accountStatus: row.account_status,
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
// Create a new supervisor account (admins only)
router.post('/admin/supervisors', async (req, res) => {
  try {
    // 1. Verify the person making the request
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // 2. Verify that the caller is an admin
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

    // 3. Get supervisor details
    const {
      first_name,
      last_name,
      student_email,
      cell_number,
      personal_email,
      password
    } = req.body;

    // 4. Validate required fields
    if (
      !first_name ||
      !last_name ||
      !student_email ||
      !password
    ) {
      return res.status(400).json({
        error: 'First name, last name, student email and password are required'
      });
    }

    // 5. Check whether this email is already in profiles
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

    // 6. Create the supervisor's Supabase Auth account
    // The role is deliberately fixed to "supervisor".
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
      console.error('Admin create supervisor Auth error:', authError);

      return res.status(400).json({
        error: authError.message
      });
    }

    const newUserId = authData.user.id;

    try {
      // 7. Create/update the supervisor profile
      const profileRows = await sql`
        INSERT INTO public.profiles (
          id,
          first_name,
          last_name,
          student_email,
          cell_number,
          personal_email,
          role,
          registration_status
        )
        VALUES (
          ${newUserId},
          ${first_name},
          ${last_name},
          ${student_email},
          ${cell_number || null},
          ${personal_email || null},
          'supervisor',
          'approved'
        )
        ON CONFLICT (id)
        DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          student_email = EXCLUDED.student_email,
          cell_number = EXCLUDED.cell_number,
          personal_email = EXCLUDED.personal_email,
          role = 'supervisor',
          registration_status = 'approved'
        RETURNING
          id,
          first_name,
          last_name,
          student_email,
          cell_number,
          personal_email,
          role,
          registration_status,
          created_at
      `;

      const profile = profileRows[0];

      // 8. Return the created account
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

      // Remove the Auth account if the profile could not be created.
      await supabaseAdmin.auth.admin.deleteUser(newUserId);

      return res.status(500).json({
        error: 'Supervisor account could not be completed'
      });
    }

  } catch (error) {
    console.error('Admin create supervisor error:', error);

    return res.status(500).json({
      error: 'Could not create supervisor account'
    });
  }
});



// ============================================
// Admin - Activate / Deactivate Student Assistant
// ============================================

// PATCH /api/admin/assistants/:id/status
router.patch('/admin/assistants/:id/status', async (req, res) => {
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
      LIMIT 1
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can activate or deactivate student assistants'
      });
    }

    const { id } = req.params;
    const { account_status } = req.body;

    if (!['active', 'disabled'].includes(account_status)) {
      return res.status(400).json({
        error: 'Account status must be active or disabled'
      });
    }

    const updatedRows = await sql`
      UPDATE public.profiles
      SET account_status = ${account_status}
      WHERE id = ${id}
        AND role = 'student'
      RETURNING
        id,
        first_name,
        last_name,
        student_email,
        role,
        account_status
    `;

    if (updatedRows.length === 0) {
      return res.status(404).json({
        error: 'Student assistant not found'
      });
    }

    const profile = updatedRows[0];

    res.json({
      success: true,
      message:
        account_status === 'disabled'
          ? 'Student assistant account deactivated successfully'
          : 'Student assistant account activated successfully',
      assistant: {
        id: profile.id,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        studentEmail: profile.student_email || '',
        role: profile.role,
        accountStatus: profile.account_status
      }
    });

  } catch (error) {
    console.error('Admin assistant status error:', error);

    res.status(500).json({
      error: 'Could not update student assistant account status'
    });
  }
});


// ============================================
// Admin - Remove Student Assistant Account
// ============================================

// DELETE /api/admin/assistants/:id
// Remove a student assistant account (admins only)
router.delete('/admin/assistants/:id', async (req, res) => {
  try {
    // 1. Verify the logged-in user
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // 2. Verify that the caller is an admin
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

    // 3. Make sure the target account exists and is a student
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
        error: 'This endpoint can only remove student assistant accounts'
      });
    }

    // 4. Check for linked absence requests
    const requestRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.absence_requests
      WHERE user_id = ${id}
    `;

    // 5. Check for linked shifts
    const shiftRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.shifts
      WHERE user_id = ${id}
    `;

    const requestCount = requestRows[0].count;
    const shiftCount = shiftRows[0].count;

    // Do not delete an account if it has operational history.
    if (requestCount > 0 || shiftCount > 0) {
      return res.status(409).json({
        error: 'This student assistant cannot be removed because they have existing system records',
        absenceRequests: requestCount,
        shifts: shiftCount
      });
    }

    // 6. Delete the Supabase Auth account
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Admin delete assistant Auth error:', authError);

      return res.status(400).json({
        error: authError.message
      });
    }

    // 7. Remove the profile if it was not automatically removed
    // by the auth.users foreign-key cascade.
    await sql`
      DELETE FROM public.profiles
      WHERE id = ${id}
    `;

    // 8. Return success
    res.json({
      success: true,
      message: 'Student assistant account removed successfully',
      assistant: {
        id: targetProfile[0].id,
        name: `${targetProfile[0].first_name || ''} ${targetProfile[0].last_name || ''}`.trim(),
        email: targetProfile[0].student_email || ''
      }
    });

  } catch (error) {
    console.error('Admin delete assistant error:', error);

    res.status(500).json({
      error: 'Could not remove student assistant account'
    });
  }
});



// ============================================
// Admin - Activate / Deactivate Supervisor
// ============================================

// PATCH /api/admin/supervisors/:id/status
router.patch('/admin/supervisors/:id/status', async (req, res) => {
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
      LIMIT 1
    `;

    if (callerProfile.length === 0) {
      return res.status(404).json({
        error: 'Admin profile not found'
      });
    }

    if (callerProfile[0].role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can activate or deactivate supervisors'
      });
    }

    const { id } = req.params;
    const { account_status } = req.body;

    if (!['active', 'disabled'].includes(account_status)) {
      return res.status(400).json({
        error: 'Account status must be active or disabled'
      });
    }

    const updatedRows = await sql`
      UPDATE public.profiles
      SET account_status = ${account_status}
      WHERE id = ${id}
        AND role = 'supervisor'
      RETURNING
        id,
        first_name,
        last_name,
        student_email,
        role,
        account_status
    `;

    if (updatedRows.length === 0) {
      return res.status(404).json({
        error: 'Supervisor not found'
      });
    }

    const profile = updatedRows[0];

    res.json({
      success: true,
      message:
        account_status === 'disabled'
          ? 'Supervisor account deactivated successfully'
          : 'Supervisor account activated successfully',
      supervisor: {
        id: profile.id,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        studentEmail: profile.student_email || '',
        role: profile.role,
        accountStatus: profile.account_status
      }
    });

  } catch (error) {
    console.error('Admin supervisor status error:', error);

    res.status(500).json({
      error: 'Could not update supervisor account status'
    });
  }
});


// ============================================
// Admin - Remove Supervisor Account
// ============================================

// DELETE /api/admin/supervisors/:id
// Remove a supervisor account (admins only)
router.delete('/admin/supervisors/:id', async (req, res) => {
  try {
    // 1. Verify the logged-in user
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // 2. Verify that the caller is an admin
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

    // 3. Prevent an admin from deleting their own account
    if (id === user.id) {
      return res.status(400).json({
        error: 'You cannot remove your own admin account'
      });
    }

    // 4. Make sure the target account exists and is a supervisor
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
        error: 'This endpoint can only remove supervisor accounts'
      });
    }

    // 5. Check whether this supervisor has reviewed requests
    const reviewedRequestRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.absence_requests
      WHERE reviewed_by = ${id}
    `;

    // 6. Check whether this supervisor created shifts
    const createdShiftRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM public.shifts
      WHERE created_by = ${id}
    `;

    const reviewedRequestCount = reviewedRequestRows[0].count;
    const createdShiftCount = createdShiftRows[0].count;

    // Protect existing system history
    if (reviewedRequestCount > 0 || createdShiftCount > 0) {
      return res.status(409).json({
        error: 'This supervisor cannot be removed because they have existing system records',
        reviewedRequests: reviewedRequestCount,
        createdShifts: createdShiftCount
      });
    }

    // 7. Delete the Supabase Auth account
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Admin delete supervisor Auth error:', authError);

      return res.status(400).json({
        error: authError.message
      });
    }

    // 8. Remove the profile
    await sql`
      DELETE FROM public.profiles
      WHERE id = ${id}
    `;

    // 9. Return success
    res.json({
      success: true,
      message: 'Supervisor account removed successfully',
      supervisor: {
        id: targetProfile[0].id,
        name: `${targetProfile[0].first_name || ''} ${targetProfile[0].last_name || ''}`.trim(),
        email: targetProfile[0].student_email || ''
      }
    });

  } catch (error) {
    console.error('Admin delete supervisor error:', error);

    res.status(500).json({
      error: 'Could not remove supervisor account'
    });
  }
});



// ============================================
// Admin - Edit Student Assistant Account
// ============================================

// PATCH /api/admin/assistants/:id
// Update student assistant account details (admins only)
router.patch('/admin/assistants/:id', async (req, res) => {
  try {
    // 1. Verify the logged-in user
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // 2. Verify that the caller is an admin
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

    // 3. Make sure the target account exists and is a student
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
        error: 'This endpoint can only edit student assistant accounts'
      });
    }

    // 4. Get the fields that can be edited
    const {
      first_name,
      last_name,
      student_number,
      course,
      level_of_study,
      cell_number,
      personal_email
    } = req.body;

    // 5. Make sure at least one field was supplied
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

    // 6. Check whether the new student number belongs to someone else
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
          error: 'A user with this student number already exists'
        });
      }
    }

    // 7. Update the profile
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

    // 8. Return updated account
    res.json({
      success: true,
      message: 'Student assistant details updated successfully',
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
    console.error('Admin edit assistant error:', error);

    res.status(500).json({
      error: 'Could not update student assistant account'
    });
  }
});



// ============================================
// Admin - Edit Supervisor Account
// ============================================

// PATCH /api/admin/supervisors/:id
// Update supervisor account details (admins only)
router.patch('/admin/supervisors/:id', async (req, res) => {
  try {
    // 1. Verify the logged-in user
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // 2. Verify that the caller is an admin
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

    // 3. Make sure the target account exists and is a supervisor
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
        error: 'This endpoint can only edit supervisor accounts'
      });
    }

    // 4. Get editable fields
    const {
      first_name,
      last_name,
      cell_number,
      personal_email
    } = req.body;

    // 5. Make sure at least one field was supplied
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

    // 6. Update the supervisor profile
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

    // 7. Return the updated account
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
    console.error('Admin edit supervisor error:', error);

    res.status(500).json({
      error: 'Could not update supervisor account'
    });
  }
});



/* ============================================
   Find Eligible Colleagues for Shift Swap
============================================ */

router.get('/eligible-colleagues', async (req, res) => {
  try {
    // Check if the user is logged in
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({
        error: 'Please log in to continue.'
      });
    }

    // Get the selected shift date
    const shiftDate = req.query.shift_date;
    const currentShiftDate = req.query.current_shift_date;

    if (!shiftDate || !currentShiftDate) {
      return res.status(400).json({
        error: 'Please provide both shift dates.'
      });
    }
    const validDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };
    if (!validDate(shiftDate) || !validDate(currentShiftDate)) {
      return res.status(400).json({ error: 'Shift dates must use YYYY-MM-DD format.' });
    }

    // Find active student colleagues with shifts
    // on the selected date
    const colleagues = await sql`
      SELECT
        p.id AS colleague_id,
        p.first_name,
        p.last_name,
        s.id AS shift_id,
        s.shift_date,
        s.start_time,
        s.end_time,
        s.role AS shift_role,
        s.location
      FROM public.profiles p
      INNER JOIN public.shifts s
        ON s.user_id = p.id
      WHERE p.role = 'student'
        AND p.account_status = 'active'
        AND p.id <> ${user.id}
        AND s.shift_date = ${shiftDate}::date
        AND NOT EXISTS (
          SELECT 1
          FROM public.shifts current_shift
          WHERE current_shift.user_id = p.id
            AND current_shift.shift_date = ${currentShiftDate}::date
        )
      ORDER BY
        s.start_time,
        p.first_name,
        p.last_name
    `;

    return res.status(200).json({
      message: 'Eligible colleagues retrieved successfully.',
      colleagues: colleagues
    });

  } catch (error) {
    console.error('Eligible colleagues error:', error);

    return res.status(500).json({
      error: 'Unable to retrieve eligible colleagues.'
    });
  }
});

// GET /api/shift-swap-requests — list offers relevant to the caller.
router.get('/shift-swap-requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const caller = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id} LIMIT 1
    `;
    if (!caller.length) return res.status(403).json({ error: 'User profile not found' });
    const supervisor = caller[0].role === 'supervisor';

    const rows = await sql`
      SELECT
        r.id,
        r.requester_user_id,
        r.colleague_user_id,
        r.requester_shift_id,
        r.colleague_shift_id,
        r.status,
        r.reason,
        r.colleague_reason,
        r.supervisor_reason,
        r.created_at,
        r.colleague_decided_at,
        r.supervisor_decided_at,
        requester.first_name AS requester_first_name,
        requester.last_name AS requester_last_name,
        colleague.first_name AS colleague_first_name,
        colleague.last_name AS colleague_last_name,
        TO_CHAR(requester_shift.shift_date, 'Mon FMDD, YYYY') AS requester_shift_date,
        TO_CHAR(colleague_shift.shift_date, 'Mon FMDD, YYYY') AS colleague_shift_date,
        requester_shift.start_time AS requester_start_time,
        requester_shift.end_time AS requester_end_time,
        colleague_shift.start_time AS colleague_start_time,
        colleague_shift.end_time AS colleague_end_time
      FROM public.shift_swap_requests r
      JOIN public.profiles requester ON requester.id = r.requester_user_id
      JOIN public.profiles colleague ON colleague.id = r.colleague_user_id
      JOIN public.shifts requester_shift ON requester_shift.id = r.requester_shift_id
      JOIN public.shifts colleague_shift ON colleague_shift.id = r.colleague_shift_id
      WHERE (
        ${supervisor}
        OR r.requester_user_id = ${user.id}
        OR r.colleague_user_id = ${user.id}
      )
      ORDER BY r.created_at DESC
    `;

    res.json(rows.map((row) => {
      const isRequester = String(row.requester_user_id) === String(user.id);
      const isColleague = String(row.colleague_user_id) === String(user.id);
      const requesterName = `${row.requester_first_name || ''} ${row.requester_last_name || ''}`.trim() || 'Unknown';
      const colleagueName = `${row.colleague_first_name || ''} ${row.colleague_last_name || ''}`.trim() || 'Unknown';
      const stage = row.status;
      let status;
      if (stage === 'pending_colleague') {
        status = isColleague ? 'Awaiting your response' : 'Awaiting colleague';
      } else if (stage === 'pending_supervisor') {
        status = supervisor ? 'Pending' : 'Colleague approved — Awaiting supervisor';
      } else if (stage === 'rejected' && row.supervisor_decided_at) {
        status = supervisor ? 'Rejected' : 'Declined by supervisor';
      } else if (stage === 'rejected') {
        status = 'Declined by colleague';
      } else if (stage === 'approved') {
        status = 'Approved';
      } else {
        status = stage;
      }
      const dateRange = `Swap from ${row.requester_shift_date} to ${row.colleague_shift_date}`;

      return {
        id: `SWAP-${row.id}`,
        rawId: row.id,
        workflow: 'shiftSwap',
        workflowStatus: stage,
        requesterUserId: row.requester_user_id,
        colleagueUserId: row.colleague_user_id,
        requesterShiftId: row.requester_shift_id,
        colleagueShiftId: row.colleague_shift_id,
        isRequester,
        isSwapRecipient: isColleague,
        name: requesterName,
        replacement: colleagueName,
        type: `Shift Swap – ${colleagueName}`,
        status,
        dateRange,
        detail: `${dateRange} with ${colleagueName}.`,
        reason: row.reason,
        colleagueReason: row.colleague_reason,
        supervisorReason: row.supervisor_reason,
        declineReason: row.supervisor_decided_at ? row.supervisor_reason : row.colleague_reason,
        requesterShiftTime: `${row.requester_start_time}–${row.requester_end_time}`,
        colleagueShiftTime: `${row.colleague_start_time}–${row.colleague_end_time}`,
        filed: 'Filed recently',
        createdAt: row.created_at,
        colleagueDecidedAt: row.colleague_decided_at,
        supervisorDecidedAt: row.supervisor_decided_at,
      };
    }));
  } catch (error) {
    console.error('List shift swap requests error:', error);
    res.status(500).json({ error: 'Could not load shift swap requests.' });
  }
});

/* ============================================
   Shift Swap Requests
============================================ */

// POST /api/shift-swap-requests
// A student requests to exchange their shift with a colleague's shift.
router.post('/shift-swap-requests', async (req, res) => {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      requester_shift_id,
      colleague_user_id,
      colleague_shift_id,
      reason
    } = req.body;

    if (
      !requester_shift_id ||
      !colleague_user_id ||
      !colleague_shift_id
    ) {
      return res.status(400).json({
        error: 'Your shift, colleague and colleague shift are required.'
      });
    }
    if (reason !== undefined && (typeof reason !== 'string' || reason.length > 100)) {
      return res.status(400).json({ error: 'Justification and comments must be 100 characters or fewer.' });
    }

    if (
      String(requester_shift_id) === String(colleague_shift_id) ||
      String(user.id) === String(colleague_user_id)
    ) {
      return res.status(400).json({
        error: 'Please select another colleague and a different shift.'
      });
    }

    // Confirm both shifts belong to the expected students.
    const shifts = await sql`
      SELECT id, user_id, shift_date
      FROM public.shifts
      WHERE id IN (
        ${requester_shift_id},
        ${colleague_shift_id}
      )
    `;

    const ownShift = shifts.find(
      shift => String(shift.id) === String(requester_shift_id)
    );

    const colleagueShift = shifts.find(
      shift => String(shift.id) === String(colleague_shift_id)
    );

    if (!ownShift || String(ownShift.user_id) !== String(user.id)) {
      return res.status(400).json({
        error: 'The selected shift does not belong to you.'
      });
    }

    if (
      !colleagueShift ||
      String(colleagueShift.user_id) !== String(colleague_user_id)
    ) {
      return res.status(400).json({
        error: 'The selected shift does not belong to the colleague.'
      });
    }
    const ownDate = new Date(ownShift.shift_date).toISOString().slice(0, 10);
    const colleagueDate = new Date(colleagueShift.shift_date).toISOString().slice(0, 10);
    if (ownDate === colleagueDate) {
      return res.status(400).json({ error: 'The replacement shift must be on a different date.' });
    }
    const colleagueConflict = await sql`
      SELECT id
      FROM public.shifts
      WHERE user_id = ${colleague_user_id}
        AND shift_date = ${ownDate}::date
        AND id <> ${colleague_shift_id}
      LIMIT 1
    `;
    if (colleagueConflict.length) {
      return res.status(409).json({ error: 'The selected colleague is not free on your current shift date.' });
    }

    // Prevent either shift from being involved in another
    // swap that has not reached a final decision.
    const existing = await sql`
      SELECT id
      FROM public.shift_swap_requests
      WHERE status IN ('pending_colleague', 'pending_supervisor')
        AND (
          requester_shift_id IN (
            ${requester_shift_id},
            ${colleague_shift_id}
          )
          OR colleague_shift_id IN (
            ${requester_shift_id},
            ${colleague_shift_id}
          )
        )
      LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'One of these shifts already has a pending swap request.'
      });
    }

    const inserted = await sql`
      INSERT INTO public.shift_swap_requests (
        requester_user_id,
        colleague_user_id,
        requester_shift_id,
        colleague_shift_id,
        status,
        reason
      )
      VALUES (
        ${user.id},
        ${colleague_user_id},
        ${requester_shift_id},
        ${colleague_shift_id},
        'pending_colleague',
        ${typeof reason === 'string' ? reason.trim().slice(0, 100) || null : null}
      )
      RETURNING *
    `;
    await createNotification({
      userId: colleague_user_id,
      type: 'shift_swap_pending_colleague',
      title: 'New shift-swap request',
      message: `A colleague has asked you to accept or decline shift-swap request ${inserted[0].id}.`
    });
    await createNotification({
      userId: user.id,
      type: 'shift_swap_submitted',
      title: 'Shift-swap request submitted',
      message: `Your shift-swap request (${inserted[0].id}) has been sent to your colleague.`
    });

    return res.status(201).json({
      message: 'Shift swap request sent to your colleague.',
      request: inserted[0]
    });

  } catch (error) {
    console.error('Create shift swap error:', error);
    return res.status(500).json({
      error: 'Could not create shift swap request.'
    });
  }
});


// PATCH /api/shift-swap-requests/:id/colleague-decision
// Only the invited colleague may accept or decline.
router.patch(
  '/shift-swap-requests/:id/colleague-decision',
  async (req, res) => {
    try {
      const user = await getUserFromToken(req);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { decision, reason } = req.body;

      if (!['accept', 'decline'].includes(decision)) {
        return res.status(400).json({
          error: 'Decision must be accept or decline.'
        });
      }

      const nextStatus =
        decision === 'accept'
          ? 'pending_supervisor'
          : 'rejected';

      const updated = await sql`
        UPDATE public.shift_swap_requests
        SET
          status = ${nextStatus},
          colleague_reason = ${reason || null},
          colleague_decided_at = NOW()
        WHERE id = ${req.params.id}
          AND colleague_user_id = ${user.id}
          AND status = 'pending_colleague'
        RETURNING *
      `;

      if (updated.length === 0) {
        return res.status(409).json({
          error: 'Request not found, not assigned to you, or already answered.'
        });
      }
      await createNotification({
        userId: updated[0].requester_user_id,
        type: `shift_swap_colleague_${decision === 'accept' ? 'accepted' : 'declined'}`,
        title: decision === 'accept' ? 'Shift swap accepted by colleague' : 'Shift swap declined by colleague',
        message: decision === 'accept'
          ? `Your shift swap (${updated[0].id}) is awaiting supervisor approval.`
          : `Your colleague declined shift-swap request ${updated[0].id}.`
      });
      if (decision === 'accept') {
        await notifyProfiles({
          role: 'supervisor',
          type: 'shift_swap_pending_supervisor',
          title: 'Shift swap awaiting approval',
          message: `Shift-swap request ${updated[0].id} requires supervisor review.`
        });
      }

      return res.json({
        message: decision === 'accept'
          ? 'Request accepted. It is now waiting for supervisor approval.'
          : 'Request declined.',
        request: updated[0]
      });

    } catch (error) {
      console.error('Colleague shift swap decision error:', error);
      return res.status(500).json({
        error: 'Could not update the shift swap request.'
      });
    }
  }
);


// PATCH /api/shift-swap-requests/:id/supervisor-decision
// Only a supervisor may make the final decision.
// Shifts are exchanged only when the supervisor approves.
router.patch(
  '/shift-swap-requests/:id/supervisor-decision',
  async (req, res) => {
    try {
      const user = await getUserFromToken(req);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const caller = await sql`
        SELECT role
        FROM public.profiles
        WHERE id = ${user.id}
        LIMIT 1
      `;

      if (caller[0]?.role !== 'supervisor') {
        return res.status(403).json({
          error: 'Only supervisors can make the final decision.'
        });
      }

      const { decision, reason } = req.body;

      if (!['approve', 'reject'].includes(decision)) {
        return res.status(400).json({
          error: 'Decision must be approve or reject.'
        });
      }

      // All database changes for an approval happen in one transaction.
      const result = await sql.begin(async tx => {
        const requests = await tx`
          SELECT *
          FROM public.shift_swap_requests
          WHERE id = ${req.params.id}
            AND status = 'pending_supervisor'
          FOR UPDATE
        `;

        if (requests.length === 0) {
          return { conflict: true };
        }

        const swap = requests[0];

        if (decision === 'reject') {
          const rejected = await tx`
            UPDATE public.shift_swap_requests
            SET
              status = 'rejected',
              supervisor_reason = ${reason || null},
              supervisor_decided_at = NOW()
            WHERE id = ${swap.id}
              AND status = 'pending_supervisor'
            RETURNING *
          `;

          return { request: rejected[0] };
        }

        // Lock both shifts and confirm they still belong
        // to the students who originally requested the swap.
        const lockedShifts = await tx`
          SELECT id, user_id
          FROM public.shifts
          WHERE id IN (
            ${swap.requester_shift_id},
            ${swap.colleague_shift_id}
          )
          ORDER BY id
          FOR UPDATE
        `;

        const ownShift = lockedShifts.find(
          shift => String(shift.id) === String(swap.requester_shift_id)
        );

        const colleagueShift = lockedShifts.find(
          shift => String(shift.id) === String(swap.colleague_shift_id)
        );

        if (
          !ownShift ||
          !colleagueShift ||
          String(ownShift.user_id) !== String(swap.requester_user_id) ||
          String(colleagueShift.user_id) !== String(swap.colleague_user_id)
        ) {
          return { conflict: true };
        }

        // Exchange the assignments only after colleague acceptance
        // and supervisor approval.
        await tx`
          UPDATE public.shifts
          SET user_id = ${swap.colleague_user_id}
          WHERE id = ${swap.requester_shift_id}
        `;

        await tx`
          UPDATE public.shifts
          SET user_id = ${swap.requester_user_id}
          WHERE id = ${swap.colleague_shift_id}
        `;

        const approved = await tx`
          UPDATE public.shift_swap_requests
          SET
            status = 'approved',
            supervisor_reason = ${reason || null},
            supervisor_decided_at = NOW()
          WHERE id = ${swap.id}
            AND status = 'pending_supervisor'
          RETURNING *
        `;

        return { request: approved[0] };
      });

      if (result.conflict) {
        return res.status(409).json({
          error: 'The request is no longer awaiting approval, or a shift assignment has changed.'
        });
      }
      await createNotification({
        userId: result.request.requester_user_id,
        type: `shift_swap_supervisor_${decision === 'approve' ? 'approved' : 'rejected'}`,
        title: decision === 'approve' ? 'Shift swap approved' : 'Shift swap rejected',
        message: decision === 'approve'
          ? `Your shift swap (${result.request.id}) was approved and the assignments were exchanged.`
          : `Your shift swap (${result.request.id}) was rejected by the supervisor.`
      });
      await createNotification({
        userId: result.request.colleague_user_id,
        type: `shift_swap_supervisor_${decision === 'approve' ? 'approved' : 'rejected'}`,
        title: decision === 'approve' ? 'Shift swap approved' : 'Shift swap rejected',
        message: decision === 'approve'
          ? `Shift swap ${result.request.id} was approved and the assignments were exchanged.`
          : `Shift swap ${result.request.id} was rejected by the supervisor.`
      });

      return res.json({
        message: decision === 'approve'
          ? 'Shift swap approved and assignments exchanged.'
          : 'Shift swap rejected.',
        request: result.request
      });

    } catch (error) {
      console.error('Supervisor shift swap decision error:', error);
      return res.status(500).json({
        error: 'Could not process the supervisor decision.'
      });
    }
  }
);

// ============================================
// Closure endpoints
// ============================================

// GET /api/closures — list all closures
router.get('/closures', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const rows = await sql`
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        type,
        note,
        affected_shifts,
        declared_by,
        declared_at
      FROM public.closures
      ORDER BY date ASC
    `;

    const formatted = rows.map((row) => ({
      date: row.date,
      type: row.type,
      note: row.note,
      affectedShifts: row.affected_shifts,
      declaredBy: row.declared_by,
      declaredAt: row.declared_at,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('List closures error:', err);
    res.status(500).json({ error: 'Could not load closures' });
  }
});

// POST /api/closures — declare a new closure (supervisors only)
router.post('/closures', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can declare closures' });
    }

    const { date, type, note, affectedShifts } = req.body;

    if (!date || !type) {
      return res.status(400).json({ error: 'Date and type are required' });
    }

    const rows = await sql`
      INSERT INTO public.closures (date, type, note, affected_shifts, declared_by)
      VALUES (${date}, ${type}, ${note || null}, ${affectedShifts || 0}, ${user.id})
      ON CONFLICT (date) DO UPDATE SET
        type = EXCLUDED.type,
        note = EXCLUDED.note,
        affected_shifts = EXCLUDED.affected_shifts,
        declared_by = EXCLUDED.declared_by,
        declared_at = NOW()
      RETURNING
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        type,
        note,
        affected_shifts,
        declared_by,
        declared_at
    `;

    const row = rows[0];

    res.status(201).json({
      date: row.date,
      type: row.type,
      note: row.note,
      affectedShifts: row.affected_shifts,
      declaredBy: row.declared_by,
      declaredAt: row.declared_at,
    });
  } catch (err) {
    console.error('Create closure error:', err);
    res.status(500).json({ error: 'Could not create closure' });
  }
});

// DELETE /api/closures/:date — remove a closure declaration (supervisors only)
router.delete('/closures/:date', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const callerProfile = await sql`
      SELECT role FROM public.profiles WHERE id = ${user.id}
    `;
    if (callerProfile[0]?.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can remove closures' });
    }

    const rows = await sql`
      DELETE FROM public.closures
      WHERE date = ${req.params.date}
      RETURNING TO_CHAR(date, 'YYYY-MM-DD') AS date
    `;
    if (!rows.length) return res.status(404).json({ error: 'Closure not found' });
    res.json({ success: true, date: rows[0].date });
  } catch (err) {
    console.error('Remove closure error:', err);
    res.status(500).json({ error: 'Could not remove closure' });
  }
});

// ============================================
// End of Closure endpoints
// ============================================


export default router;