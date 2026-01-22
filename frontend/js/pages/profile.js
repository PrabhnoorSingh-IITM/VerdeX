import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "../utils/toast.js";

const avatar = document.getElementById("avatar");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const enrollment = document.getElementById("enrollment");
const branch = document.getElementById("branch");
const hostel = document.getElementById("hostel");

const collegeRow = document.getElementById("collegeRow");
const college = document.getElementById("college");

const logoutBtn = document.getElementById("logoutBtn");

let userDocRef = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  userDocRef = ref;
  const data = snap.data();

  userName.textContent = data.name || "User";
  userEmail.textContent = data.email || user.email;

  enrollment.textContent = data.enrollment || "—";
  branch.textContent = data.branch || "—";
  hostel.textContent = data.hostel || "—";

  avatar.textContent = (data.name || "U")[0].toUpperCase();

  if (data.role === "admin") {
    collegeRow.style.display = "flex";
    college.textContent = data.college || "—";
  }
});

/* Logout */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  showToast("Logged out");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
});
