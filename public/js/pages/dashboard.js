import { auth, db } from "../firebase/firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { applyTheme } from "../utils/theme.js";

// ✅ Wait for DOM before accessing elements
document.addEventListener("DOMContentLoaded", () => {
  
  const userNameElement = document.getElementById("userEmail");
  const userPointsElement = document.getElementById("userPoints");
  const userReportsElement = document.getElementById("userReports");
  const activeCountElement = document.getElementById("activeCount");
  const resolvedCountElement = document.getElementById("resolvedCount");
  const pendingCountElement = document.getElementById("pendingCount");
  const noticeListElement = document.getElementById("noticeList");

  if (!userNameElement) {
    console.error("Element #userEmail not found in HTML");
    return;
  }

  // Load dashboard data
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // 🔒 Not logged in → redirect
      window.location.href = "pages/login.html";
      return;
    }

    try {
      console.log("User logged in:", user.uid);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("User document not found");
        userNameElement.innerText = "Welcome ";
        return;
      }

      const userData = userSnap.data();
      const fullName = userData.name || "User";
      const firstName = fullName.trim().split(" ")[0];

      // ✅ Update UI
      userNameElement.innerText = `Welcome, ${firstName}!`;
      userPointsElement.innerText = userData.points || 0;
      
      // Load user reports count
      await loadUserReportsCount(user.uid);
      
      // Load campus statistics
      await loadCampusStatistics(userData.campusId);
      
      // Load top contributors
      await loadTopContributors(userData.campusId);
      
      // Load recent notices
      await loadRecentNotices(userData.campusId);

    } catch (error) {
      console.error("Firestore error:", error);
      userNameElement.innerText = "Welcome ";
    }
  });

  // Load user reports count
  async function loadUserReportsCount(userId) {
    try {
      const reportsQuery = query(
        collection(db, "reports"),
        where("userId", "==", userId)
      );
      const reportsSnap = await getDocs(reportsQuery);
      userReportsElement.innerText = reportsSnap.size;
    } catch (error) {
      console.error("Error loading user reports:", error);
      userReportsElement.innerText = "0";
    }
  }

  // Load campus statistics
  async function loadCampusStatistics(campusId) {
    try {
      const reportsQuery = query(
        collection(db, "reports"),
        where("campusId", "==", campusId || "")
      );
      const reportsSnap = await getDocs(reportsQuery);
      
      let activeCount = 0;
      let resolvedCount = 0;
      let pendingCount = 0;
      
      reportsSnap.forEach(doc => {
        const report = doc.data();
        switch (report.status) {
          case "open":
            activeCount++;
            break;
          case "resolved":
            resolvedCount++;
            break;
          case "in-progress":
            pendingCount++;
            break;
        }
      });
      
      activeCountElement.innerText = activeCount;
      resolvedCountElement.innerText = resolvedCount;
      pendingCountElement.innerText = pendingCount;
      
    } catch (error) {
      console.error("Error loading campus statistics:", error);
      activeCountElement.innerText = "0";
      resolvedCountElement.innerText = "0";
      pendingCountElement.innerText = "0";
    }
  }

  // Load top contributors
  async function loadTopContributors(campusId) {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("campusId", "==", campusId || ""),
        orderBy("points", "desc"),
        limit(3)
      );
      const usersSnap = await getDocs(usersQuery);
      const topUsers = usersSnap.docs.map(doc => doc.data());
      
      // Update top 3 display
      for (let i = 0; i < 3; i++) {
        const user = topUsers[i];
        const nameElement = document.getElementById(`rank${i + 1}-name`);
        const pointsElement = document.getElementById(`rank${i + 1}-points`);
        
        if (user) {
          nameElement.innerText = user.name || "Anonymous";
          pointsElement.innerText = `${user.points || 0} pts`;
        } else {
          nameElement.innerText = "---";
          pointsElement.innerText = "0 pts";
        }
      }
      
    } catch (error) {
      console.error("Error loading top contributors:", error);
      // Set default values
      for (let i = 1; i <= 3; i++) {
        document.getElementById(`rank${i}-name`).innerText = "---";
        document.getElementById(`rank${i}-points`).innerText = "0 pts";
      }
    }
  }

  // Load recent notices
  async function loadRecentNotices(campusId) {
    try {
      const noticesQuery = query(
        collection(db, "notices"),
        where("campusId", "==", campusId || ""),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      const noticesSnap = await getDocs(noticesQuery);
      const notices = noticesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (notices.length === 0) {
        noticeListElement.innerHTML = `
          <div class="notice-item">
            <div class="notice-content">
              <h4>No notices yet</h4>
              <p>Check back later for updates from your campus administration.</p>
            </div>
            <div class="notice-date">---</div>
          </div>
        `;
        return;
      }
      
      noticeListElement.innerHTML = notices.map(notice => {
        const date = notice.createdAt ? 
          new Date(notice.createdAt.toDate()).toLocaleDateString() : 
          "Recent";
        
        return `
          <div class="notice-item">
            <div class="notice-content">
              <h4>${notice.title || "Campus Notice"}</h4>
              <p>${notice.content || "No description available."}</p>
            </div>
            <div class="notice-date">${date}</div>
          </div>
        `;
      }).join('');
      
    } catch (error) {
      console.error("Error loading notices:", error);
      noticeListElement.innerHTML = `
        <div class="notice-item">
          <div class="notice-content">
            <h4>Unable to load notices</h4>
            <p>Please check your connection and try again.</p>
          </div>
          <div class="notice-date">---</div>
        </div>
      `;
    }
  }

});