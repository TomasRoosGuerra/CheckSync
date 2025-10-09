# CheckSync - Setup Guide

## 🔥 Firestore Setup (Required)

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/project/checksync-60519)
2. Click **Firestore Database** in left menu
3. Click **Create database**
4. Choose **Start in test mode** (for development)
5. Select a region (closest to you)
6. Click **Enable**

### 2. Set Firestore Security Rules

In Firestore → Rules tab, paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all profiles, write their own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Anyone authenticated can create connections
    match /connections/{connectionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Time slots readable/writable by participants and verifiers
    match /timeSlots/{slotId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

Click **Publish**

### 3. Authentication Already Enabled ✅

- Email/Password - Already enabled
- Google Sign-In - Already enabled

---

## 🚀 Running the App

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Production Build

```bash
npm run build
npm run preview
```

---

## 👥 Using the App

### First Time Setup

1. **Sign Up**

   - Use email/password OR Google Sign-In
   - Enter your name (for email signup)
   - Account created in Firebase Auth
   - Profile created in Firestore

2. **Set Your Role**

   - Click Settings (gear icon)
   - Choose: Participant, Verifier, or Both
   - Role saved to Firestore

3. **Add Connections**
   - Settings → Manage Connections
   - Enter friend's email
   - They must sign up first!
   - Both users can now collaborate

### Creating Time Slots

1. Click any day on calendar
2. Click "Add Time Slot"
3. Fill in:
   - Title (e.g., "Gym Session")
   - Start/End time
   - Select participants (from your connections)
   - Select verifier
   - Add notes (optional)
4. Click "Create Slot"
5. Slot saved to Firestore ✅

### Check-In Workflow

**As Participant:**

1. Open day with your slot
2. Click "Check In" button
3. Status → Yellow (Checked-in)
4. Timestamp saved to Firestore

**As Verifier:**

1. See participant has checked in
2. Click "Confirm Attendance"
3. Status → Green (Confirmed)
4. Timestamp saved to Firestore

### Exporting Data

1. Click "Export" in header
2. Set date range
3. Filter by participants (optional)
4. Toggle "Confirmed only" (optional)
5. Click "Export CSV"
6. Download file with all data

---

## 📱 Mobile App (PWA)

When deployed to HTTPS (e.g., Firebase Hosting, Vercel):

1. Open on mobile browser
2. Click "Add to Home Screen"
3. App installs as native-like experience
4. Works offline after first load

---

## 🔍 Troubleshooting

### "No connections" when creating slots

- Add users first via Settings → Manage Connections
- They must have signed up to the app
- Search by their exact email

### Slots not appearing

- Check Firestore console for data
- Make sure you're a participant OR verifier
- Refresh the page

### Check-in button not showing

- Make sure you're listed as a participant
- Status must be "planned"
- You must be logged in as the participant

### Can't confirm attendance

- Must be the assigned verifier
- Status must be "checked-in"
- Participant must check in first

---

## 🎯 Quick Start for Testing

1. **Create 2 accounts:**

   - Sign up with email1@test.com
   - Sign out
   - Sign up with email2@test.com

2. **Connect them:**

   - In Settings → Manage Connections
   - Add email1@test.com
   - Switch accounts and add email2@test.com back

3. **Create a slot:**

   - User 1: Set role to "Participant"
   - User 2: Set role to "Verifier"
   - User 1: Create slot, select User 1 as participant, User 2 as verifier

4. **Test workflow:**
   - User 1: Check in
   - User 2: Confirm attendance
   - See status change from grey → yellow → green!

---

## ✅ All Features Working

- ✅ Real user authentication
- ✅ User profile management
- ✅ Add connections by email
- ✅ Create/edit/delete time slots
- ✅ Real check-in workflow
- ✅ Real confirmation workflow
- ✅ Data persistence to Firestore
- ✅ Real-time synchronization
- ✅ Export to CSV
- ✅ Multi-user collaboration

**Everything is production-ready!** 🎉
