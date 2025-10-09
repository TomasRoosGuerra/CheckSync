import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVSVGTcVmVz5tRBgRk3RY0DFpUMmjIvd8",
  authDomain: "checksync-60519.firebaseapp.com",
  projectId: "checksync-60519",
  storageBucket: "checksync-60519.firebasestorage.app",
  messagingSenderId: "504474658093",
  appId: "1:504474658093:web:ee1fe1d38ebdd49cb25fa4",
  measurementId: "G-PNKKMBVV17",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize Analytics (only in browser, not during SSR)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
export { analytics };

export default app;
