# CheckSync - 20 User Journeys

## 🎯 Role-Based Access Control

CheckSync now has a **hierarchical permission system** perfect for businesses tracking attendance.

### **Role Hierarchy:**

```
👑 ADMIN (Level 4)
  └─ Full system access
  └─ Manage all users
  └─ Create/edit/delete any slot
  └─ Verify any attendance
  └─ Export all data

📊 MANAGER (Level 3)
  └─ Create/edit/delete slots
  └─ Verify attendance
  └─ Check in to slots
  └─ Export data

🔒 VERIFIER (Level 2)
  └─ Verify attendance
  └─ Check in to slots
  └─ View assigned slots

👤 PARTICIPANT (Level 1)
  └─ Check in to assigned slots
  └─ View own schedule
```

---

## 👥 USER JOURNEYS

### **Journey 1: Business Owner Setup (Admin)**

**Role:** Admin
**Goal:** Set up CheckSync for gym classes

1. Sign up with email (becomes Admin role)
2. Settings → Set role to "Admin"
3. Settings → Manage Connections
4. Add all trainers by email (they sign up first)
5. Create weekly class slots for 12 weeks
6. Assign trainers as participants, self as verifier
7. Export attendance monthly for payroll

**Outcome:** Full gym schedule with verified trainer attendance

---

### **Journey 2: New Trainer Joins (Participant)**

**Role:** Participant
**Goal:** Start attending classes

1. Receive invitation email with app link
2. Sign up with company email
3. Default role: Participant ✓
4. See classes they're assigned to
5. Day of class: Tap "Check In" when arriving
6. Wait for manager verification
7. See status turn green when confirmed

**Outcome:** Simple check-in process, no confusion

---

### **Journey 3: Senior Trainer (Manager)**

**Role:** Manager
**Goal:** Create and manage classes

1. Sign up
2. Admin changes their role to "Manager"
3. Can now create new class slots
4. Schedule next month's classes
5. Assign other trainers as participants
6. Assign themselves or verifier as confirmer
7. Can verify attendance when needed
8. Export weekly reports

**Outcome:** Empowered to manage schedules

---

### **Journey 4: Quality Control Person (Verifier)**

**Role:** Verifier
**Goal:** Verify attendance only

1. Sign up
2. Admin sets role to "Verifier"
3. See all classes where they're assigned verifier
4. Check classes with yellow (checked-in) status
5. Physically verify person attended
6. Tap "Confirm" for each
7. Cannot create or delete slots
8. Focused verification role

**Outcome:** Clean verification workflow

---

### **Journey 5: Part-Time Coach (Participant)**

**Role:** Participant
**Goal:** Attend some classes

1. Sign up
2. Keep Participant role
3. Only see classes they're assigned to
4. Check in when arriving
5. Cannot see other trainers' classes
6. Cannot create or verify
7. Simple, distraction-free experience

**Outcome:** Minimal interface, just check in

---

### **Journey 6: Head Coach Covering Shift (Manager)**

**Role:** Manager
**Goal:** Cover last-minute absence

1. Already logged in as Manager
2. See schedule for today
3. Notice someone hasn't checked in
4. Call them - they're sick
5. Create new one-time slot for replacement
6. Add substitute trainer as participant
7. Verify when they arrive
8. Delete original slot (with note)

**Outcome:** Flexible schedule management

---

### **Journey 7: Recurring Classes Setup (Manager)**

**Role:** Manager
**Goal:** Schedule semester classes

1. Tap "Add Time Slot"
2. Enter: "Advanced Tennis - Court 1"
3. Select Monday, 09:00-11:00
4. Check "Repeat weekly"
5. Enter "16" weeks (semester length)
6. Select 3 trainers as participants
7. Select head coach as verifier
8. Tap "Create 16 Slots"
9. All 16 weeks scheduled instantly

**Outcome:** Semester scheduled in 2 minutes

---

### **Journey 8: Delete Recurring Series (Manager)**

**Role:** Manager
**Goal:** Cancel remaining classes

1. Open any recurring class
2. Tap "Delete Series"
3. Dialog: "Delete ALL 16 slots or ONLY this one?"
4. Choose "Delete ALL"
5. Entire series removed
6. All participants notified via real-time sync

**Outcome:** Easy bulk management

---

### **Journey 9: Delete Single Occurrence (Manager)**

**Role:** Manager
**Goal:** Cancel one class due to holiday

1. Open recurring class on holiday date
2. Tap "Delete Series"
3. Dialog appears
4. Choose "Delete ONLY this occurrence"
5. Just that one deleted
6. Rest of series remains intact

**Outcome:** Flexible exception handling

---

### **Journey 10: Late Arrival (Participant)**

**Role:** Participant
**Goal:** Check in after class started

1. Running 15 minutes late
2. Open CheckSync on phone
3. Find today's class (shows as Planned/grey)
4. Tap "Check In" even though late
5. Status → Yellow (Checked-in)
6. Verifier sees they arrived
7. Verifier confirms attendance
8. Status → Green

**Outcome:** Late check-ins still counted

---

### **Journey 11: Accidental Check-In (Participant)**

**Role:** Participant
**Goal:** Undo wrong check-in

1. Accidentally check in to tomorrow's class
2. Notice mistake immediately
3. Tap "Undo Check-In"
4. Confirm undo
5. Status returns to Planned
6. Check in to correct class instead

**Outcome:** Mistakes are reversible

---

### **Journey 12: Attendance Report (Manager)**

**Role:** Manager
**Goal:** Monthly payroll report

1. Tap "Export" in header
2. Set date range: Last month
3. Filter by specific trainers
4. Check "Confirmed only"
5. See "47 records will be exported"
6. Tap "Export CSV"
7. Open in Excel/Sheets
8. Send to payroll

**Outcome:** Accurate attendance records

---

### **Journey 13: Team Member Added Mid-Season (Manager)**

**Role:** Manager
**Goal:** Add new trainer to existing classes

1. Settings → Manage Connections
2. Add new trainer's email
3. They sign up and connect back
4. Edit upcoming class slots
5. Add new trainer to participants
6. They see all future classes
7. Can start checking in immediately

**Outcome:** Easy mid-season onboarding

---

### **Journey 14: Admin Oversight (Admin)**

**Role:** Admin
**Goal:** Monitor all activity

1. Login as Admin
2. See ALL time slots (not just assigned ones)
3. Can verify any attendance
4. Can edit any slot
5. Can delete problematic entries
6. Export complete system reports
7. Manage user roles via connections

**Outcome:** Full system visibility

---

### **Journey 15: Mobile Quick Check-In (Participant)**

**Role:** Participant
**Goal:** Check in from parking lot

1. Pull into parking lot
2. Open CheckSync (PWA on phone)
3. Already on today's view
4. Swipe to find today (horizontal scroll)
5. Tap class card
6. Tap "Check In" (large 44px button)
7. Done in < 10 seconds

**Outcome:** Mobile-optimized speed

---

### **Journey 16: Multi-Class Day (Participant)**

**Role:** Participant
**Goal:** Attend 3 classes today

1. Morning: Check in to 9 AM class
2. Afternoon: Check in to 2 PM class
3. Evening: Check in to 6 PM class
4. See all 3 turn yellow (checked-in)
5. Manager verifies all 3
6. All turn green by end of day

**Outcome:** Multiple check-ins per day

---

### **Journey 17: Past Date Recording (Manager)**

**Role:** Manager
**Goal:** Backfill attendance from last week

1. Open calendar
2. Navigate to last week (← button)
3. Tap past day
4. Add Time Slot for that date
5. Select who attended
6. Immediately check in + verify
7. Status → Green (confirmed)
8. Attendance recorded retroactively

**Outcome:** Historical record keeping

---

### **Journey 18: Future Planning (Manager)**

**Role:** Manager
**Goal:** Plan next quarter

1. Navigate weeks ahead (→ button)
2. Create slots 12 weeks out
3. Use recurring feature for regular classes
4. Mix of recurring and one-time events
5. Assign tentative participants
6. Can edit later as plans change

**Outcome:** Long-term scheduling

---

### **Journey 19: Wrong Person Verified (Admin)**

**Role:** Admin
**Goal:** Fix verification mistake

1. Notice class was verified incorrectly
2. Open the confirmed (green) slot
3. Tap "Undo Confirmation"
4. Returns to checked-in (yellow)
5. Review who actually attended
6. Confirm correctly this time

**Outcome:** Admin can fix any mistakes

---

### **Journey 20: Agenda View for Busy Week (Any Role)**

**Role:** Any
**Goal:** See full week schedule

1. Open app on mobile
2. Week view shows 7 swipeable cards
3. Too cramped with many slots
4. Tap "📋" icon (top right)
5. Switch to Agenda View
6. Scroll through chronological list
7. All slots visible, full details
8. Tap specific slot to manage
9. Tap "📅" to return to week view

**Outcome:** Flexible viewing options

---

## 🔐 Permission Matrix

| Action              | Participant   | Verifier      | Manager | Admin    |
| ------------------- | ------------- | ------------- | ------- | -------- |
| Check In (assigned) | ✅            | ✅            | ✅      | ✅       |
| Undo Check-In (own) | ✅            | ✅            | ✅      | ✅       |
| Verify Attendance   | ❌            | ✅ (assigned) | ✅      | ✅ (any) |
| Create Slots        | ❌            | ❌            | ✅      | ✅       |
| Edit Slots          | ❌ (own only) | ❌ (own only) | ✅      | ✅       |
| Delete Slots        | ❌ (own only) | ❌ (own only) | ✅      | ✅       |
| Export Data         | ❌            | ❌            | ✅      | ✅       |
| Manage Users        | ❌            | ❌            | ❌      | ✅       |
| View All Slots      | ❌ (assigned) | ❌ (assigned) | ✅      | ✅       |

---

## 🏢 Business Use Cases

### **Gym/Fitness Studio**

- **Admin:** Owner
- **Managers:** Senior trainers
- **Verifiers:** Front desk staff
- **Participants:** All trainers

**Benefit:** Track trainer attendance for classes

### **Corporate Training**

- **Admin:** HR Director
- **Managers:** Department heads
- **Verifiers:** Supervisors
- **Participants:** Employees

**Benefit:** Training compliance tracking

### **Sports Coaching (Tennis, etc.)**

- **Admin:** Club owner
- **Managers:** Head coaches
- **Verifiers:** Assistant coaches
- **Participants:** All coaches

**Benefit:** Coach scheduling and verification

### **Consulting Firm**

- **Admin:** Managing partner
- **Managers:** Project managers
- **Verifiers:** Team leads
- **Participants:** Consultants

**Benefit:** Client meeting attendance

### **Education/Tutoring**

- **Admin:** School administrator
- **Managers:** Senior teachers
- **Verifiers:** Department heads
- **Participants:** All teachers

**Benefit:** Class attendance tracking

---

## ✨ Key Features by Role

### **Participant Experience:**

- ✅ Simple interface
- ✅ Only see assigned slots
- ✅ One-tap check-in
- ✅ Status visibility
- ✅ Mobile-optimized

### **Verifier Experience:**

- ✅ See slots needing verification
- ✅ Yellow badge on pending
- ✅ Quick confirm button
- ✅ Can also check in
- ✅ Focused on verification

### **Manager Experience:**

- ✅ Create slots (single or recurring)
- ✅ Edit any slot details
- ✅ Delete slots (smart series delete)
- ✅ Verify attendance
- ✅ Export reports
- ✅ Full schedule visibility

### **Admin Experience:**

- ✅ Everything managers can do
- ✅ Override any verification
- ✅ See all slots system-wide
- ✅ Fix any mistakes
- ✅ Complete audit trail
- ✅ User management

---

## 🚀 Why This Works for Business

### **Clear Accountability**

- Every action tied to a user
- Timestamps for all check-ins/verifications
- Cannot fake attendance
- Full audit trail

### **Flexible Hierarchy**

- Delegate scheduling to managers
- Delegate verification to supervisors
- Keep participants focused on checking in
- Admin can override anything

### **Scalable**

- 5 people or 500 people
- Add users as needed
- Permissions prevent chaos
- Real-time coordination

### **Mobile-First**

- Participants check in from phones
- Managers schedule on the go
- Verifiers confirm from anywhere
- Export to desktop

### **Data Integrity**

- Role-based permissions prevent errors
- Undo functionality for mistakes
- Recurring slots prevent duplication
- Export for external systems

---

## 🎨 UX Improvements Made

1. ✅ **Clear visual cues** - Big "Add Time Slot" button
2. ✅ **Permission-based UI** - Only show what users can do
3. ✅ **Role badges** - 👑 Admin, 📊 Manager, 🔒 Verifier, 👤 Participant
4. ✅ **Smart delete** - Single vs series for recurring
5. ✅ **Mobile horizontal scroll** - Swipeable week cards
6. ✅ **Agenda view toggle** - Alternative mobile view
7. ✅ **Recurring creation** - Bulk schedule multiple weeks
8. ✅ **Auto-close modals** - Smooth workflow
9. ✅ **Touch-optimized** - 44px+ buttons
10. ✅ **Empty state hints** - "Tap to add" on empty days

---

## 🎯 Perfect For

✅ **Any business tracking attendance with verification:**

- Gyms & fitness studios
- Sports coaching facilities
- Corporate training programs
- Consulting firms
- Educational institutions
- Healthcare shift tracking
- Event staffing
- Workshop series
- Membership-based services
- Any verified attendance scenario

**CheckSync provides the complete solution for verified, role-based attendance tracking!** 🎉
