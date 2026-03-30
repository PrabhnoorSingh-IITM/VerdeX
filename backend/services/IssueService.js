/**
 * VerdeX Issue Service Governance Protocol
 * Connects the Frontend UI natively with Firebase via REST-less async promises.
 */

import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
  }
};
