import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// UI element
const userEmailElement = document.getElementById("userEmail");

// Protect page + show user name
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in → redirect
    window.location.href = "/frontend/pages/login.html";
  } else {
    try {
      // 🔍 Fetch user profile from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const fullName = userData.name || "User";

        // ✅ Extract first name
        const firstName = fullName.split(" ")[0];

        userEmailElement.innerText = `Welcome, ${firstName}`;
      } else {
        userEmailElement.innerText = "Welcome";
      }

    } catch (error) {
      console.error("Error loading user profile:", error);
      userEmailElement.innerText = "Welcome";
    }
  }
});

