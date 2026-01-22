import { auth, db } from "../firebase/firebase.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { initToast, showToast } from "../utils/toast.js";

// init toast once
initToast();

// DOM
const form = document.querySelector(".auth-form");
const emailInput = form.querySelector('input[type="email"]');
const passwordInput = form.querySelector('input[type="password"]');
const googleBtn = document.getElementById("googleLogin");
const roleButtons = document.querySelectorAll(".role-switch button");

let currentRole = "student"; // default role

// Role switching
roleButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    // Remove active from all buttons
    roleButtons.forEach(b => b.classList.remove("active"));
    // Add active to clicked button
    btn.classList.add("active");
    
    // Update current role
    const roles = ["student", "staff", "admin"];
    currentRole = roles[index];
    
    console.log("Selected role:", currentRole);
  });
});

const provider = new GoogleAuthProvider();

/* ---------------- EMAIL LOGIN ---------------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    await handleRedirect(userCred.user);
  } catch (err) {
    showToast("Invalid email or password", "error");
  }
});

/* ---------------- GOOGLE LOGIN ---------------- */

googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    // First-time Google user → create minimal profile
    if (!snap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "",
        email: user.email,
        role: currentRole, // Use selected role
        campusId: "",
        points: 0,
        createdAt: new Date()
      });
    }

    await handleRedirect(user);
  } catch (err) {
    showToast("Google sign-in failed. Try again.", "error");
  }
});

/* ---------------- REDIRECT LOGIC ---------------- */

async function handleRedirect(user) {
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    showToast("User profile not found", "error");
    return;
  }

  const data = docSnap.data();

  // persist session
  localStorage.setItem("campusId", data.campusId || "");
  localStorage.setItem("role", data.role);

  showToast("Login successful");

  setTimeout(() => {
    if (data.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else if (data.role === "staff") {
      window.location.href = "staff-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  }, 400);
}
