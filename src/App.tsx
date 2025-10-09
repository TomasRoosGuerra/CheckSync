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
    // Monitor auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Check if user profile exists in Firestore
          let userProfile = await getUserProfile(firebaseUser.uid);

          // Create profile if it doesn't exist
          if (!userProfile) {
            const newUser: Omit<User, "id"> = {
              email: firebaseUser.email?.toLowerCase() || "",
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "User",
              photoURL: firebaseUser.photoURL || undefined,
              role: "participant", // Default role
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
            await createUserProfile(firebaseUser.uid, newUser);
            userProfile = { id: firebaseUser.uid, ...newUser };
          }

          setUser(userProfile);

          // Load connected users
          const connectedUsers = await getConnectedUsers(firebaseUser.uid);
          setUsers([userProfile, ...connectedUsers]);

          // Subscribe to time slots
          const unsubscribeSlots = subscribeToUserTimeSlots(
            firebaseUser.uid,
            (slots) => {
              // Merge and deduplicate slots
              const uniqueSlots = Array.from(
                new Map(slots.map((slot) => [slot.id, slot])).values()
              );
              setTimeSlots(uniqueSlots);
            }
          );

          return () => unsubscribeSlots();
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      } else {
        setUser(null);
        setUsers([]);
        setTimeSlots([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
