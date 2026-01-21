import { auth, db } from "../firebase/firebase.js";
import { createUserWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Form elements
const form = document.querySelector(".auth-form");
const inputs = form.querySelectorAll("input");
const roleSelect = form.querySelector("select");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = inputs[0].value.trim();
  const email = inputs[1].value.trim();
  const password = inputs[2].value.trim();
  const role = roleSelect.value;

  if (!role) {
    alert("Please select a role");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;


    await setDoc(doc(db, "users", user.uid), {
      name: fullName,
      email: email,
      role: role,
      createdAt: new Date()
    });

    alert("Signup successful");
    window.location.href = "/frontend/pages/login.html";

  } catch (error) {
    alert(error.message);
  }
});
