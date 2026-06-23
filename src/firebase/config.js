import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBoZyZQcVDbxtTfzRgXTfK0TU8FEnyIsQ4",
  authDomain: "community-hero-ec722.firebaseapp.com",
  projectId: "community-hero-ec722",
  storageBucket: "community-hero-ec722.firebasestorage.app",
  messagingSenderId: "228187153834",
  appId: "1:228187153834:web:6d858facecb288332fb7d3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);