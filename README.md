# Your NUST

A community platform for the NUST campus: C1–C4 cafeteria menus and prices, Lost & Found, project teammates, and carpools around H-12. CS344 Web Engineering end-sem project, BESE-15A.

Built with MongoDB, Express 5, React 19 (Vite) and Node.js.

## Run it locally

You need **Node.js 20 or newer** and **Git**. You don't need to install MongoDB.

```bash
git clone https://github.com/Abdullah2240/your-nust.git
cd your-nust
npm install
npm run dev        # starts the database, the API (port 5000) and the website (port 5173)
```

Open a second terminal in the same folder and load the test data:

```bash
npm run seed
```

Then open **http://localhost:5173**.

The first `npm run dev` downloads a local MongoDB (about 300 MB), so it can take a few minutes. After that it starts in seconds. Your data is saved in `server/.data/` and stays between runs. Running `npm run seed` again wipes the data and reloads the test data.

### Test accounts

All four use the password `Password123!`.

| Email | What it is |
|---|---|
| `admin@seecs.edu.pk` | Admin, which unlocks the admin panel |
| `ayesha@seecs.edu.pk` | Verified member |
| `bilal@smme.edu.pk` | Verified member |
| `unverified@seecs.edu.pk` | Member who hasn't verified their email yet |

### Emails (verification, password reset)

Emails are **printed in the terminal** running `npm run dev`. Look for `--- EMAIL to ...` and copy the link into your browser. No email setup is needed.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Database + API + website, with auto-reload |
| `npm run seed` | Wipe the database and load test data |
| `npm test` | Run all server tests. It uses its own temporary database, so your data is safe. |
| `npm run build` | Build the website into `client/dist` |
| `npm start` | Production mode: the API serves the built website |

## Settings (optional)

It works with no settings file. To change something, create `server/.env` (it is git-ignored, so never commit it) with any of these:

```
PORT=5000
# Default is the built-in local database. Paste a MongoDB Atlas string to use Atlas instead.
MONGO_URI=mongodb://127.0.0.1:27017/your-nust
JWT_SECRET=change-me-to-a-long-random-string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
# Leave SMTP_HOST empty to print emails in the terminal instead of sending them.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Your NUST <no-reply@yournust.local>"
```

## Project layout

```
server/src/lib/          shared helpers (responses, pagination, uploads, mailer)
server/src/middleware/   auth guards, validation, errors
server/src/modules/      one folder per feature: model, validation, controller, routes
server/src/modules/index.js   where each feature's routes are switched on
server/tests/            node:test + supertest; helpers.js has createUser / agentFor
client/src/components/   shared UI kit (see /dev/ui while running dev)
client/src/modules/      one folder per feature: pages + routes.jsx
client/src/routes.jsx    where each feature's pages are switched on
client/src/styles/       design tokens and styles from the Assignment 2 prototype
```

While `npm run dev` is running, open **http://localhost:5173/dev/ui** to see every shared component.

## Team workflow

- Never push to `main`. Work on a branch such as `saniya/cafeterias-api`, then open a Pull Request.
- Before opening a PR, run `git pull origin main`, `npm test` and `npm run build`. All three must pass.
- Only edit the folders your part owns. The three registry files (`server/src/modules/index.js`, `client/src/routes.jsx` and `client/src/modules/admin/adminTabs.jsx` / `profile/myPostsTabs.jsx`) are the exception: in those, you only uncomment your own lines.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Could not connect to MongoDB` | Start everything with `npm run dev` from the repo root, not inside `server/`. |
| Port 5000, 5173 or 27017 already in use | An old run is still open. Close that terminal, or restart your PC. |
| `npm run seed` hangs | `npm run dev` must be running in another terminal first. |
| Login works but other requests return 403 "Cross-site request blocked" | Open the site at http://localhost:5173, not 127.0.0.1. |
