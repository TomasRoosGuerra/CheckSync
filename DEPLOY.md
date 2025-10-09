# CheckSync - Netlify Deployment Guide

## 🚀 Deploy to Netlify

### Option 1: Netlify Dashboard (Easiest)

1. **Go to Netlify**
   - Visit https://app.netlify.com
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Select repository: `TomasRoosGuerra/CheckSync`

3. **Configure Build Settings**
   Netlify will auto-detect from `netlify.toml`, but verify:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `20`

4. **Deploy!**
   - Click "Deploy site"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at: `https://[random-name].netlify.app`

5. **Custom Domain (Optional)**
   - Site settings → Domain management
   - Add custom domain like `checksync.yourdomain.com`

---

### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

---

## 🔥 Post-Deployment: Update Firebase

### Add Netlify Domain to Firebase

1. **Get Your Netlify URL**
   - After deployment: `https://your-app.netlify.app`

2. **Add to Firebase Authorized Domains**
   - Go to [Firebase Console](https://console.firebase.google.com/project/checksync-60519)
   - Authentication → Settings → Authorized domains
   - Click "Add domain"
   - Paste your Netlify URL (without https://)
   - Click "Add"

3. **Update CORS Settings (if needed)**
   - Firestore → Database → Rules
   - Already configured in setup

---

## 📱 Enable PWA on Mobile

Once deployed to HTTPS (Netlify automatically provides this):

**On Mobile:**
1. Visit your Netlify URL
2. Tap browser menu
3. Select "Add to Home Screen"
4. App installs like a native app!

**Features:**
- Works offline (after first visit)
- Full-screen experience
- App icon on home screen
- Fast loading

---

## ✅ Deployment Checklist

Before deploying, make sure:

- [x] Firebase config in `src/firebase.ts` is correct
- [x] Firestore database is created
- [x] Firestore security rules are set
- [x] Authentication providers enabled (Email/Google)
- [ ] Add Netlify domain to Firebase Authorized domains (after deployment)

---

## 🔧 Troubleshooting

### Build Fails on Netlify
- Check Node version is 20+ in `netlify.toml`
- Verify all dependencies installed: `npm install`
- Check build logs for errors

### Firebase Auth Doesn't Work
- Add Netlify domain to Firebase Authorized domains
- Check Firebase API keys are correct
- Verify auth providers are enabled

### App Shows "Loading..." Forever
- Check browser console for errors
- Verify Firestore rules are set correctly
- Check Firebase project is active

### PWA Not Installing
- Only works on HTTPS (Netlify auto-provides)
- Check `manifest.json` is in `/public` folder
- Clear browser cache and try again

---

## 🎯 Continuous Deployment

Netlify automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main
```

Netlify will:
1. Detect the push
2. Build your app
3. Deploy automatically
4. Usually takes 2-3 minutes

---

## 📊 Monitor Your Deployment

### Netlify Dashboard
- Build logs
- Deploy previews
- Analytics
- Forms submissions
- Function logs

### Check Deployment
- **Status:** https://app.netlify.com/sites/[your-site]/deploys
- **Logs:** Click on any deploy to see build logs
- **Preview:** Each deploy has a preview URL

---

## 🌟 Production Tips

1. **Custom Domain**
   - Use your own domain for professional look
   - Free SSL certificate included

2. **Environment Variables**
   - Store Firebase keys securely
   - Site settings → Environment variables

3. **Branch Deploys**
   - Deploy preview for each PR
   - Test before merging to main

4. **Rollback**
   - Easy rollback to previous deploys
   - One-click in Netlify dashboard

---

## 🎉 Your App is Live!

After deployment:
- Share your URL: `https://your-app.netlify.app`
- Users can sign up and start using CheckSync
- Real-time collaboration works across all users
- Data persists in Firebase
- Works on mobile and desktop

**Your production-ready attendance app is now live!** 🚀

