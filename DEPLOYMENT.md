# Online Cloud Deployment Guide — Tea Real-Time Chat App

Your project is now **100% configured for 1-click cloud deployment**!

---

## Deployment Option 1: Render.com (Recommended — Free & Easiest)

1. **Push Code to GitHub:**
   Push your project repository to GitHub.

2. **Connect to Render:**
   - Log in to **[render.com](https://render.com)**.
   - Click **New +** ➔ **Blueprint**.
   - Connect your GitHub repository.
   - Render will automatically detect [`render.yaml`](file:///c:/Real-Time%20Chat%20Application/render.yaml)!

3. **Set Environment Variables:**
   Add these 2 variables under **Environment**:
   - `MONGODB_URI` = `mongodb+srv://deepak:deepak@cluster0.jhgygnd.mongodb.net/tea-chat-app?retryWrites=true&w=majority&tlsAllowInvalidCertificates=true`
   - `JWT_SECRET` = `supersecretjwtsigningkey12345!`

4. **Click Apply!**
   Render will build the React frontend, start the Express server, and give you an online HTTPS URL (e.g., `https://tea-chat-app.onrender.com`).

---

## Deployment Option 2: Railway.app / Heroku

1. **Connect Repository:**
   Connect your GitHub repo to Railway or Heroku.
2. **Build & Start Commands:**
   - **Build Command:** `npm run install-all && npm run build`
   - **Start Command:** `npm start`
3. **Set Environment Variables:**
   Add `MONGODB_URI`, `JWT_SECRET`, and `NODE_ENV=production`.

---

## Configured Project Files

- [`package.json`](file:///c:/Real-Time%20Chat%20Application/package.json) — Production build & postinstall scripts.
- [`Procfile`](file:///c:/Real-Time%20Chat%20Application/Procfile) — Process file for cloud web dynos.
- [`render.yaml`](file:///c:/Real-Time%20Chat%20Application/render.yaml) — Render Blueprint specification.
- [`.env.example`](file:///c:/Real-Time%20Chat%20Application/.env.example) — Production environment variable blueprint.
