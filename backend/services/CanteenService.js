/**
 * VerdeX Canteen Service Protocol
 * Migrates local-storage cart payloads strictly to Firebase Firestore.
 */

import { db } from '../firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ErrorHandler } from './ErrorHandler.js';

export const CanteenService = {
  /**
   * Pushes a Cart JSON matrix directly to the native `canteen_orders` collection.
   * @param {Object} payload { userId, items, pickupTime, totalValue }
   */
  placeOrder: async (payload) => {
    try {
      if (!payload.userId) throw new Error("Anonymous Canteen orders are prohibited.");
      if (!payload.items || payload.items.length === 0) {
        const err = new Error("Cannot process an empty cart.");
        err.code = "invalid-argument";
        throw err;
      }

      const ordersRef = collection(db, 'canteen_orders');
      const secureObj = {
        userId: payload.userId,
        status: 'Confirmed', // Live Kitchen Display updates this to 'Preparing' later
        items: payload.items,
        pickupTime: payload.pickupTime,
        totalValue: payload.totalValue,
        timestamp: serverTimestamp()
      };

      const finalRecord = await addDoc(ordersRef, secureObj);
      console.log(`[Canteen Core] Orchestrated Live Order ${finalRecord.id}.`);
      
      return { success: true, ref: finalRecord.id };
    } catch (firebaseException) {
      ErrorHandler.handle(firebaseException);
      return { success: false };
    }
  }
};
