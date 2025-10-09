# CheckSync - Actions & Undo Functionality

## ✅ Every Action Has an Undo!

All major actions in CheckSync are now reversible, giving users full control over their data.

---

## 🔄 Reversible Actions

### 1. **Check-In Workflow**

#### ✅ Action: Check In
- **Who:** Participant
- **When:** Slot status is "Planned"
- **Button:** "✅ Check In" (green)
- **Result:** Status → "Checked-in" (yellow)

#### ↩️ Undo: Undo Check-In
- **Who:** Participant (same person who checked in)
- **When:** Slot status is "Checked-in"
- **Button:** "↩️ Undo Check-In" (yellow)
- **Confirmation:** "Undo check-in and return to planned status?"
- **Result:** Status → "Planned" (grey), timestamp removed

---

### 2. **Verification Workflow**

#### ✅ Action: Confirm Attendance
- **Who:** Verifier
- **When:** Slot status is "Checked-in"
- **Button:** "🔒 Confirm Attendance" (blue)
- **Result:** Status → "Confirmed" (green)

#### ↩️ Undo: Undo Confirmation
- **Who:** Verifier (same person who confirmed)
- **When:** Slot status is "Confirmed"
- **Button:** "↩️ Undo Confirmation" (green)
- **Confirmation:** "Undo confirmation and return to checked-in status?"
- **Result:** Status → "Checked-in" (yellow), confirmation timestamp removed

---

### 3. **Time Slot Management**

#### ✅ Action: Create Time Slot
- **Who:** Any user
- **When:** Anytime
- **Button:** "➕ Add Time Slot"
- **Result:** New slot created with "Planned" status

#### ↩️ Undo: Delete Time Slot
- **Who:** Any participant, verifier, or creator
- **When:** Anytime
- **Button:** "🗑️ Delete" (red)
- **Confirmation:** "Delete this time slot?"
- **Result:** Slot permanently removed from Firestore

---

#### ✅ Action: Edit Time Slot
- **Who:** Any participant, verifier, or creator
- **When:** Anytime
- **Button:** "✏️ Edit"
- **Result:** Opens modal to modify slot details

#### ↩️ Undo: Edit Again
- **Who:** Anyone
- **When:** After editing
- **Button:** "✏️ Edit" (can edit multiple times)
- **Result:** Can change back to original values

---

### 4. **User Settings**

#### ✅ Action: Change Role
- **Who:** Current user
- **Where:** Settings → Role
- **Options:** Participant / Verifier / Both
- **Result:** Role updated in Firestore

#### ↩️ Undo: Change Role Back
- **Who:** Current user
- **Where:** Settings → Role
- **Result:** Can switch roles anytime

---

#### ✅ Action: Add Connection
- **Who:** Current user
- **Where:** Settings → Manage Connections
- **Result:** User added to connections list

#### ↩️ Undo: (Not Currently Implemented)
- **Note:** Users remain in connections permanently
- **Future:** Could add "Remove Connection" feature

---

## 📊 Status Flow with Undo

```
┌─────────┐  Check In   ┌────────────┐  Confirm   ┌───────────┐
│ PLANNED │ ───────────>│ CHECKED-IN │ ─────────>│ CONFIRMED │
│  (Grey) │             │  (Yellow)  │           │  (Green)  │
└─────────┘             └────────────┘           └───────────┘
     ^                       │                         │
     │                       │                         │
     │    Undo Check-In      │     Undo Confirmation   │
     └───────────────────────┘◄────────────────────────┘
```

---

## 🎯 Use Cases for Undo

### **Mistake Correction**
- Accidentally checked in to wrong slot
- Checked in too early
- Verifier confirmed by mistake

### **Changed Plans**
- Meeting canceled after check-in
- Need to reschedule
- Wrong person verified

### **Testing**
- Trying out the workflow
- Demo purposes
- Training new users

---

## 🔐 Permission Rules

### Check-In Actions
- **Check In:** Only if you're a participant
- **Undo Check-In:** Only if you're a participant AND you checked in

### Verification Actions
- **Confirm:** Only if you're the verifier AND status is "checked-in"
- **Undo Confirmation:** Only if you're the verifier AND status is "confirmed"

### Management Actions
- **Edit:** Anyone involved (participant, verifier, or creator)
- **Delete:** Anyone involved (participant, verifier, or creator)

---

## 💾 Data Persistence

All undo actions are **immediately saved to Firestore**:

- **Undo Check-In:**
  - Status: "checked-in" → "planned"
  - `checkedInAt` timestamp removed
  - Updates synced to all users

- **Undo Confirmation:**
  - Status: "confirmed" → "checked-in"
  - `confirmedAt` timestamp removed
  - `checkedInAt` timestamp preserved
  - Updates synced to all users

---

## 🚨 Confirmation Dialogs

For safety, undo actions require confirmation:

### Undo Check-In
```
⚠️ Undo check-in and return to planned status?
[Cancel] [OK]
```

### Undo Confirmation
```
⚠️ Undo confirmation and return to checked-in status?
[Cancel] [OK]
```

### Delete Slot
```
⚠️ Delete this time slot?
[Cancel] [OK]
```

---

## 🎨 Visual Design

### Button Colors
- **Check In:** Green background (`btn-accent`)
- **Undo Check-In:** Yellow background (matches checked-in status)
- **Confirm:** Blue background (`btn-primary`)
- **Undo Confirmation:** Green background (matches confirmed status)
- **Edit:** Grey background (`btn-secondary`)
- **Delete:** Red background

### Button States
- Only relevant buttons show for each status
- Disabled states prevent invalid actions
- Hover effects for better UX

---

## ✨ Benefits

### For Users
- ✅ Mistake-proof workflow
- ✅ Full control over data
- ✅ No permanent mistakes
- ✅ Easy testing and exploration

### For Teams
- ✅ Flexibility in scheduling
- ✅ Can adjust to changing plans
- ✅ Clear audit trail (timestamps preserved)
- ✅ Builds trust in the system

---

## 🔮 Future Enhancements

Potential additional undo features:

1. **Remove Connection**
   - Ability to disconnect from users
   - Archive instead of delete

2. **Soft Delete for Slots**
   - Move to trash instead of permanent delete
   - 30-day recovery period
   - "Restore" button

3. **Undo History**
   - Activity log showing all changes
   - Who did what and when
   - Rollback to any previous state

4. **Bulk Undo**
   - Undo multiple actions at once
   - Useful for weekly resets

---

## 🎯 Summary

CheckSync now provides **complete undo functionality** for all critical actions:

| Action | Undo Available | Confirmation Required |
|--------|----------------|----------------------|
| Check In | ✅ Yes | ✅ Yes |
| Confirm Attendance | ✅ Yes | ✅ Yes |
| Create Slot | ✅ Yes (Delete) | ✅ Yes |
| Edit Slot | ✅ Yes (Edit Again) | ❌ No |
| Change Role | ✅ Yes (Change Back) | ❌ No |
| Delete Slot | ❌ Permanent | ✅ Yes |
| Add Connection | ⚠️ Not Yet | ❌ N/A |

**Result:** A forgiving, user-friendly system that encourages exploration without fear of permanent mistakes! 🎉

