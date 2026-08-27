# Mulsetu CRM — what’s included

A client-and-project tracker for the Mulsetu team. Two roles: **admin** and **developer**. The first person who signs up becomes admin; later signups are developers.

The app is organized as **Dashboard → Projects → Tasks → Today**. Clients and Team are supporting records.

---

## Who can do what

| Area | Admin | Developer |
| --- | --- | --- |
| Clients | Create, edit, delete | View |
| Projects | Create, edit, delete, assign people/teams, move stages | View |
| Tasks | Create, assign to anyone, edit status, delete; see Team Tasks | Create for self, update own status |
| Today | View anyone’s day, add/remove items | Own day only |
| Team | Create and delete teams | View members and assigned projects |

---

## Features

### Accounts
- Sign up / sign in with email and password
- Show / hide password on the forms
- Confirm email before first sign-in
- Forgot password and change password
- Profile menu: name, role, password, sign out
- Light / Dark switch (light is the default)

### Dashboard
- Active projects
- Work that is at risk or overdue
- Today’s tasks and meetings
- Upcoming deadlines
- Shortcuts to Projects, Tasks, and Today

### Projects
The central workspace for all work.

- **Client Project** — linked to a client
- **Internal Product** — no client required
- **List** and **Pipeline** views
- Pipeline stages: Lead → Requirements → Development → Review → Client Review → Completed → On Hold
- Filters, assignments, deadlines, links, and tasks
- Project detail tabs: Overview, Tasks, Links
- Admins can drag pipeline cards or pick a stage

### Tasks
- **My Tasks** — everything assigned to you
- **Team Tasks** (admin) — everyone’s tasks, inside the same Tasks page
- Status: To Do, In Progress, Done, Blocked
- Priority: Low, Medium, High, Urgent
- Optional due date and project

### Today
- Pick a date, or jump back to today
- Admin can pick whose day to view; developers see their own
- Tasks due that day plus meetings/calls
- Add or remove schedule items

### Clients
- Company name, contact person, email, phone, notes
- Client page lists that company’s projects

### Team
- Name a group and pick members
- See which projects that team is assigned to
- Assign or unassign a team on a project

### App shell
- Sidebar: Dashboard, Projects, Tasks, Today, Clients, Team
- Breadcrumb so you can see where you are
- Mulsetu logo in the sidebar, login screens, and browser tab
- Works on phone (drawer menu, larger tap targets)

---

## What this is not (yet)

These are **not** in the app:

- Invoices, payments, or time tracking
- Chat, comments, or file uploads (links only)
- Calendar sync
- Promoting a developer to admin from the UI
- Reports or exports

---

## How to run it

From `mulsetu-crm`:

```bash
npm run dev
```

Open http://localhost:3000

Needs `.env.local` with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Also run these in the Supabase SQL editor if you have not already:

- `supabase/migrations/0005_teams.sql`
- `supabase/migrations/0006_project_type.sql` (Internal Products)
