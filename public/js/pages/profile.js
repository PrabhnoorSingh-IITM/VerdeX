import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc } 
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
const editProfileBtn = document.getElementById("editProfileBtn");

// Modal elements
const editModal = document.getElementById("editModal");
const closeModal = document.getElementById("closeModal");
const cancelEdit = document.getElementById("cancelEdit");
const editForm = document.getElementById("editForm");

// Form inputs
const editName = document.getElementById("editName");
const editEmail = document.getElementById("editEmail");
const editEnrollment = document.getElementById("editEnrollment");
const editBranch = document.getElementById("editBranch");
const editHostel = document.getElementById("editHostel");
const editCollege = document.getElementById("editCollege");
const editCollegeGroup = document.getElementById("editCollegeGroup");

let userDocRef = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  userDocRef = ref;
  currentUserData = snap.data();

  userName.textContent = currentUserData.name || "User";
  userEmail.textContent = currentUserData.email || user.email;

  enrollment.textContent = currentUserData.enrollment || "—";
  branch.textContent = currentUserData.branch || "—";
  hostel.textContent = currentUserData.hostel || "—";

  avatar.textContent = (currentUserData.name || "U")[0].toUpperCase();

  if (currentUserData.role === "admin") {
    collegeRow.style.display = "flex";
    college.textContent = currentUserData.college || "—";
    editCollegeGroup.classList.add("show");
  }
});

/* Modal Functions */
function openModal() {
  if (!currentUserData) return;
  
  // Populate form with current data
  editName.value = currentUserData.name || "";
  editEmail.value = currentUserData.email || "";
  editEnrollment.value = currentUserData.enrollment || "";
  editBranch.value = currentUserData.branch || "";
  editHostel.value = currentUserData.hostel || "";
  editCollege.value = currentUserData.college || "";
  
  editModal.classList.add("active");
}

function closeModalFunc() {
  editModal.classList.remove("active");
}

/* Event Listeners */
editProfileBtn.addEventListener("click", openModal);
closeModal.addEventListener("click", closeModalFunc);
cancelEdit.addEventListener("click", closeModalFunc);

// Close modal on overlay click
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) {
    closeModalFunc();
  }
});

// Form submission
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const updatedData = {
    name: editName.value.trim(),
    enrollment: editEnrollment.value.trim(),
    branch: editBranch.value.trim(),
    hostel: editHostel.value.trim()
  };
  
  if (currentUserData.role === "admin") {
    updatedData.college = editCollege.value.trim();
  }
  
  try {
    await updateDoc(userDocRef, updatedData);
    
    // Update local data
    Object.assign(currentUserData, updatedData);
    
    // Update UI
    userName.textContent = updatedData.name;
    avatar.textContent = updatedData.name[0].toUpperCase();
    enrollment.textContent = updatedData.enrollment || "—";
    branch.textContent = updatedData.branch || "—";
    hostel.textContent = updatedData.hostel || "—";
    
    if (currentUserData.role === "admin") {
      college.textContent = updatedData.college || "—";
    }
    
    closeModalFunc();
    showToast("Profile updated successfully");
  } catch (error) {
    console.error("Error updating profile:", error);
    showToast("Failed to update profile", "error");
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
