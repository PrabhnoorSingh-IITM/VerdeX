import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaIM1oTL5x5Ae3q0Tlj3USsjS6K3qx6fA",
  authDomain: "verdex1.firebaseapp.com",
  projectId: "verdex1",
  storageBucket: "verdex1.firebasestorage.app",
  messagingSenderId: "506882929411",
  appId: "1:506882929411:web:8992a7a39414878e922f36",
  measurementId: "G-JGSP8KJGB7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
