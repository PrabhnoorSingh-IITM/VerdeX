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

// Inputs
const profileForm = document.getElementById("profileForm");
const nameInput = document.getElementById("nameInput");
const enrollInput = document.getElementById("enrollInput");
const branchInput = document.getElementById("branchInput");
const hostelInput = document.getElementById("hostelInput");
const collegeInput = document.getElementById("collegeInput");

let currentUserDoc = null;
let currentRole = "student";

// 🔐 Load Profile
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
  currentRole = data.role || "student";

  const firstName = data.name?.split(" ")[0] || "User";
  welcomeUser.innerText = `Welcome, ${firstName} 👋`;

  nameEl.innerText = data.name || "-";
  emailEl.innerText = data.email || user.email;
  enrollmentEl.innerText = data.enrollment || "-";
  branchEl.innerText = data.branch || "-";
  hostelEl.innerText = data.hostel || "-";

  // Prefill form
  nameInput.value = data.name || "";
  enrollInput.value = data.enrollment || "";
  branchInput.value = data.branch || "";
  hostelInput.value = data.hostel || "";

  // 🎓 Admin view
  if (currentRole === "admin") {
    collegeRow.style.display = "block";
    collegeEl.innerText = data.college || "-";
    collegeInput.style.display = "block";
    collegeInput.value = data.college || "";
  }

  // 🌗 Load theme
  if (data.theme === "dark") {
    document.body.classList.add("dark");
  }
});

// 💾 Save Profile
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentUserDoc) return;

  const updatedData = {
    name: nameInput.value.trim(),
    enrollment: enrollInput.value.trim(),
    branch: branchInput.value.trim(),
    hostel: hostelInput.value.trim()
  };

  if (currentRole === "admin") {
    updatedData.college = collegeInput.value.trim();
  }

  await updateDoc(currentUserDoc, updatedData);

  alert("Profile updated ✅");
  location.reload();
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
