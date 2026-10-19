This is our primary branch for our library log system

## Admin request overview

`GET /api/admin/requests` is a read-only, admin-authorized aggregate of leave and
shift-swap requests. It accepts `q`, `status`, `type`, `from`, and `to` query
parameters and returns Student Assistant details, request dates, current
decision data, replacement responses, and approval history. Supporting leave
documents remain available through the authorized
`GET /api/requests/:id/document` endpoint.

`GET /api/admin/active-users` returns active Student Assistants and Supervisors
to authenticated Admins. It accepts optional `q` and `role` query parameters,
where `role` is either `student` or `supervisor`. Each user also includes
`online`, `ipAddress`, `lastSeenAt`, and `userAgent`. A user is considered
online when their authenticated activity was recorded within the last five
minutes. Presence is stored by the backend and refreshed on login and
authenticated API requests.

Users cannot log in until Supabase reports that their email has been
confirmed through the email OTP. The login endpoint returns HTTP 403 with a
verification message when `email_confirmed_at` is not set.

`POST /api/register` returns HTTP 202 while registration is pending. The
client must call `POST /api/auth/verify-otp` with the registration email and
the six-digit token. If the code is not received, the client can call
`POST /api/auth/resend-signup-otp` with the registration email to request a
new code. Registration is complete only when verification returns
`registrationComplete: true`; unverified users cannot log in.

Self-registered users remain pending after OTP verification until an admin
approves them. Admins can review them with `GET
/api/admin/registration-requests`, approve with `PATCH
/api/admin/registration-requests/:id/approve`, or reject with `PATCH
/api/admin/registration-requests/:id/reject` and a required `reason`.
Admin-created student and supervisor accounts are marked approved immediately.

## Notifications

Authenticated users can retrieve only their own database-backed notifications:

- `GET /api/notifications` supports `unreadOnly=true` and a bounded `limit`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

The backend creates notifications after successful workflow operations. Pending
self-registrations notify active admins; leave submissions and supervisor
decisions notify the relevant students and supervisors; and shift-swap
submissions, colleague decisions, and supervisor decisions notify the relevant
participants. Notification creation is idempotent for the same recipient,
type, title, and message.

The existing notification table is `public.notifications` with the columns
`id`, `user_id`, `type`, `title`, `message`, `is_read`, and `created_at`.
Account-support notifications are not wired because the backend does not yet
have an account-support workflow.
