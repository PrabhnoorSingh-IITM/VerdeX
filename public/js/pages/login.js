import { auth, db } from "../firebase/firebase.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { initToast, showToast } from "../utils/toast.js";

// init toast once
initToast();

// Auto-load demo data on page load
loadDemoData();

// DOM
const form = document.querySelector(".auth-form");
const emailInput = form.querySelector('input[type="email"]');
const passwordInput = form.querySelector('input[type="password"]');
const googleBtn = document.getElementById("googleLogin");
const roleButtons = document.querySelectorAll(".role-switch button");

let currentRole = "student"; // default role

// Role switching
roleButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    // Remove active from all buttons
    roleButtons.forEach(b => b.classList.remove("active"));
    // Add active to clicked button
    btn.classList.add("active");
    
    // Update current role
    const roles = ["student", "staff", "admin"];
    currentRole = roles[index];
    
    console.log("Selected role:", currentRole);
  });
});

const provider = new GoogleAuthProvider();

/* ---------------- EMAIL LOGIN ---------------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }

  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    await handleRedirect(userCred.user);
  } catch (err) {
    showToast("Invalid email or password", "error");
  }
});

/* ---------------- GOOGLE LOGIN ---------------- */

googleBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    // First-time Google user → create minimal profile
    if (!snap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || "",
        email: user.email,
        role: currentRole, // Use selected role
        campusId: "",
        points: 0,
        createdAt: new Date()
      });
    }

    await handleRedirect(user);
  } catch (err) {
    showToast("Google sign-in failed. Try again.", "error");
  }
});

/* ---------------- REDIRECT LOGIC ---------------- */

async function handleRedirect(user) {
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    showToast("User profile not found", "error");
    return;
  }

  const data = docSnap.data();

  // persist session
  localStorage.setItem("campusId", data.campusId || "");
  localStorage.setItem("role", data.role);

  showToast("Login successful");

  setTimeout(() => {
    if (data.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else if (data.role === "staff") {
      window.location.href = "staff-dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  }, 400);
}

// Demo Data Seeding - Auto-load on page load
async function loadDemoData() {
  try {
    console.log("🌱 Auto-loading demo data...");
    
    // Demo users data
    const demoUsers = [
      {
        name: "John Student",
        email: "john@demo.com",
        role: "student",
        enrollment: "2023CS101",
        branch: "Computer Science",
        batch: "2023-27",
        hostel: "yes",
        hostelNo: "A-101",
        university: "Demo University",
        campusId: "demo-campus",
        points: 150
      },
      {
        name: "Jane Staff",
        email: "jane@demo.com", 
        role: "staff",
        department: "Computer Science",
        employeeId: "STF001",
        campusId: "demo-campus",
        points: 200
      },
      {
        name: "Admin User",
        email: "admin@demo.com",
        role: "admin",
        department: "Administration",
        employeeId: "ADM001",
        campusId: "demo-campus",
        college: "Demo College",
        points: 300
      },
      {
        name: "Alice Student",
        email: "alice@demo.com",
        role: "student", 
        enrollment: "2023CS102",
        branch: "Information Technology",
        batch: "2023-27",
        hostel: "no",
        university: "Demo University",
        campusId: "demo-campus",
        points: 120
      },
      {
        name: "Bob Student",
        email: "bob@demo.com",
        role: "student",
        enrollment: "2023CS103", 
        branch: "Electronics",
        batch: "2023-27",
        hostel: "yes",
        hostelNo: "B-205",
        university: "Demo University",
        campusId: "demo-campus",
        points: 180
      }
    ];

    // Demo reports data
    const demoReports = [
      {
        title: "Broken Chair in Library",
        description: "One of the chairs in the main library has a broken leg and needs immediate repair.",
        category: "furniture",
        priority: "medium",
        location: "Main Library, 2nd Floor",
        status: "open",
        campusId: "demo-campus",
        userId: "demo-user-1",
        userName: "John Student",
        createdAt: serverTimestamp()
      },
      {
        title: "WiFi Not Working in Cafeteria",
        description: "Students are unable to connect to WiFi in the cafeteria area. This is affecting study sessions.",
        category: "network",
        priority: "high", 
        location: "Student Cafeteria",
        status: "in-progress",
        campusId: "demo-campus",
        userId: "demo-user-2",
        userName: "Alice Student",
        createdAt: serverTimestamp()
      },
      {
        title: "Projector Not Working in Room 301",
        description: "The projector in Room 301 is not displaying properly. Need technical support.",
        category: "equipment",
        priority: "medium",
        location: "Academic Block, Room 301",
        status: "resolved",
        campusId: "demo-campus", 
        userId: "demo-user-3",
        userName: "Bob Student",
        createdAt: serverTimestamp()
      }
    ];

    // Demo notices data
    const demoNotices = [
      {
        title: "Campus WiFi Maintenance",
        content: "IT department will be performing maintenance on campus WiFi this weekend. Services may be intermittent.",
        priority: "high",
        campusId: "demo-campus",
        authorId: "demo-admin",
        authorName: "Admin User",
        createdAt: serverTimestamp(),
        isActive: true
      },
      {
        title: "Library Hours Extended",
        content: "Library will remain open until 11 PM during exam week to accommodate students.",
        priority: "medium",
        campusId: "demo-campus", 
        authorId: "demo-admin",
        authorName: "Admin User",
        createdAt: serverTimestamp(),
        isActive: true
      },
      {
        title: "New Campus Cafe Opening",
        content: "A new cafe will be opening next month in the student center with extended hours.",
        priority: "low",
        campusId: "demo-campus",
        authorId: "demo-staff", 
        authorName: "Jane Staff",
        createdAt: serverTimestamp(),
        isActive: true
      }
    ];

    // Create demo users
    for (const user of demoUsers) {
      const userRef = doc(db, "users", `demo-${user.email.replace(/[@.]/g, '-')}`);
      await setDoc(userRef, {
        ...user,
        createdAt: serverTimestamp()
      });
    }

    // Create demo reports
    for (const report of demoReports) {
      await addDoc(collection(db, "reports"), report);
    }

    // Create demo notices
    for (const notice of demoNotices) {
      await addDoc(collection(db, "notices"), notice);
    }

    console.log("🎉 Demo data loaded successfully!");
    console.log("📧 Demo Login Credentials:");
    console.log("Student: john@demo.com / demo123");
    console.log("Staff: jane@demo.com / demo123");
    console.log("Admin: admin@demo.com / demo123");

  } catch (error) {
    console.error("Error loading demo data:", error);
    // Don't show error toast for auto-load to avoid confusing users
  }
}
