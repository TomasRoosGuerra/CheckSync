import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import { auth } from "./firebase";
import {
  createUserProfile,
  getConnectedUsers,
  getUserProfile,
  subscribeToUserTimeSlots,
} from "./services/firestoreService";
import { useStore } from "./store";
import type { User } from "./types";

function App() {
  const { user, setUser, setUsers, setTimeSlots } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSlots: (() => void) | null = null;

    // Monitor auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous subscription if exists
      if (unsubscribeSlots) {
        unsubscribeSlots();
        unsubscribeSlots = null;
      }

      if (firebaseUser) {
        try {
          // Check if user profile exists in Firestore
          let userProfile = await getUserProfile(firebaseUser.uid);

          // Create profile if it doesn't exist
          if (!userProfile) {
            // Determine initial role
            let initialRole: User["role"] = "participant";
            
            // Check if this is the first user (make them admin)
            const allUsers = await getConnectedUsers(firebaseUser.uid);
            if (allUsers.length === 0) {
              console.log("🎉 First user signup - assigning Admin role");
              initialRole = "admin";
            }
            
            // Optional: Check environment variable for specific admin email
            const firstAdminEmail = import.meta.env.VITE_FIRST_ADMIN_EMAIL;
            if (firstAdminEmail && firebaseUser.email?.toLowerCase() === firstAdminEmail.toLowerCase()) {
              console.log("🎉 First admin email matched - assigning Admin role");
              initialRole = "admin";
            }
            
            const newUser: Omit<User, "id"> = {
              email: firebaseUser.email?.toLowerCase() || "",
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "User",
              photoURL: firebaseUser.photoURL || undefined,
              role: initialRole,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
            await createUserProfile(firebaseUser.uid, newUser);
            userProfile = { id: firebaseUser.uid, ...newUser };
            
            if (initialRole === "admin") {
              console.log("👑 Welcome, Admin! You have full system access.");
            }
          }

          setUser(userProfile);

          // Load connected users
          const connectedUsers = await getConnectedUsers(firebaseUser.uid);
          setUsers([userProfile, ...connectedUsers]);

          // Subscribe to time slots
          console.log("🔔 Setting up Firestore subscription for user:", firebaseUser.uid);
          unsubscribeSlots = subscribeToUserTimeSlots(
            firebaseUser.uid,
            (slots) => {
              console.log("📦 Received slots update from Firestore:", slots.length, "slots");
              console.log("Slots data:", slots);
              // Merge and deduplicate slots
              const uniqueSlots = Array.from(
                new Map(slots.map((slot) => [slot.id, slot])).values()
              );
              console.log("✅ Setting", uniqueSlots.length, "unique slots to state");
              setTimeSlots(uniqueSlots);
            }
          );
        } catch (error) {
          console.error("❌ Error loading user data:", error);
          alert("Error loading data. Check console and Firestore setup.");
        }
      } else {
        setUser(null);
        setUsers([]);
        setTimeSlots([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeSlots) {
        unsubscribeSlots();
      }
    };
  }, [setUser, setUsers, setTimeSlots]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">✓</span>
          </div>
          <div className="text-xl font-semibold text-gray-900">CheckSync</div>
          <div className="text-gray-600 mt-2">Loading...</div>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default App;
