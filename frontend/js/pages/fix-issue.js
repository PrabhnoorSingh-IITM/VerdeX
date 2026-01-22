import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from "../utils/toast.js";

// DOM elements
const issuesList = document.getElementById("issuesList");
const statusFilter = document.getElementById("statusFilter");
const urgencyFilter = document.getElementById("urgencyFilter");
const fixModal = document.getElementById("fixModal");
const fixForm = document.getElementById("fixForm");
const fixImageInput = document.getElementById("fixImage");
const fixImageLabel = document.getElementById("fixImageLabel");
const fixImagePreview = document.getElementById("fixImagePreview");

let allIssues = [];
let currentIssue = null;
let uploadedFixImage = null;

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

    // Load issues
    await loadIssues(userData.campusId || "");
    
  } catch (error) {
    console.error("Error loading user data:", error);
    showErrorState();
  }
});

// Load issues from Firebase
async function loadIssues(campusId) {
  try {
    const issuesQuery = query(
      collection(db, "reports"),
      where("campusId", "==", campusId),
      orderBy("createdAt", "desc")
    );
    
    const issuesSnap = await getDocs(issuesQuery);
    allIssues = issuesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    filterAndDisplayIssues();
  } catch (error) {
    console.error("Error loading issues:", error);
    showErrorState();
  }
}

// Filter and display issues
function filterAndDisplayIssues() {
  let filteredIssues = [...allIssues];
  
  // Apply status filter
  const statusValue = statusFilter.value;
  if (statusValue !== "all") {
    filteredIssues = filteredIssues.filter(issue => issue.status === statusValue);
  }
  
  // Apply urgency filter
  const urgencyValue = urgencyFilter.value;
  if (urgencyValue !== "all") {
    filteredIssues = filteredIssues.filter(issue => issue.urgency === urgencyValue);
  }
  
  displayIssues(filteredIssues);
}

// Display issues
function displayIssues(issues) {
  if (issues.length === 0) {
    issuesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No issues found</h3>
        <p>There are no issues matching your criteria.</p>
      </div>
    `;
    return;
  }
  
  issuesList.innerHTML = issues.map(issue => {
    const date = issue.createdAt ? 
      new Date(issue.createdAt.toDate()).toLocaleDateString() : 
      "Recent";
    
    const urgencyClass = issue.urgency || "medium";
    const statusClass = issue.status === "in-progress" ? "in-progress" : 
                       issue.status === "resolved" ? "resolved" : "open";
    
    const canFix = issue.status !== "resolved";
    
    return `
      <div class="issue-card">
        <div class="issue-info">
          <h3 class="issue-title">${issue.title || issue.issueType || "Issue"}</h3>
          <div class="issue-meta">
            <span class="issue-type">${issue.issueType || "General"}</span>
            <span class="issue-location">📍 ${issue.location || "Campus"}</span>
          </div>
          <p class="issue-description">${truncateText(issue.description || "No description available", 150)}</p>
          <div class="issue-footer">
            <span class="issue-date">📅 ${date}</span>
            <span class="issue-reporter">👤 ${issue.userEmail || "Anonymous"}</span>
          </div>
        </div>
        <div class="issue-actions">
          <span class="urgency-badge ${urgencyClass}">${issue.urgency || "medium"}</span>
          <span class="status-badge ${statusClass}">${issue.status || "open"}</span>
          ${canFix ? `<button class="fix-btn" onclick="openFixModal('${issue.id}')">Fix Issue</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Open fix modal
window.openFixModal = async function(issueId) {
  try {
    const issueRef = doc(db, "reports", issueId);
    const issueSnap = await getDoc(issueRef);
    
    if (!issueSnap.exists()) {
      showToast("Issue not found", "error");
      return;
    }
    
    currentIssue = {
      id: issueId,
      ...issueSnap.data()
    };
    
    // Populate issue details
    const issueDetails = document.getElementById("issueDetails");
    issueDetails.innerHTML = `
      <h3>Issue Details</h3>
      <div class="issue-detail-item">
        <span class="issue-detail-label">Type:</span>
        <span class="issue-detail-value">${currentIssue.issueType || "General"}</span>
      </div>
      <div class="issue-detail-item">
        <span class="issue-detail-label">Location:</span>
        <span class="issue-detail-value">${currentIssue.location || "Not specified"}</span>
      </div>
      <div class="issue-detail-item">
        <span class="issue-detail-label">Urgency:</span>
        <span class="issue-detail-value">${currentIssue.urgency || "medium"}</span>
      </div>
      <div class="issue-detail-item">
        <span class="issue-detail-label">Description:</span>
        <span class="issue-detail-value">${currentIssue.description || "No description"}</span>
      </div>
      <div class="issue-detail-item">
        <span class="issue-detail-label">Reported by:</span>
        <span class="issue-detail-value">${currentIssue.userEmail || "Anonymous"}</span>
      </div>
      <div class="issue-detail-item">
        <span class="issue-detail-label">Reported on:</span>
        <span class="issue-detail-value">${currentIssue.createdAt ? new Date(currentIssue.createdAt.toDate()).toLocaleDateString() : "Recent"}</span>
      </div>
    `;
    
    // Reset form
    fixForm.reset();
    uploadedFixImage = null;
    fixImagePreview.innerHTML = "";
    updateImageUploadLabel();
    
    // Show modal
    fixModal.classList.add("active");
    
  } catch (error) {
    console.error("Error loading issue details:", error);
    showToast("Failed to load issue details", "error");
  }
};

// Close fix modal
window.closeFixModal = function() {
  fixModal.classList.remove("active");
  currentIssue = null;
  uploadedFixImage = null;
};

// Image upload handling
fixImageLabel.addEventListener("click", () => {
  fixImageInput.click();
});

fixImageInput.addEventListener("change", (e) => {
  handleImageUpload(e.target.files[0]);
});

function handleImageUpload(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("Please select an image file", "error");
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = (e) => {
    uploadedFixImage = {
      file: file,
      url: e.target.result,
      name: file.name
    };
    
    displayImagePreview();
    updateImageUploadLabel();
  };
  
  reader.readAsDataURL(file);
}

function displayImagePreview() {
  if (!uploadedFixImage) return;
  
  fixImagePreview.innerHTML = `
    <div class="image-preview-item">
      <img src="${uploadedFixImage.url}" alt="${uploadedFixImage.name}">
      <button type="button" class="remove-image" onclick="removeImage()">&times;</button>
    </div>
  `;
}

window.removeImage = function() {
  uploadedFixImage = null;
  fixImagePreview.innerHTML = "";
  fixImageInput.value = "";
  updateImageUploadLabel();
};

function updateImageUploadLabel() {
  if (uploadedFixImage) {
    fixImageLabel.querySelector(".upload-text").textContent = uploadedFixImage.name;
    fixImageLabel.querySelector(".upload-hint").textContent = "Click to change image";
  } else {
    fixImageLabel.querySelector(".upload-text").textContent = "Click to upload fix image";
    fixImageLabel.querySelector(".upload-hint").textContent = "Required: Photo showing the resolved issue";
  }
}

// Handle fix form submission
fixForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (!currentIssue) {
    showToast("No issue selected", "error");
    return;
  }
  
  if (!uploadedFixImage) {
    showToast("Please upload a fix image", "error");
    return;
  }
  
  const fixDescription = document.getElementById("fixDescription").value;
  
  if (!fixDescription.trim()) {
    showToast("Please provide a fix description", "error");
    return;
  }
  
  try {
    const user = auth.currentUser;
    if (!user) {
      showToast("Please login again", "error");
      return;
    }
    
    // Update issue status
    const issueRef = doc(db, "reports", currentIssue.id);
    await updateDoc(issueRef, {
      status: "resolved",
      fixedBy: user.uid,
      fixedByStaff: user.email,
      fixedAt: serverTimestamp(),
      fixDescription: fixDescription,
      fixImage: uploadedFixImage.url,
      updatedAt: serverTimestamp()
    });
    
    // Award points to the student who reported the issue
    if (currentIssue.userId) {
      await awardPointsToStudent(currentIssue.userId, currentIssue.urgency);
    }
    
    showToast("Issue marked as fixed successfully!", "success");
    closeFixModal();
    
    // Reload issues
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    await loadIssues(userData.campusId || "");
    
  } catch (error) {
    console.error("Error fixing issue:", error);
    showToast("Failed to fix issue. Please try again.", "error");
  }
});

// Award points to student
async function awardPointsToStudent(studentId, urgency) {
  try {
    const pointsMap = {
      "low": 5,
      "medium": 10,
      "high": 20
    };
    
    const pointsToAward = pointsMap[urgency] || 10;
    
    const studentRef = doc(db, "users", studentId);
    const studentSnap = await getDoc(studentRef);
    
    if (studentSnap.exists()) {
      const studentData = studentSnap.data();
      const currentPoints = studentData.points || 0;
      
      await updateDoc(studentRef, {
        points: currentPoints + pointsToAward,
        updatedAt: serverTimestamp()
      });
      
      console.log(`Awarded ${pointsToAward} points to student ${studentId}`);
    }
  } catch (error) {
    console.error("Error awarding points:", error);
  }
}

// Filter change handlers
statusFilter.addEventListener("change", filterAndDisplayIssues);
urgencyFilter.addEventListener("change", filterAndDisplayIssues);

// Show error state
function showErrorState() {
  issuesList.innerHTML = `
    <div class="error-state">
      <div class="error-icon">❌</div>
      <h3>Unable to load issues</h3>
      <p>Please check your connection and try again.</p>
    </div>
  `;
}