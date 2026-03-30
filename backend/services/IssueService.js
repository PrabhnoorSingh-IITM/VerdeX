/**
 * VerdeX Issue Service Governance Protocol
 * Connects the Frontend UI natively with Firebase via REST-less async promises.
 */

import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ErrorHandler } from './ErrorHandler.js';

export const IssueService = {
  /**
   * Pushes a mathematically sound Object payload directly into Firebase
   * @param {Object} payload 
   * @returns {Object} response confirmation payload for mapping into states
   */
  submitIssue: async (payload) => {
    try {
      // Input Validation
      if (!payload.reporterId) throw new Error("Anonymous issue tracking is prohibited by system constraint.");
      if (!payload.category || !payload.severity || !payload.description) {
         const err = new Error("Invalid format matrix submitted.");
         err.code = "invalid-argument";
         throw err;
      }
      
      const targetRef = collection(db, 'issues');
      // Create schema-locked payload
      const secureObj = {
        reporterId: payload.reporterId,
        status: payload.status || 'open',
        category: payload.category,
        severity: payload.severity,
        location: payload.location,
        description: payload.description,
        proofImageUrl: payload.image || null, // Natively bind to Firebase Storage later
        timestamp: serverTimestamp()
      };

      const finalRecord = await addDoc(targetRef, secureObj);
      console.log(`[Backend Core] Successfully routed Ticket ${finalRecord.id} into database.`);

      return { success: true, ref: finalRecord.id };
    } catch (firebaseException) {
      ErrorHandler.handle(firebaseException);
      return { success: false };
    }
  },

  /**
   * Fetches the user's live issue reports directly from Cloud Firestore.
   * @param {string} userId
   * @returns {Object} { success, data }
   */
  fetchUserIssues: async (userId) => {
    try {
      if (!userId) throw new Error("Anonymous token cannot fetch governance data.");
      const issuesRef = collection(db, 'issues');
      const q = query(issuesRef, where("reporterId", "==", userId));
      const snapshot = await getDocs(q);
      const output = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        output.push({ id: doc.id, timestampValue: data.timestamp?.toMillis() || Date.now(), ...data });
      });
      // Client-side sort to avoid composite index requirement
      return { success: true, data: output.sort((a, b) => b.timestampValue - a.timestampValue) };
    } catch (err) {
      ErrorHandler.handle(err);
      return { success: false, data: [] };
    }
  }
};
