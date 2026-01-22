import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, getDocs } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM elements
const noticesList = document.getElementById("noticesList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterTabs = document.querySelectorAll(".filter-tab");

let allNotices = [];
let currentFilter = "all";
let currentSearch = "";

// Initialize
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      await loadNotices(userData.campusId || "");
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    showErrorState();
  }
});

// Load notices from Firebase
async function loadNotices(campusId) {
  try {
    const noticesQuery = query(
      collection(db, "notices"),
      where("campusId", "==", campusId),
      orderBy("createdAt", "desc")
    );
    
    const noticesSnap = await getDocs(noticesQuery);
    allNotices = noticesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    filterAndDisplayNotices();
  } catch (error) {
    console.error("Error loading notices:", error);
    showErrorState();
  }
}

// Filter and display notices
function filterAndDisplayNotices() {
  let filteredNotices = [...allNotices];
  
  // Apply category filter
  if (currentFilter !== "all") {
    filteredNotices = filteredNotices.filter(notice => 
      notice.category === currentFilter
    );
  }
  
  // Apply search filter
  if (currentSearch) {
    const searchLower = currentSearch.toLowerCase();
    filteredNotices = filteredNotices.filter(notice =>
      notice.title?.toLowerCase().includes(searchLower) ||
      notice.content?.toLowerCase().includes(searchLower) ||
      notice.author?.toLowerCase().includes(searchLower)
    );
  }
  
  displayNotices(filteredNotices);
}

// Display notices
function displayNotices(notices) {
  if (notices.length === 0) {
    showEmptyState();
    return;
  }
  
  hideEmptyState();
  
  noticesList.innerHTML = notices.map(notice => {
    const date = notice.createdAt ? 
      new Date(notice.createdAt.toDate()).toLocaleDateString() : 
      "Recent";
    
    const category = notice.category || "general";
    const urgency = notice.urgency || "normal";
    
    return `
      <div class="notice-card glass-card ${category} ${urgency === 'high' ? 'urgent' : ''}" onclick="viewNotice('${notice.id}')">
        <div class="notice-header-info">
          <div>
            <h3 class="notice-title">${notice.title || "Campus Notice"}</h3>
            <div class="notice-meta">
              <span class="notice-category ${category}">${category}</span>
              <span class="notice-date">${date}</span>
            </div>
          </div>
        </div>
        <div class="notice-content">
          ${truncateText(notice.content || "No description available.", 200)}
        </div>
        <div class="notice-footer">
          <span class="notice-author">By ${notice.author || "Administration"}</span>
          <a href="#" class="read-more" onclick="event.stopPropagation(); viewNotice('${notice.id}')">Read More →</a>
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

// View notice details
function viewNotice(noticeId) {
  const notice = allNotices.find(n => n.id === noticeId);
  if (notice) {
    // In a real implementation, this could open a modal or navigate to a detail page
    console.log("View notice:", notice);
    alert(`Notice: ${notice.title}\n\n${notice.content}\n\nBy: ${notice.author || "Administration"}`);
  }
}

// Show empty state
function showEmptyState() {
  noticesList.style.display = "none";
  emptyState.style.display = "block";
}

// Hide empty state
function hideEmptyState() {
  noticesList.style.display = "flex";
  emptyState.style.display = "none";
}

// Show error state
function showErrorState() {
  noticesList.innerHTML = `
    <div class="notice-card glass-card">
      <div class="notice-content">
        <h3 class="notice-title">Unable to load notices</h3>
        <p>Please check your connection and try again later.</p>
      </div>
    </div>
  `;
}

// Filter tab clicks
filterTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    // Update active state
    filterTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
    // Update filter
    currentFilter = tab.dataset.filter;
    filterAndDisplayNotices();
  });
});

// Search functionality
searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value;
  filterAndDisplayNotices();
});

// Clear filters function
window.clearFilters = function() {
  currentFilter = "all";
  currentSearch = "";
  searchInput.value = "";
  
  filterTabs.forEach(tab => tab.classList.remove("active"));
  document.querySelector('[data-filter="all"]').classList.add("active");
  
  filterAndDisplayNotices();
};

// Add some sample notices for demonstration (remove in production)
function addSampleNotices() {
  const sampleNotices = [
    {
      id: "sample1",
      title: "Mid-Term Examination Schedule",
      content: "The mid-term examinations for the current semester will commence from next Monday. Please check your individual schedules for exact timings and venues. Students are advised to carry their ID cards and reach the examination halls 15 minutes before the scheduled time.",
      author: "Academic Affairs",
      category: "academic",
      urgency: "high",
      createdAt: new Date()
    },
    {
      id: "sample2", 
      title: "Annual Cultural Festival",
      content: "Join us for the annual cultural festival 'VerdeX Fest 2024' happening next month. Events include music competitions, dance performances, drama, and various cultural activities. Registration opens next week. Don't miss this opportunity to showcase your talents!",
      author: "Student Council",
      category: "events",
      urgency: "normal",
      createdAt: new Date(Date.now() - 86400000)
    },
    {
      id: "sample3",
      title: "Library Hours Extended",
      content: "Due to upcoming examinations, the library will remain open until 10 PM on weekdays and 8 PM on weekends. Additional study spaces have been arranged in the main building. Please maintain silence and follow library rules.",
      author: "Library Administration",
      category: "academic",
      urgency: "normal",
      createdAt: new Date(Date.now() - 172800000)
    }
  ];
  
  allNotices = sampleNotices;
  filterAndDisplayNotices();
}

// If no Firebase data, show sample notices
setTimeout(() => {
  if (allNotices.length === 0) {
    addSampleNotices();
  }
}, 2000);
