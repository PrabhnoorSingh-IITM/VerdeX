import { auth } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Auto redirect user if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Already logged in → go to dashboard
    window.location.href = "../pages/dashboard.html";
  }
});
