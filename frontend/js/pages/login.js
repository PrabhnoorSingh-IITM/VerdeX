import { auth, db } from "../firebase/firebase.js";
import { signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Get form
const form = document.querySelector(".auth-form");
const emailInput = form.querySelector('input[type="email"]');
const passwordInput = form.querySelector('input[type="password"]');

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    console.log("Attempting login...");

    // 🔐 Firebase login
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Auth success");

    const user = userCredential.user;

    // 📄 Fetch user profile from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("User data not found in database");
      return;
    }

    const role = docSnap.data().role;
    console.log("User role:", role);

    // 🚀 Redirect
    if (role === "admin" || role === "staff") {
      window.location.href = "../pages/admin-dashboard.html";
    } else {
      window.location.href = "../pages/dashboard.html";
    }

  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  }
});
