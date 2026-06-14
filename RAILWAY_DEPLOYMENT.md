# Share Bill — Railway Deployment Guide

This document describes how to deploy the Share Bill backend to **Railway** with a managed **PostgreSQL** database, automated migrations, and environment variable configuration.

---

## 1. Step-by-Step Railway Deployment

### Step 1: Create a Railway Project
1. Log in to [Railway](https://railway.app).
2. Click **New Project** in the upper right.
3. Choose **Provision PostgreSQL** to spin up a managed database instance first.

### Step 2: Add the Express Backend Service
1. In the same project canvas, click **+ New** (or **New Service**).
2. Select **GitHub Repo** and connect your repository.
3. Once linked, select the repository from the dropdown list.

### Step 3: Configure Build & Startup Settings
By default, Railway detects Node.js and runs the scripts defined in `package.json`.
1. Select the new GitHub service block and navigate to its **Settings** tab.
2. Under **General**, configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build` (runs `prisma generate` to compile types)
   - **Start Command**: `npm start` (this runs `npm run db:migrate && node src/server.js` which automatically executes the migrations before launching the server).

### Step 4: Link the database and configure environment variables
1. Go to your PostgreSQL database service block on Railway.
2. Select the **Variables** tab and copy the connection URL (often listed as `DATABASE_URL`).
3. Return to the Express backend service block, select its **Variables** tab, and click **New Variable** or **Raw Editor** to paste the environment variables.

---

## Production Environment Variables List

Configure the following variables in the **Variables** tab of the backend service on Railway:

| Variable Name | Value Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | The port Railway binds to (automatically injected by Railway, do not override) | *Injected by Railway (typically 5000)* |
| `NODE_ENV` | Mode of operation | `production` |
| `DATABASE_URL` | PostgreSQL connection string. You can reference the database service value directly. | `${{Postgres.DATABASE_URL}}` *(Railway syntax for automatic link)* |
| `JWT_SECRET` | Secret key used for signing JWT login tokens (generate a long, strong random string) | *A secure random string (e.g. `9f8b4c2e...`)* |
| `JWT_EXPIRES_IN` | JWT token expiration lifespan | `7d` |
| `CORS_ORIGIN` | Authorized client domain (must point to your Vercel URL). Separate multiple hosts by commas. | `https://share-bill-app.vercel.app` |

---

## Automated Migration Design

During the deployment process:
1. Railway checks out the repository and installs all NPM packages.
2. It executes the build command (`npm run build`), which runs `prisma generate` to generate the custom Prisma Client.
3. During startup, Railway runs `npm start` which executes:
   `npm run db:migrate && node src/server.js`
4. The database migration script resolves and deploys any pending Prisma migrations (`prisma migrate deploy`) directly against the Railway PostgreSQL database safely and non-interactively.
5. Once complete, the Express server boots up and binds to the environment port.

---

## Deployment Checklist

### Pre-Deployment Tasks
- [ ] Railway project created and PostgreSQL database provisioned.
- [ ] Backend linked to GitHub repository.
- [ ] Environment variables configured under backend service (with `JWT_SECRET` generated securely).
- [ ] CORS origins configured to accept requests from your Vercel frontend.

### Deployment Phase
- [ ] Trigger deployment in Railway.
- [ ] Monitor build logs to verify Prisma Client successfully generates.
- [ ] Verify database migrations (`prisma migrate deploy`) execute during startup logs without errors.

### Post-Deployment Verification
- [ ] Run a GET request against the health check endpoint:
  `GET https://<your-railway-backend-url>/api/health`
- [ ] Confirm response status is `200 OK` and database reports `UP`:
  ```json
  {
    "status": "UP",
    "timestamp": "2026-06-15T01:10:00.000Z",
    "services": {
      "database": "UP",
      "api": "UP"
    }
  }
  ```
- [ ] Confirm request logs print status `200` to the Railway service log stream.
