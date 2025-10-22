import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import WorkspaceSelector from "./components/WorkspaceSelector";
import { auth } from "./firebase";
import {
  createUserProfile,
  getUserProfile,
  subscribeToWorkspaceTimeSlots,
} from "./services/firestoreService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  detectTimeConflicts,
  subscribeToAllUserTimeSlots,
} from "./services/unifiedAgendaService";
import {
  getUserWorkspaces,
  subscribeToWorkspaceMembers,
  subscribeToUserWorkspaceMemberships,
} from "./services/workspaceService";
import { useStore } from "./store";
import type { User, Workspace } from "./types";

function App() {
  const {
    user,
    setUser,
    currentWorkspace,
    setCurrentWorkspace,
    setTimeSlots,
    setWorkspaceMembers,
    setUsers,
    workspaces,
    setWorkspaces,
    setAllUserTimeSlots,
    setDetectedConflicts,
    resetStore,
  } = useStore();
  const [loading, setLoading] = useState(true);

  // Load user auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);

          if (!userProfile) {
            const newUser: Omit<User, "id"> = {
              email: firebaseUser.email?.toLowerCase() || "",
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "User",
              photoURL: firebaseUser.photoURL || undefined,
              role: "participant",
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            };
            await createUserProfile(firebaseUser.uid, newUser);
            userProfile = { id: firebaseUser.uid, ...newUser };
          }

          setUser(userProfile);

          // Load user workspaces immediately to ensure they're available on first render
          try {
            console.log("🏢 Loading initial workspaces for user:", firebaseUser.uid);
            const userWorkspaces = await getUserWorkspaces(firebaseUser.uid);
            console.log("✅ Initial workspaces loaded:", userWorkspaces.length);
            setWorkspaces(userWorkspaces);
          } catch (error) {
            console.error("❌ Error loading initial workspaces:", error);
          }

          // Check if user has a workspace selected from localStorage
          const lastWorkspaceId = localStorage.getItem("lastWorkspaceId");
          if (lastWorkspaceId) {
            // Validate that the workspace still exists and is not deleted
            try {
              const userWorkspaces = await getUserWorkspaces(firebaseUser.uid);
              const validWorkspace = userWorkspaces.find(
                (w) => w.id === lastWorkspaceId && !w.deletedAt
              );
              if (validWorkspace) {
                setCurrentWorkspace(validWorkspace);
              } else {
                // Clear invalid workspace from localStorage
                localStorage.removeItem("lastWorkspaceId");
              }
            } catch (error) {
              console.error("Error validating workspace:", error);
              localStorage.removeItem("lastWorkspaceId");
            }
          }
        } catch (error) {
          console.error("❌ Error loading user data:", error);
          alert("Error loading data. Check console and Firestore setup.");
        }
      } else {
        // User logged out - reset all store state to prevent data leakage
        resetStore();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setCurrentWorkspace, setWorkspaces]);

  // Load workspace data when workspace is selected
  useEffect(() => {
    if (!currentWorkspace || !user) return;

    // Check if workspace is deleted
    if (currentWorkspace.deletedAt) {
      console.log("🗑️ Workspace is deleted, redirecting to workspace selector");
      setCurrentWorkspace(null);
      return;
    }

    console.log("🏢 Loading workspace data:", currentWorkspace.id);

    // Subscribe to workspace time slots
    const unsubSlots = subscribeToWorkspaceTimeSlots(
      currentWorkspace.id,
      (slots) => {
        console.log("📦 Workspace slots updated:", slots.length);
        setTimeSlots(slots);
      }
    );

    // Subscribe to workspace members
    const unsubMembers = subscribeToWorkspaceMembers(
      currentWorkspace.id,
      async (members) => {
        console.log("👥 Workspace members updated:", members.length);
        setWorkspaceMembers(members);

        // Load user profiles for all members
        const memberProfiles = await Promise.all(
          members.map(async (member) => {
            const profile = await getUserProfile(member.userId);
            return profile;
          })
        );

        const validProfiles = memberProfiles.filter(
          (p): p is User => p !== null
        );
        setUsers(validProfiles);
      }
    );

    return () => {
      unsubSlots();
      unsubMembers();
    };
  }, [
    currentWorkspace,
    user,
    setTimeSlots,
    setWorkspaceMembers,
    setUsers,
    setCurrentWorkspace,
  ]);

  // Load ALL user's time slots across all workspaces for unified agenda
  useEffect(() => {
    if (!user || workspaces.length === 0) {
      setAllUserTimeSlots([]);
      setDetectedConflicts([]);
      return;
    }

    console.log(
      "🌍 Loading unified agenda across",
      workspaces.length,
      "workspaces"
    );

    const workspaceIds = workspaces.map((w) => w.id);
    const unsubscribe = subscribeToAllUserTimeSlots(
      user.id,
      workspaceIds,
      (allSlots) => {
        console.log("📦 All user slots updated:", allSlots.length);
        setAllUserTimeSlots(allSlots);

        // Detect conflicts
        const conflicts = detectTimeConflicts(allSlots);
        console.log("⚠️ Conflicts detected:", conflicts.length);
        setDetectedConflicts(conflicts);
      }
    );

    return () => unsubscribe();
  }, [user, workspaces, setAllUserTimeSlots, setDetectedConflicts]);

  // Subscribe to user workspace memberships to automatically update workspace list
  useEffect(() => {
    if (!user) return;

    console.log("🔗 Setting up workspace membership subscription for user:", user.id);
    
    let isActive = true; // Flag to prevent state updates after component unmounts
    
    const unsubscribe = subscribeToUserWorkspaceMemberships(
      user.id,
      async (memberships) => {
        if (!isActive) return; // Don't update state if component has unmounted
        
        try {
          console.log("📋 Workspace memberships updated:", memberships.length);
          
          // Get workspace details for each membership
          const workspaceIds = memberships.map(m => m.workspaceId);
          const workspaces: Workspace[] = [];

          for (const workspaceId of workspaceIds) {
            if (!isActive) break; // Stop processing if component unmounted
            
            try {
              const workspaceDoc = await getDoc(doc(db, "workspaces", workspaceId));
              if (workspaceDoc.exists()) {
                const workspaceData = workspaceDoc.data();
                // Filter out deleted workspaces
                if (!workspaceData.deletedAt) {
                  workspaces.push({
                    id: workspaceDoc.id,
                    ...workspaceData,
                    createdAt: workspaceData.createdAt?.toMillis() || Date.now(),
                    updatedAt: workspaceData.updatedAt?.toMillis() || Date.now(),
                  } as Workspace);
                } else {
                  console.log("🗑️ Skipping deleted workspace:", workspaceId);
                }
              } else {
                console.log("⚠️ Workspace document not found:", workspaceId);
              }
            } catch (error) {
              console.error("Error loading workspace:", workspaceId, error);
            }
          }

          if (isActive) {
            console.log("✅ Setting workspaces from subscription:", workspaces.length);
            setWorkspaces(workspaces);
          }
        } catch (error) {
          console.error("Error processing workspace memberships:", error);
        }
      }
    );

    return () => {
      console.log("🔌 Cleaning up workspace membership subscription");
      isActive = false;
      unsubscribe();
    };
  }, [user, setWorkspaces]);

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

  if (!user) return <Login />;
  if (!currentWorkspace)
    return <WorkspaceSelector onWorkspaceSelected={() => {}} />;
  return <Dashboard />;
}

export default App;
