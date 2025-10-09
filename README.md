# CheckSync

A clean, minimalist web and mobile app for verified attendance check-ins through shared time-slot scheduling.

## Features

- **Weekly Calendar View**: See your entire week at a glance with visual status indicators
- **Time Slot Management**: Add, edit, and delete time slots with ease
- **Role-Based Check-In**: Participants check in, verifiers confirm attendance
- **Visual Status System**:
  - Grey = Planned
  - Yellow = Checked-in
  - Green = Confirmed
  - Red = Missed
- **Export Functionality**: Download attendance data as CSV
- **User Management**: Multiple users with participant/verifier roles
- **Responsive Design**: Works seamlessly on web and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Firebase Auth (Email + Google Sign-In)
- **Database**: Firebase Firestore (configured but using local state for demo)
- **Build Tool**: Vite
- **Date Handling**: date-fns

## Workspace-Based Multi-Tenancy

CheckSync uses **workspaces** (teams/projects) for complete isolation:

### **How It Works:**
1. **Create Workspace** - Anyone can create their own workspace
2. **Become Admin** - Creator is automatically admin of their workspace
3. **Invite Team** - Add members by email to your workspace
4. **Assign Roles** - Workspace admin assigns roles to members
5. **Isolated Data** - Each workspace has its own slots and members

### **Example:**
- **Tennis Club A** creates workspace → Their admin manages tennis coaches
- **Tennis Club B** creates workspace → Their admin manages their coaches
- **No data mixing** - Completely separate

### **Role Hierarchy (Per Workspace):**
- **👑 Admin** - Workspace owner, full control
- **📊 Manager** - Create/manage slots, verify, export
- **🔒 Verifier** - Verify attendance, check in
- **👤 Participant** - Check in only

**Security:** Only workspace admins can assign roles within their workspace.

---

## Getting Started

### Prerequisites

- Node.js 20+ (Required for Vite 7 and Firebase)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Firebase (**Required**):

   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Set security rules to: `allow read, write: if request.auth != null;`
   - Copy your Firebase config to `src/firebase.ts`
   - Add authorized domain: `localhost` for development

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Running as PWA (Mobile App)

The app is configured as a Progressive Web App. When deployed to HTTPS:

1. Visit the site on mobile
2. Use "Add to Home Screen" option
3. The app will work like a native mobile app

## Usage

### Login

- Use email/password or Google Sign-In
- First-time users can sign up directly

### Dashboard

- View weekly calendar with all time slots
- Click any day to see details and manage slots
- Color-coded dots show status at a glance

### Managing Time Slots

1. Click a day on the calendar
2. Click "Add Time Slot"
3. Fill in details (title, time, participants, verifier)
4. Save

### Check-In Workflow

1. Participant clicks "Check In" on their slot (status → yellow)
2. Verifier clicks "Confirm Attendance" (status → green)
3. Both users can see the updated status in real-time

### Export Data

1. Click "Export" in header
2. Set date range and filters
3. Download CSV file

### Settings

- Change your role (Participant/Verifier/Both)
- Enable/disable notifications
- Toggle theme (light/dark)
- Sign out

## Design Philosophy

CheckSync follows Apple's design principles:

- **Minimalism**: Clean, uncluttered interface
- **Clarity**: Clear visual hierarchy and status indicators
- **Efficiency**: Minimal screens, maximum functionality
- **Consistency**: Round buttons, soft colors, consistent spacing
- **Modern**: Card layouts, subtle shadows, smooth transitions

## Project Structure

```
check-in/
├── src/
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── WeekCalendar.tsx
│   │   ├── DayView.tsx
│   │   ├── SlotModal.tsx
│   │   ├── Export.tsx
│   │   └── Settings.tsx
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── exportUtils.ts
│   ├── App.tsx
│   ├── store.ts
│   ├── types.ts
│   ├── firebase.ts
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.cjs
└── vite.config.ts
```

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
