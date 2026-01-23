import { auth, db } from "../firebase/firebase.js";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initToast, showToast } from "../utils/toast.js";

// Initialize toast
initToast();

console.log("Signup page loaded");

// Test Firebase connection
try {
  console.log("Firebase auth initialized:", auth);
  console.log("Firebase db initialized:", db);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSignup);
} else {
  initSignup();
}

function initSignup() {
  console.log("Initializing signup...");

  // DOM ELEMENTS
  const form = document.querySelector(".auth-form");
  const roleButtons = document.querySelectorAll(".role-switch button");
  const studentFields = document.querySelector(".student-fields");
  const staffFields = document.querySelector(".staff-fields");
  const hostelSelect = document.getElementById("hostel");
  const hostelNoInput = document.getElementById("hostelNo");
  const googleSignupBtn = document.getElementById("googleSignup");
  const submitBtn = form?.querySelector('button[type="submit"]');

  // Check if form exists
  if (!form) {
    console.error("Form not found!");
    return;
  }

  if (!submitBtn) {
    console.error("Submit button not found!");
    return;
  }

  console.log("Form elements found:", { form, submitBtn, roleButtons: roleButtons.length });

  const provider = new GoogleAuthProvider();

  let currentRole = "student";
  let isSubmitting = false;

// Role switching
if (roleButtons.length > 0 && studentFields && staffFields) {
  roleButtons.forEach(button => {
    button.addEventListener("click", () => {
      roleButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      currentRole = button.textContent.toLowerCase();
      console.log("Role switched to:", currentRole);
    
    // Toggle field visibility and required attributes
    if (currentRole === "student") {
      studentFields.style.display = "block";
      staffFields.style.display = "none";
      
      // Set required for student fields (except hostelNo which is conditional)
      studentFields.querySelectorAll("input:not(#hostelNo), select").forEach(field => {
        field.required = true;
      });
      // Remove required from staff fields
      staffFields.querySelectorAll("input").forEach(field => {
        field.required = false;
      });
    } else if (currentRole === "staff") {
      studentFields.style.display = "none";
      staffFields.style.display = "block";
      
      // Set required for staff fields
      staffFields.querySelectorAll("input").forEach(field => {
        field.required = true;
      });
      // Remove required from student fields
      studentFields.querySelectorAll("input, select").forEach(field => {
        field.required = false;
      });
    }
  });
});
} else {
  console.warn("Role switching not initialized - missing elements");
}

// Hostel selection handling
if (hostelSelect && hostelNoInput) {
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
}

// Form submission
console.log("Setting up form submission handler...");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Form submit event triggered!");
  
  // Prevent duplicate submissions
  if (isSubmitting) {
    return;
  }
  
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
    // Set loading state
    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";
    
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
        // Reset loading state
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
        return;
      }
      
      // Validate hostel number if hostel is selected
      if (hostel === "yes" && !hostelNo) {
        showToast("Please enter hostel number", "error");
        // Reset loading state
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
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
        // Reset loading state
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign Up";
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
  } finally {
    // Reset loading state
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign Up";
  }
});

/* ---------- GOOGLE SIGN-UP ---------- */

if (googleSignupBtn) {
  googleSignupBtn.addEventListener("click", async () => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    try {
      // Set loading state
      isSubmitting = true;
      googleSignupBtn.disabled = true;
      googleSignupBtn.textContent = "Signing up...";
      
      const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    // First-time Google user → create profile with selected role
    if (!snap.exists()) {
      const userData = {
        name: user.displayName || "",
        email: user.email,
        role: currentRole,
        points: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (currentRole === "student") {
        userData.campusId = ""; // Will be set by admin
        userData.university = "";
        userData.enrollment = "";
        userData.branch = "";
        userData.batch = "";
        userData.hostel = "no";
      } else if (currentRole === "staff") {
        userData.campusId = ""; // Will be set by admin
        userData.department = "";
        userData.employeeId = "";
      }

      await setDoc(userRef, userData);
      showToast("Account created successfully!", "success");
    } else {
      showToast("Account already exists. Please login instead.", "error");
      return;
    }

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
  } catch (err) {
    console.error("Google sign-up error:", err);
    showToast("Google sign-up failed. Try again.", "error");
  } finally {
    // Reset loading state
    isSubmitting = false;
    googleSignupBtn.disabled = false;
    googleSignupBtn.textContent = "Sign up with Google";
  }
  });
}
} // End of initSignup function