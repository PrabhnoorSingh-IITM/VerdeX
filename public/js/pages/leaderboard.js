import { db } from "../firebase/firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM elements
const listEl = document.getElementById("leaderboardList");

// Get campusId from sessionStorage (after login)
const CURRENT_CAMPUS_ID = localStorage.getItem("campusId") || "test-campus";

console.log("Final CURRENT_CAMPUS_ID:", CURRENT_CAMPUS_ID);

if (!CURRENT_CAMPUS_ID) {
  console.error("Campus ID not found in sessionStorage");
}


// Render function
function renderLeaderboard(data, pointsKey = "points") {
  if (!data || data.length === 0) {
    // Show empty state
    document.getElementById("rank1-name").textContent = "No data";
    document.getElementById("rank1-points").textContent = "0 pts";
    document.getElementById("rank2-name").textContent = "---";
    document.getElementById("rank2-points").textContent = "0 pts";
    document.getElementById("rank3-name").textContent = "---";
    document.getElementById("rank3-points").textContent = "0 pts";
    listEl.innerHTML = "<li>No data available</li>";
    return;
  }

  // Handle case with less than 3 entries
  const top3 = data.slice(0, 3);
  while (top3.length < 3) {
    top3.push({ name: "---", [pointsKey]: 0 });
  }

  // Top 3
  document.getElementById("rank1-name").textContent = top3[0].name;
  document.getElementById("rank1-points").textContent = `${top3[0][pointsKey]} pts`;

  document.getElementById("rank2-name").textContent = top3[1].name;
  document.getElementById("rank2-points").textContent = `${top3[1][pointsKey]} pts`;

  document.getElementById("rank3-name").textContent = top3[2].name;
  document.getElementById("rank3-points").textContent = `${top3[2][pointsKey]} pts`;

  // Rest
  listEl.innerHTML = "";
  if (data.length > 3) {
    data.slice(3).forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>#${index + 4} ${item.name}</span>
        <span>${item[pointsKey]} pts</span>
      `;
      listEl.appendChild(li);
    });
  }
}

/* ---------------- DEBUG FUNCTION ---------------- */

async function loadAllStudentsDebug() {
  try {
    console.log("Loading ALL students for debug...");
    const q = query(
      collection(db, "users"),
      orderBy("points", "desc")
    );

    const snapshot = await getDocs(q);
    console.log("All students snapshot:", snapshot);
    console.log("Number of all students:", snapshot.docs.length);
    
    const allStudents = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log("Student data:", data);
      return data;
    });
    
    console.log("All students array:", allStudents);
    return allStudents;
  } catch (error) {
    console.error("Error loading all students:", error);
    return [];
  }
}

/* ---------------- LOCAL (STUDENTS) ---------------- */

async function loadLocalLeaderboard() {
  try {
    console.log("Loading local leaderboard...");
    console.log("CURRENT_CAMPUS_ID:", CURRENT_CAMPUS_ID);
    
    if (!CURRENT_CAMPUS_ID) {
      console.error("No campus ID found");
      renderLeaderboard([]);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("campusId", "==", CURRENT_CAMPUS_ID),
      orderBy("points", "desc")
    );

    console.log("Firebase query created:", q);
    const snapshot = await getDocs(q);
    console.log("Snapshot received:", snapshot);
    console.log("Number of docs:", snapshot.docs.length);
    
    const students = snapshot.docs.map(doc => {
      console.log("Student doc:", doc.data());
      return doc.data();
    });
    
    console.log("Students array:", students);

    renderLeaderboard(students, "points");
  } catch (error) {
    console.error("Error loading local leaderboard:", error);
    renderLeaderboard([]);
  }
}

/* ---------------- GLOBAL (CAMPUSES) ---------------- */

async function loadGlobalLeaderboard() {
  try {
    const q = query(
      collection(db, "campuses"),
      orderBy("score", "desc")
    );

    const snapshot = await getDocs(q);
    const campuses = snapshot.docs.map(doc => doc.data());

    renderLeaderboard(campuses, "score");
  } catch (error) {
    console.error("Error loading global leaderboard:", error);
    renderLeaderboard([]);
  }
}

/* ---------------- TOGGLE LOGIC ---------------- */

document.querySelectorAll(".toggle-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    document.querySelectorAll(".toggle-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    if (btn.dataset.type === "local") {
      await loadLocalLeaderboard();
    } else {
      await loadGlobalLeaderboard();
    }
  });
});

// Initial load
loadLocalLeaderboard();

// Debug: Load all students to see what's in the database
loadAllStudentsDebug();



