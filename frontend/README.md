# TUT Student Assistant Absence & Leave Tracking System — Frontend V14

This frontend-only build contains the latest student request, shift-swap, institutional-closure, and forgot-password updates.

## Run

```powershell
npm install
npm run dev -- --port 5174
```

## Demo accounts


## V14 updates

- Merged the supplied student Leave Request implementation with the existing V13 request calendar features.
- Leave category-specific Number of Days limits:
  - Day-off Request: 1 day
  - Sick Leave: up to 5 days
  - Exam Leave: up to 3 days
  - Personal Issues: up to 3 days
- Leave dates automatically skip Sundays, public holidays, approved leave, approved swaps and institutional closures.
- Request calendar keys use green Holiday, grey date swapped to, blue date swapped from, and red Institutional closure.
- Shift Swap includes a Number of Shifts selector; the current one-to-one swap workflow supports 1 shift per submission.
- Forgot Password now labels the required identifier `Staff/Student No.`.
- Supervisor institutional closure dialog replaces the old declaration wording and provides `Strike` and `Library closure` options.
- Institutional closure dates remain red and unavailable on student Leave Request, Shift Swap and Schedule calendars.
- Student Schedule keeps the blue `date swapped from` and grey `date swapped to` behavior, with the replacement date clickable for shift details.
## Backend API configuration

This local frontend is configured to use the hosted Render backend:

```env
VITE_API_BASE_URL=https://absence-tracker-backend.onrender.com
```

The frontend runs locally with Vite, while authentication, requests, shifts, profiles and other API data are served by the hosted backend/Supabase deployment.

To change the API endpoint, edit the `.env` file and restart the Vite development server.

