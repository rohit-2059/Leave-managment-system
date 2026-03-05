# Deployment Guide

This guide will help you deploy the Leave Management System with the **frontend on Vercel** and the **backend on Render**.

---

## 📋 Pre-Deployment Checklist

### ✅ What's Ready:
- ✅ Backend has `start` script in package.json
- ✅ Frontend has vercel.json for proper routing
- ✅ Socket.IO configured for production
- ✅ CORS configured to accept production URLs
- ✅ Environment variables properly structured
- ✅ .gitignore properly configured

### ⚠️ What You Need to Prepare:
1. MongoDB Atlas connection string
2. Firebase service account JSON
3. JWT secret key
4. Firebase client configuration

---

## 🚀 Backend Deployment (Render)

### Step 1: Push Code to GitHub
```bash
# Make sure your code is pushed to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `leave-management-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

### Step 3: Add Environment Variables on Render

Go to **Environment** tab and add:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/leave-management?retryWrites=true&w=majority
JWT_SECRET=your_very_secure_random_secret_key_here
CLIENT_URL=https://your-frontend.vercel.app
```

### Step 4: Handle Firebase Service Account

**Option 1: Base64 Encoding (Recommended for Render)**
1. Convert your `serviceAccountKey.json` to base64:
   ```bash
   # Windows PowerShell
   $content = Get-Content backend/config/serviceAccountKey.json -Raw
   $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
   [Convert]::ToBase64String($bytes)
   ```

2. Add environment variable on Render:
   ```env
   FIREBASE_SERVICE_ACCOUNT_BASE64=<your_base64_string>
   ```

3. Update `backend/config/firebase.js`:
   ```javascript
   import admin from 'firebase-admin';
   
   export const initializeFirebase = () => {
     if (admin.apps.length === 0) {
       let serviceAccount;
       
       // For production (Render), use base64 encoded credentials
       if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
         const decoded = Buffer.from(
           process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 
           'base64'
         ).toString('utf8');
         serviceAccount = JSON.parse(decoded);
       } else {
         // For local development
         const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/serviceAccountKey.json';
         serviceAccount = await import(filePath, { assert: { type: 'json' } });
       }
       
       admin.initializeApp({
         credential: admin.credential.cert(serviceAccount),
       });
       
       console.log('Firebase Admin initialized');
     }
   };
   ```

**Option 2: Use Render Secret Files**
1. Go to **Environment** → **Secret Files**
2. Add file: `/etc/secrets/serviceAccountKey.json`
3. Paste your Firebase JSON content
4. Set environment variable:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/serviceAccountKey.json
   ```

### Step 5: Deploy Backend
- Click **"Create Web Service"**
- Wait for deployment to complete
- Copy your backend URL: `https://your-backend.onrender.com`

⚠️ **Note**: Free Render instances spin down after inactivity and take ~50 seconds to wake up.

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Update Environment Variables

Update `frontend/.env` with production values:

```env
# Firebase Config (same as development)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend URLs (use your Render backend URL)
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### Step 2: Deploy on Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# For production deployment
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

5. Add **Environment Variables**:
   - Add all `VITE_*` variables from your `.env` file
   - Make sure to use your actual Render backend URL

6. Click **"Deploy"**

### Step 3: Update Backend with Frontend URL

1. Go back to **Render Dashboard**
2. Update `CLIENT_URL` environment variable with your Vercel URL:
   ```env
   CLIENT_URL=https://your-frontend.vercel.app
   ```
3. Render will automatically redeploy

---

## 🔧 Post-Deployment Configuration

### 1. Test the Deployment

#### Backend Health Check:
```bash
curl https://your-backend.onrender.com/api/health
```
Should return: `{"success": true, "message": "Leave Management System API is running"}`

#### Frontend:
- Visit `https://your-frontend.vercel.app`
- Try to register/login
- Check browser console for errors
- Test real-time messaging

### 2. Seed Admin User

Run the seed script on Render:
1. Go to Render Dashboard → Your Service
2. Go to **Shell** tab
3. Run:
   ```bash
   npm run seed:admin
   ```

Or set up a one-off job.

### 3. Monitor Logs

#### Render:
- Go to **Logs** tab in your service
- Watch for errors

#### Vercel:
- Go to **Deployments** → Select deployment → **View Function Logs**

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Solution**: Make sure `CLIENT_URL` in Render matches your Vercel URL exactly (including https://)

### Issue 2: Socket.IO Not Connecting
**Solutions**:
- Verify `VITE_SOCKET_URL` is set correctly in Vercel
- Check backend logs for WebSocket errors
- Ensure Render instance is awake (free tier sleeps)

### Issue 3: Firebase Admin Errors
**Solutions**:
- Double-check base64 encoding is correct
- Verify service account JSON is valid
- Check Render logs for specific Firebase errors

### Issue 4: MongoDB Connection Fails
**Solutions**:
- Verify MongoDB URI is correct
- Check MongoDB Atlas network access (allow all IPs: `0.0.0.0/0`)
- Ensure database user has proper permissions

### Issue 5: Build Fails on Vercel
**Solutions**:
- Check all environment variables are set
- Verify no missing dependencies
- Check build logs for specific errors

### Issue 6: 404 on Route Refresh
**Solution**: Already handled by `vercel.json` rewrites configuration ✅

### Issue 7: Google Sign-In COOP Errors (Error 405 / Cross-Origin-Opener-Policy)
**Symptoms**:
- Error code 405 when trying to sign in with Google
- Console shows: "Cross-Origin-Opener-Policy policy would block the window.closed call"
- Google popup window doesn't work

**Solutions**:
- ✅ Already fixed: App uses redirect-based authentication instead of popup
- ✅ Already configured: `vercel.json` includes proper COOP headers
- Ensure Firebase Console has your Vercel domain in authorized domains:
  1. Go to [Firebase Console](https://console.firebase.google.com)
  2. Select your project → Authentication → Settings → Authorized domains
  3. Add your Vercel domain (e.g., `your-app.vercel.app`)
- If issues persist, redeploy on Vercel to apply the new headers

---

## 📊 Performance Optimization

### Backend (Render):
- Consider upgrading to paid tier for:
  - No cold starts
  - Better performance
  - More reliable uptime

### Frontend (Vercel):
- Already optimized with Vite build
- Consider enabling Edge Functions for global CDN

### Database:
- Enable MongoDB Atlas indexes for frequently queried fields
- Consider upgrading from M0 (free tier) for better performance

---

## 🔐 Security Checklist

- ✅ `.env` files are in `.gitignore`
- ✅ JWT_SECRET is strong and random
- ✅ Firebase service account is secure
- ✅ MongoDB Atlas has network restrictions
- ✅ CORS is configured properly
- ✅ Environment variables are not hardcoded

---

## 📝 Environment Variables Summary

### Backend (Render):
```env
PORT=5000
MONGO_URI=<your_mongodb_uri>
JWT_SECRET=<your_jwt_secret>
CLIENT_URL=https://your-frontend.vercel.app
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64_encoded_json>
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/serviceAccountKey.json
```

### Frontend (Vercel):
```env
VITE_FIREBASE_API_KEY=<your_key>
VITE_FIREBASE_AUTH_DOMAIN=<your_domain>
VITE_FIREBASE_PROJECT_ID=<your_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<your_bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
VITE_FIREBASE_APP_ID=<your_app_id>
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## 🎉 Deployment Complete!

Your Leave Management System should now be live:
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

### Next Steps:
1. Share the frontend URL with users
2. Monitor logs for issues
3. Set up error tracking (optional: Sentry)
4. Configure custom domains (optional)
5. Set up CI/CD for automatic deployments

---

## 📞 Support

If you encounter issues:
1. Check the logs on both Render and Vercel
2. Verify all environment variables are set correctly
3. Test the backend health endpoint
4. Check MongoDB Atlas connection
5. Verify Firebase configuration

Last updated: March 2026
