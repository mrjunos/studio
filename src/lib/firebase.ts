
// src/lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let appSingleton: FirebaseApp | null = null;
let firestoreSingleton: Firestore | null = null;
let authSingleton: Auth | null = null;
let analyticsSingleton: Analytics | null = null;

function initializeFirebase(): FirebaseApp {
  if (appSingleton) {
    return appSingleton;
  }

  if (!firebaseConfig.projectId) {
    console.error("Firebase projectId is not defined in environment variables. Firebase cannot be initialized.");
    throw new Error("Firebase projectId is not defined. Firebase cannot be initialized.");
  }

  if (getApps().length === 0) {
    try {
      console.log("Initializing Firebase app with projectId:", firebaseConfig.projectId);
      appSingleton = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("CRITICAL: Firebase app initialization failed:", error);
      throw new Error(`Firebase app initialization failed: ${error}`);
    }
  } else {
    appSingleton = getApp();
    console.log("Using existing Firebase app instance.");
  }
  return appSingleton;
}

export function getFirebaseApp(): FirebaseApp {
  if (!appSingleton) {
    return initializeFirebase();
  }
  return appSingleton;
}

export function getDb(): Firestore {
  if (!firestoreSingleton) {
    const currentApp = getFirebaseApp(); // Ensures app is initialized
    try {
      firestoreSingleton = getFirestore(currentApp);
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      throw new Error(`Failed to initialize Firestore: ${error}`);
    }
  }
  return firestoreSingleton;
}

export function getFirebaseAuth(): Auth {
  if (!authSingleton) {
    const currentApp = getFirebaseApp(); // Ensures app is initialized
    try {
      authSingleton = getAuth(currentApp);
    } catch (error) {
      console.error("Error initializing Firebase Auth:", error);
      throw new Error(`Failed to initialize Firebase Auth: ${error}`);
    }
  }
  return authSingleton;
}

export function getClientAnalytics(): Analytics | null {
  if (typeof window !== 'undefined') {
    if (!analyticsSingleton) {
      try {
        const currentApp = getFirebaseApp(); // Ensures app is initialized
        isSupported().then(supported => {
          if (supported) {
            try {
              analyticsSingleton = getAnalytics(currentApp);
            } catch (error) {
               console.error("Error initializing Firebase Analytics on client:", error);
            }
          } else {
            console.log("Firebase Analytics is not supported in this browser environment.");
          }
        }).catch(error => {
          console.error("Error checking Firebase Analytics support:", error);
        });
      } catch (error) {
        console.error("Error getting Firebase app for Analytics:", error);
      }
    }
    // isSupported is async, so analyticsSingleton might still be null immediately after this call.
    // Code using this should handle the possibility of null.
    return analyticsSingleton;
  }
  return null; // Analytics is client-side only
}

// For AuthProvider and other parts that might need the auth instance directly.
// This will initialize auth if it hasn't been already.
export const auth = getFirebaseAuth();

    