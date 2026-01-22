import { auth, db } from "../firebase/firebase.js";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initToast, showToast } from "../utils/toast.js";

// Initialize toast
initToast();

// DOM ELEMENTS
const form = document.querySelector(".auth-form");
const roleButtons = document.querySelectorAll(".role-switch button");
const studentFields = document.querySelector(".student-fields");
const staffFields = document.querySelector(".staff-fields");
const hostelSelect = document.getElementById("hostel");
const hostelNoInput = document.getElementById("hostelNo");

let currentRole = "student";

console.log("Signup page loaded");
console.log("Form element found:", form);
console.log("Role buttons found:", roleButtons.length);

// Check if form exists
if (!form) {
  console.error("Form element not found!");
  showToast("Error: Form not loaded properly", "error");
}

console.log("Signup page loaded");

// Test Firebase connection
try {
  console.log("Firebase auth initialized:", auth);
  console.log("Firebase db initialized:", db);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Role switching
roleButtons.forEach(button => {
  button.addEventListener("click", () => {
    roleButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    currentRole = button.textContent.toLowerCase();
    
    // Toggle field visibility
    if (currentRole === "student") {
      studentFields.style.display = "block";
      staffFields.style.display = "none";
    } else if (currentRole === "staff") {
      studentFields.style.display = "none";
      staffFields.style.display = "block";
    }
  });
});

// Hostel selection handling
hostelSelect.addEventListener("change", (e) => {
  if (e.target.value === "yes") {
    hostelNoInput.style.display = "block";
    hostelNoInput.required = true;
  } else {
    hostelNoInput.style.display = "none";
    hostelNoInput.required = false;
    hostelNoInput.value = "";
  }
});

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  console.log("Form submitted with role:", currentRole);

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  console.log("Form data:", { name, email, passwordLength: password.length });

  if (!name || !email || !password) {
    showToast("Please fill in all required fields", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  try {
    console.log("Creating user account...");
    
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("User created successfully:", user.uid);

    // Create user document in Firestore
    const userData = {
      name: name,
      email: email,
      role: currentRole,
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log("User data prepared:", userData);

    // Add role-specific data
    if (currentRole === "student") {
      const university = document.getElementById("university").value.trim();
      const enrollment = document.getElementById("enrollment").value.trim();
      const branch = document.getElementById("branch").value.trim();
      const batch = document.getElementById("batch").value.trim();
      const hostel = hostelSelect.value;
      const hostelNo = hostelNoInput.value.trim();

      if (!university || !enrollment || !branch || !batch) {
        showToast("Please fill in all student fields", "error");
        return;
      }

      userData.university = university;
      userData.enrollment = enrollment;
      userData.branch = branch;
      userData.batch = batch;
      userData.hostel = hostel === "yes" ? hostelNo : "no";
      userData.campusId = ""; // Will be set by admin
      
      console.log("Student data added");
    } else if (currentRole === "staff") {
      const department = document.getElementById("department").value.trim();
      const employeeId = document.getElementById("employeeId").value.trim();

      if (!department || !employeeId) {
        showToast("Please fill in all staff fields", "error");
        return;
      }

      userData.department = department;
      userData.employeeId = employeeId;
      userData.campusId = ""; // Will be set by admin
      
      console.log("Staff data added:", { department, employeeId });
    }

    console.log("Saving user data to Firestore...");
    
    // Save user data to Firestore
    await setDoc(doc(db, "users", user.uid), userData);
    
    console.log("User data saved successfully");

    showToast("Account created successfully!", "success");

    // Redirect based on role
    setTimeout(() => {
      if (currentRole === "staff") {
        console.log("Redirecting to staff dashboard...");
        window.location.href = "staff-dashboard.html";
      } else {
        console.log("Redirecting to student dashboard...");
        window.location.href = "dashboard.html";
      }
    }, 1500);

  } catch (error) {
    console.error("Signup error:", error);
    let errorMessage = "Failed to create account";
    
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "Email already exists. Please login instead.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak. Please use a stronger password.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Network error. Please check your connection.";
    } else {
      errorMessage = `Error: ${error.message}`;
    }
    
    showToast(errorMessage, "error");
  }
});