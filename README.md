# VerdeX: Multi-Role Institutional Operating System

VerdeX is a production-ready, Service-Oriented Web Application designed to unify university interactions including Academic Attendance, Real-time Governance, Canteen Commerce, and administrative oversight under a single seamless UI architecture.

**Note:** VerdeX is built on Vanilla Web Technologies (HTML/JS/CSS) natively integrating directly with Google Firebase to guarantee zero-build-step deployment cycles.

## 🚀 Key Features

- **Multi-Role "Multiverse" Access:** One dynamic login node safely routing 5 distinct identities (Student, Faculty, Staff, Canteen, Admin).
- **Service-Oriented Architecture:** Completely decoupled logic. The Firebase database transactions are safely governed by strict NoSQL `Service.js` integrations, decoupling the DOM from the DB.
- **Role-Based Access Control (RBAC):** Firebase Security Rules mathematically guarantee that users cannot interact with data outside of their explicit clearance matrix.
- **Native Live Syncing:** Utilizes Firebase's async `serverTimestamp` processing to deliver live-tracking for Governance reports and Canteen orders.

---

## 🛠 Required Setup (Firebase Secrets)

Because this is a serverless application utilizing native Web imports rather than a traditional Node.js bundler (like Vite/Webpack), **we cannot use a standard `.env` file**.

To run Verdx natively on your local machine, you must configure your Firebase keys. **Your keys belong in an untracked file, `backend/firebase-keys.js`**, which is purposefully blocked by `.gitignore`.

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/PrabhnoorSingh-IITM/VerdeX.git
   cd VerdeX
   ```

1. **Establish the Secrets Integration:**

   Navigate into the `backend` folder and create a new file named exactly `firebase-keys.js`.

   ```bash
   cd backend
   touch firebase-keys.js
   ```

1. **Paste your JSON Payload:**

   Paste your explicit Google Firebase config object inside the file, executing a standard ES6 module export:

   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };
   ```

   *The core `firebase-config.js` engine natively imports this object.*

1. **Launch Application:**

   Use any Live Server tool to serve `frontend/html/login.html` locally.

---

> [!WARNING]
> If you deploy this code publicly via GitHub Pages, Vercel, or Netlify, you must manually inject the `firebaseConfig` object back into `firebase-config.js` prior to hosting, OR utilize your host's environmental secret injection if executing a build-step.

## Architectural Toolbelt

- **Routing:** `auth-guard.js`
- **Error Masking:** `ErrorHandler.js`
- **Button Concurrency Safeties:** `UiState.js`
- **Data Models:** `IssueService`, `CanteenService`, `AttendanceService`