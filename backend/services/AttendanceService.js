/**
 * VerdeX Attendance Service Protocol
 * Migrates inline static rosters to native Firestore read/write streams.
 */

import { db } from '../firebase-config.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ErrorHandler } from './ErrorHandler.js';

export const AttendanceService = {
  /**
   * Faculty pushes an array of processed student records directly into Firestore.
   * @param {string} classId - Course/Class identifier (e.g. 'CS304-Networks')
   * @param {Array} rosterData - Processed records containing {roll, name, pct, presentToday, marked}
   */
  syncAttendanceUpload: async (classId, rosterData) => {
    try {
      if (!rosterData || rosterData.length === 0) throw new Error("Empty roster payload.");

      const collectionRef = collection(db, 'attendance');
      const payload = {
        classId: classId,
        dateString: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        rosterData: rosterData,
        uploaderId: window.StudentData?.uid || 'anon-faculty',
        timestamp: serverTimestamp()
      };

      const finalRecord = await addDoc(collectionRef, payload);
      console.log(`[Attendance Core] Synced Roster Ledger ${finalRecord.id}`);
      
      return { success: true, ref: finalRecord.id };
    } catch (e) {
      ErrorHandler.handle(e);
      return { success: false };
    }
  },

  /**
   * Fetches attendance analytics securely for a specific student's aggregate calculation.
   */
  fetchStudentAggregate: async (uid) => {
    try {
      if(!uid) return null;
      // In a production SQL/NoSQL schema, you'd aggregate the nested array records or run a Cloud Function.
      // For this frontend-native service, we pull constraints.
      const q = query(collection(db, 'attendance'), where('rosterData', 'array-contains', { roll: uid }));
      const docsSnapshot = await getDocs(q);
      
      let rawCount = 0;
      docsSnapshot.forEach(doc => rawCount++);

      // Return synthetic mapping for UI validation since this query logic hinges on array-contains match strategy
      console.log(`[Attendance] Native Query found ${rawCount} aggregate documents.`);
      return { success: true, count: rawCount };
    } catch (e) {
      console.error("Aggregation skip: Network offline or rules locked.");
      return { success: false };
    }
  }
};
