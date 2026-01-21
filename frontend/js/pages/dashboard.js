import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ Wait for DOM before accessing elements
document.addEventListener("DOMContentLoaded", () => {
  
  const userNameElement = document.getElementById("userEmail");

  if (!userNameElement) {
    console.error("Element #userEmail not found in HTML");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // 🔒 Not logged in → redirect
      window.location.href = "../pages/login.html";
      return;
    }

    try {
      console.log("User logged in:", user.uid);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("User document not found");
        userNameElement.innerText = "Welcome ";
        return;
      }

      const userData = userSnap.data();
      const fullName = userData.name || "User";
      const firstName = fullName.trim().split(" ")[0];

      // ✅ Update UI
      userNameElement.innerText = `Welcome, ${firstName} `;

    } catch (error) {
      console.error("Firestore error:", error);
      userNameElement.innerText = "Welcome ";
    }
  });

});