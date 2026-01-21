import { auth, db } from "../firebase/firebase.js";
import { signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Get form elements
const form = document.querySelector(".auth-form");
const emailInput = form.querySelector('input[type="email"]');
const passwordInput = form.querySelector('input[type="password"]');

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;


    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("User profile not found!");
      return;
    }

    const userData = userDoc.data();
    const role = userData.role;

    alert("Login successful");


    if (role === "staff" || role === "admin") {
      window.location.href = "/frontend/pages/admin-dashboard.html";
    } else {
      window.location.href = "/frontend/pages/dashboard.html";
    }

  } catch (error) {
    alert("Login failed" + error.message);
  }
});
