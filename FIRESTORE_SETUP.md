# Firestore Setup - Fix "Saving..." Timeout

## 🚨 Critical Issue: Firestore Security Rules

The "Saving..." timeout means **Firestore is blocking your writes**.

---

## ✅ **Quick Fix (5 minutes)**

### **Step 1: Go to Firestore Rules**
👉 https://console.firebase.google.com/project/checksync-60519/firestore/rules

### **Step 2: Replace ALL Rules with This**

Delete everything and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Step 3: Click "Publish"**

**Wait for:**
- "Rules updated successfully" message
- Green checkmark

### **Step 4: Test**

Refresh app and try creating a slot.

**Should work instantly now!** ✅

---

## 🔒 **What This Does**

**Test Mode Rules:**
- Any authenticated user can read/write any document
- **Good for:** Development and testing
- **Security:** Medium (requires login)

**When deploying to production**, you can tighten rules, but for now this will work.

---

## 🎯 **Verify It Worked**

After publishing rules:

1. Refresh http://localhost:5173
2. Create a time slot
3. Should close modal in < 1 second
4. No timeout error
5. Slot appears on calendar

---

## 📊 **Current Rules Problem**

If you have rules like:
```javascript
allow create: if request.auth.uid == request.resource.data.createdBy;
```

This might be **too strict** and blocking legitimate writes.

The test mode rules above allow all authenticated writes, which is what you need for team collaboration.

---

## ✅ **After This Fix**

- ✅ Modal closes instantly
- ✅ Slots save in < 1 second
- ✅ All team members can create slots
- ✅ Real-time sync works
- ✅ Recurring slots work (new feature!)

**Do this now and the timeout issue will be gone!** 🚀

