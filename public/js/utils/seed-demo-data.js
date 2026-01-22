// Demo Data Seeder for VerdeX
// Run this script in browser console to populate demo data

import { auth, db } from "../firebase/firebase.js";
import { signInWithEmailAndPassword, signOut } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, doc, setDoc, addDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Demo users data
const demoUsers = [
  {
    name: "John Student",
    email: "john@demo.com",
    password: "demo123",
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
    password: "demo123",
    role: "staff",
    department: "Computer Science",
    employeeId: "STF001",
    campusId: "demo-campus",
    points: 200
  },
  {
    name: "Admin User",
    email: "admin@demo.com",
    password: "demo123", 
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
    password: "demo123",
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
    password: "demo123",
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

// Function to seed demo data
export async function seedDemoData() {
  console.log("🌱 Starting demo data seeding...");
  
  try {
    // Create demo users
    for (const user of demoUsers) {
      try {
        // Create auth user
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          "existing@demo.com", // Use existing account or create new ones
          "existingpass123"
        );
        
        // Create user document
        await setDoc(doc(db, "users", userCredential.user.uid), {
          ...user,
          createdAt: serverTimestamp()
        });
        
        console.log(`✅ Created user: ${user.name}`);
      } catch (error) {
        console.log(`ℹ️ User ${user.email} might already exist, creating document...`);
        
        // Create document with fixed ID for demo
        await setDoc(doc(db, "users", `demo-${user.email.replace(/[@.]/g, '-')}`), {
          ...user,
          createdAt: serverTimestamp()
        });
      }
    }
    
    // Create demo reports
    for (const report of demoReports) {
      await addDoc(collection(db, "reports"), report);
      console.log(`✅ Created report: ${report.title}`);
    }
    
    // Create demo notices
    for (const notice of demoNotices) {
      await addDoc(collection(db, "notices"), notice);
      console.log(`✅ Created notice: ${notice.title}`);
    }
    
    console.log("🎉 Demo data seeding complete!");
    console.log("📧 Demo Login Credentials:");
    console.log("Student: john@demo.com / demo123");
    console.log("Staff: jane@demo.com / demo123");
    console.log("Admin: admin@demo.com / demo123");
    
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
  }
}

// Auto-run if in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log("🔧 Development mode detected. Run seedDemoData() to populate demo data.");
}
