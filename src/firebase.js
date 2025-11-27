import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB8ugTqPfTgMMneMY8_Jmacwf91dsINTjk",
    authDomain: "brewbooks-mvp.firebaseapp.com",
    projectId: "brewbooks-mvp",
    storageBucket: "brewbooks-mvp.firebasestorage.app",
    messagingSenderId: "495427564009",
    appId: "1:495427564009:web:48423750ee60f033191b78",
    measurementId: "G-MEASUREMENT_ID" // This might need to be updated if available, but optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
