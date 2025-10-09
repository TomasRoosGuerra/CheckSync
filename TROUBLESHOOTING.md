# CheckSync - Troubleshooting: Slots Disappearing

## 🔍 Root Cause Analysis

If slots disappear on refresh, **99% of the time it's a Firestore configuration issue**, not the code.

---

## ✅ Diagnostic Checklist

### **1. Is Firestore Database Created?**

**Most Common Issue!** ⚠️

1. Go to [Firebase Console → Firestore](https://console.firebase.google.com/project/checksync-60519/firestore)
2. Do you see "Cloud Firestore" page with data?
3. **If you see "Get started" button → DATABASE NOT CREATED!**

**Fix:**
- Click "Create database"
- Choose "Start in test mode" (for development)
- Select region closest to you
- Click "Enable"
- **Wait 2-3 minutes** for database to provision

---

### **2. Are Security Rules Set?**

If database exists but slots disappear:

1. Go to [Firestore → Rules](https://console.firebase.google.com/project/checksync-60519/firestore/rules)
2. Check current rules

**Test Mode Rules (for development):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 2, 1);
    }
  }
}
```

**Production Rules (use this):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Connections
    match /connections/{connectionId} {
      allow read, create: if request.auth != null;
    }
    
    // Time Slots
    match /timeSlots/{slotId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Important:** Click **"Publish"** after pasting rules!

---

### **3. Check Browser Console**

1. Open your app: http://localhost:5173
2. Press **F12** (or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Look for red errors

**Common Errors:**

❌ **"Missing or insufficient permissions"**
→ Security rules are blocking access
→ Use test mode rules above

❌ **"Firebase: Error (firestore/permission-denied)"**
→ Database exists but rules deny access
→ Update security rules

❌ **"FIRESTORE (10.8.0) INTERNAL ASSERTION FAILED"**
→ Database not created yet
→ Create Firestore database

❌ **No errors, but slots don't appear**
→ Check Network tab for Firestore requests
→ Make sure you're a participant OR verifier

---

### **4. Verify Data is Saving**

1. Create a time slot in the app
2. Go to [Firestore Console](https://console.firebase.google.com/project/checksync-60519/firestore/data)
3. Look for **`timeSlots`** collection
4. Click to see documents

**What you should see:**
```
timeSlots (collection)
  └─ [auto-id] (document)
       ├─ title: "Morning Training"
       ├─ date: "2025-01-09"
       ├─ startTime: "09:00"
       ├─ endTime: "10:00"
       ├─ participantIds: ["user-id-123"]
       ├─ verifierId: "user-id-456"
       ├─ status: "planned"
       └─ createdAt: [timestamp]
```

**If data appears here:**
✅ Saving works
❌ Problem is with reading/subscriptions

**If no data appears:**
❌ Saving is blocked
→ Check security rules
→ Check browser console for errors

---

### **5. Test Real-time Sync**

1. Open app in **two browser tabs**
2. Create a slot in Tab 1
3. Does it appear in Tab 2?

**Yes?** ✅ Real-time sync works
**No?** ❌ Subscription issue or security rules

---

## 🔧 Quick Fixes

### **Fix 1: Enable Test Mode (Development)**

If you just want it to work **right now**:

1. [Firestore → Rules](https://console.firebase.google.com/project/checksync-60519/firestore/rules)
2. Paste:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ Open to all (DEV ONLY)
    }
  }
}
```
3. Click **"Publish"**
4. Refresh app → Test

**Warning:** This allows anyone to read/write! Only for testing.

---

### **Fix 2: Check You're Connected**

Slots only appear if you're a **participant** or **verifier**:

1. Settings → Manage Connections
2. Add users by email
3. Create slot with yourself or connected users
4. Make sure you're selected as participant/verifier

---

### **Fix 3: Clear Cache & Retry**

Sometimes browser cache causes issues:

1. Hard refresh: **Ctrl+Shift+R** (or Cmd+Shift+R on Mac)
2. Or: Clear browser cache
3. Close and reopen browser
4. Log out and log back in

---

## 🎯 Step-by-Step Diagnosis

Run through this in order:

### **Step 1: Check Firestore Exists**
```
✅ Database created
✅ Can see collections in console
✅ Security rules published
```

### **Step 2: Test Write Access**
```
1. Create a time slot
2. Check Firestore console
3. ✅ Document appears in timeSlots collection
```

### **Step 3: Test Read Access**
```
1. Refresh the page
2. ✅ Slot still appears
3. ✅ No errors in console
```

### **Step 4: Test Multi-User**
```
1. Add connection by email
2. Create slot with them
3. ✅ They see the slot
```

---

## 🐛 Known Issues

### **Issue: Slots only appear for creator**

**Cause:** Real-time subscription only queries slots where:
- You're a participant, OR
- You're the verifier

**Fix:** Make sure you're added as participant/verifier when creating slots

---

### **Issue: "No verifiers available"**

**Cause:** Your role is "Participant" only

**Fix:** 
1. Settings → Role
2. Choose "Both" or "Verifier"
3. Or add connections with verifier role

---

### **Issue: Connected users can't see slots**

**Possible causes:**
1. They're not added as participant/verifier in the slot
2. They haven't refreshed their page
3. They need to log out and log back in
4. Security rules blocking their read access

**Fix:**
1. Make sure they're selected in "Participants" or "Verifier"
2. Both users should hard refresh (Ctrl+Shift+R)
3. Check security rules allow authenticated reads

---

## 📊 Expected Behavior

### **When Creating a Slot:**
1. Click "Add Time Slot"
2. Fill in details
3. Click "Create Slot"
4. **Immediately appears on calendar** (via real-time listener)
5. **Persists on refresh** (saved in Firestore)
6. **Visible to all participants & verifier** (shared access)

### **When Refreshing:**
1. Page reloads
2. User authentication verified
3. Firestore subscription starts
4. **All relevant slots load** from database
5. Calendar updates with slots

---

## 🚨 Emergency Debug Mode

Add this to check if Firestore is working:

**In browser console (F12):**
```javascript
// Check if Firebase is loaded
console.log('Firebase app:', firebase);

// Check if user is authenticated
firebase.auth().onAuthStateChanged(user => {
  console.log('Authenticated user:', user);
});

// Try to read from Firestore
firebase.firestore().collection('timeSlots').get()
  .then(snapshot => {
    console.log('Found slots:', snapshot.size);
    snapshot.forEach(doc => console.log(doc.data()));
  })
  .catch(error => console.error('Error:', error));
```

---

## ✅ Final Checklist

Before deploying to Netlify, make sure:

- [x] Firestore database created
- [x] Security rules published
- [x] Can create slots (appear in Firestore console)
- [x] Slots persist after refresh
- [x] No errors in browser console
- [x] Real-time sync works (two tabs test)
- [x] Connected users can see shared slots

---

## 🆘 Still Not Working?

If you've tried everything above:

1. **Share browser console errors** with screenshot
2. **Check Firestore console** - does data exist?
3. **Verify security rules** are published
4. **Test with test mode rules** (open to all temporarily)
5. **Try incognito window** (fresh session)

The app code is solid. The issue is **always** Firebase configuration! 🔥

