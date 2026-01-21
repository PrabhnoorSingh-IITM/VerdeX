import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// UI Elements
const welcomeUser = document.getElementById("welcomeUser");
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const enrollmentEl = document.getElementById("enrollment");
const branchEl = document.getElementById("branch");
const hostelEl = document.getElementById("hostel");
const collegeRow = document.getElementById("collegeRow");
const collegeEl = document.getElementById("college");
const themeBtn = document.getElementById("themeBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUserDoc = null;

// 🔐 Auth Guard + Load Profile
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../pages/login.html";
    return;
  }

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return;

  currentUserDoc = docRef;
  const data = docSnap.data();

  const firstName = data.name?.split(" ")[0] || "User";
  welcomeUser.innerText = `Welcome, ${firstName} 👋`;

  nameEl.innerText = data.name || "-";
  emailEl.innerText = data.email || user.email;
  enrollmentEl.innerText = data.enrollment || "-";
  branchEl.innerText = data.branch || "-";
  hostelEl.innerText = data.hostel || "-";

  // 🎓 Admin view
  if (data.role === "admin") {
    collegeRow.style.display = "block";
    collegeEl.innerText = data.college || "-";
  }

  // 🌗 Load theme
  if (data.theme === "dark") {
    document.body.classList.add("dark");
  }
});

// 🌗 Theme Toggle
themeBtn.addEventListener("click", async () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  if (currentUserDoc) {
    await updateDoc(currentUserDoc, {
      theme: isDark ? "dark" : "light"
    });
  }
});

// 🚪 Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../pages/login.html";
});
