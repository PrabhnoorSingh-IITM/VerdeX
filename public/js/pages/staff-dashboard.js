import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "../utils/toast.js";

// DOM elements
const userNameElement = document.getElementById("userName");
const assignedCountElement = document.getElementById("assignedCount");
const resolvedCountElement = document.getElementById("resolvedCount");
const pendingCountElement = document.getElementById("pendingCount");
const inProgressCountElement = document.getElementById("inProgressCount");
const completedCountElement = document.getElementById("completedCount");
const issuesListElement = document.getElementById("issuesList");

// Initialize
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error("User document not found");
      userNameElement.innerText = "Welcome Staff!";
      return;
    }

    const userData = userSnap.data();
    
    // Check if user is staff or admin
    if (userData.role !== "staff" && userData.role !== "admin") {
      showToast("Access denied. Staff account required.", "error");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
      return;
    }

    const fullName = userData.name || "Staff";
    userNameElement.innerText = `Welcome, ${fullName}!`;
    
    // Load staff dashboard data
    await loadStaffStatistics(user.uid, userData.campusId || "");
    await loadRecentIssues(userData.campusId || "");
    
  } catch (error) {
    console.error("Error loading staff data:", error);
    userNameElement.innerText = "Welcome Staff!";
  }
});

// Load staff statistics
async function loadStaffStatistics(userId, campusId) {
  try {
    // Load assigned issues (open issues for staff to fix)
    const assignedQuery = query(
      collection(db, "reports"),
      where("campusId", "==", campusId),
      where("status", "in", ["open", "in-progress"])
    );
    const assignedSnap = await getDocs(assignedQuery);
    assignedCountElement.innerText = assignedSnap.size;
    
    // Load resolved issues by this staff
    const resolvedQuery = query(
      collection(db, "reports"),
      where("fixedBy", "==", userId),
      where("status", "==", "resolved")
    );
    const resolvedSnap = await getDocs(resolvedQuery);
    resolvedCountElement.innerText = resolvedSnap.size;
    
    // Load campus-wide statistics
    const allReportsQuery = query(
      collection(db, "reports"),
      where("campusId", "==", campusId)
    );
    const allReportsSnap = await getDocs(allReportsQuery);
    
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedToday = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    allReportsSnap.forEach(doc => {
      const report = doc.data();
      switch (report.status) {
        case "open":
          pendingCount++;
          break;
        case "in-progress":
          inProgressCount++;
          break;
        case "resolved":
          if (report.fixedAt && report.fixedAt.toDate() >= today) {
            completedToday++;
          }
          break;
      }
    });
    
    pendingCountElement.innerText = pendingCount;
    inProgressCountElement.innerText = inProgressCount;
    completedCountElement.innerText = completedToday;
    
  } catch (error) {
    console.error("Error loading staff statistics:", error);
    assignedCountElement.innerText = "0";
    resolvedCountElement.innerText = "0";
    pendingCountElement.innerText = "0";
    inProgressCountElement.innerText = "0";
    completedCountElement.innerText = "0";
  }
}

// Load recent issues
async function loadRecentIssues(campusId) {
  try {
    const issuesQuery = query(
      collection(db, "reports"),
      where("campusId", "==", campusId),
      where("status", "in", ["open", "in-progress"]),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const issuesSnap = await getDocs(issuesQuery);
    const issues = issuesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (issues.length === 0) {
      issuesListElement.innerHTML = `
        <div class="issue-item">
          <div class="issue-content">
            <h4>No active issues</h4>
            <p>All issues have been resolved. Great job!</p>
          </div>
          <div class="issue-status">✅</div>
        </div>
      `;
      return;
    }
    
    issuesListElement.innerHTML = issues.map(issue => {
      const date = issue.createdAt ? 
        new Date(issue.createdAt.toDate()).toLocaleDateString() : 
        "Recent";
      
      const urgencyClass = issue.urgency || "medium";
      const statusClass = issue.status === "in-progress" ? "in-progress" : "open";
      
      return `
        <div class="issue-item">
          <div class="issue-content">
            <h4>${issue.title || issue.issueType || "Issue"}</h4>
            <p>${truncateText(issue.description || "No description", 100)}</p>
          </div>
          <div class="issue-status ${statusClass}">${issue.status === "in-progress" ? "In Progress" : "Open"}</div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error("Error loading recent issues:", error);
    issuesListElement.innerHTML = `
      <div class="issue-item">
        <div class="issue-content">
          <h4>Unable to load issues</h4>
          <p>Please check your connection and try again.</p>
        </div>
        <div class="issue-status">❌</div>
      </div>
    `;
  }
}

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
