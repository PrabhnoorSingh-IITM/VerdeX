/**
 * VerdeX Database Layer
 * Handles Firestore-like state.
 */

import { db as firestore, auth } from './firebase-config.js';
import { collection, addDoc, updateDoc, doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const STATUS = {
    OPEN: 'OPEN',
    RESOLVED_BY_STAFF: 'RESOLVED_BY_STAFF',
    VERIFIED_CLOSED: 'VERIFIED_CLOSED'
};

const SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

const TYPE = {
    WATER: 'water',
    ELECTRICITY: 'electricity',
    HYGIENE: 'hygiene',
    SAFETY: 'safety',
    OTHER: 'other'
};

class DB {
    constructor() {
        this.issues = []; // Replaces 'tickets' for V1 compatibility
        this.campuses = [
            { id: 'c1', name: 'IIT Madras', campusScore: 92.4 }
        ];

        // Ensure we are in a browser environment to listen to Firestore
        if (typeof window !== 'undefined') {
            this.issuesRef = collection(firestore, 'issues');
            
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    onSnapshot(this.issuesRef, (snapshot) => {
                        this.issues = snapshot.docs.map(docSnap => ({
                            localId: docSnap.id,
                            ...docSnap.data()
                        }));
                        // Dispatch event so UI can reactively update without throwing errors
                        window.dispatchEvent(new Event('verdexDataReady'));
                        
                        // If any legacy scripts use updateGovernanceScore on global, trigger it
                        if (typeof window.updateGovernanceScore === 'function') {
                            window.updateGovernanceScore();
                        }
                    });
                }
            });
        }
    }

    /**
     * Creates a new issue (V1 format) in Firestore.
     */
    async createIssue(reporterId, data) {
        const payload = {
            id: 'i' + Date.now(),
            reportedBy: reporterId,
            status: STATUS.OPEN,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            campusId: 'c1',
            type: data.type || TYPE.OTHER,
            severity: data.severity || SEVERITY.MEDIUM,
            title: data.title || 'New Report',
            description: data.description,
            photoUrl: data.photoUrl || null,
            assignedTo: null,
            assignedDept: null,
            proofUrl: null,
            resolvedAt: null,
            verifiedAt: null,
            pointsAwarded: 0,
            escalated: false,
            escalationLevel: 0,
            ...data
        };
        
        // Optimistic UI cache update
        this.issues.push({ localId: 'temp', ...payload });
        
        // Write to proper Firestore backend
        try {
            await addDoc(this.issuesRef, payload);
            return payload;
        } catch (e) {
            console.error("Error creating issue in DB: ", e);
            throw e;
        }
    }

    /**
     * Staff resolves an issue (Firestore update)
     */
    async resolveIssue(staffId, localId, proofUrl) {
        const issueRef = doc(firestore, 'issues', localId);
        const payload = {
            status: STATUS.RESOLVED_BY_STAFF,
            assignedTo: staffId,
            proofUrl: proofUrl,
            resolvedAt: Date.now(),
            updatedAt: Date.now()
        };
        await updateDoc(issueRef, payload);
        return payload;
    }

    /**
     * Reporter verifies completion (Firestore update)
     */
    async verifyIssue(userId, localId) {
        const issue = this.issues.find(i => i.localId === localId);
        if (!issue) throw new Error('Issue not found locally');
        if (issue.status !== STATUS.RESOLVED_BY_STAFF) throw new Error('Wait for resolution proof');
        
        if (issue.reportedBy !== userId) {
            throw new Error('Unauthorized: Verification loop check failed.');
        }

        const basePoints = { [SEVERITY.CRITICAL]: 40, [SEVERITY.HIGH]: 30, [SEVERITY.MEDIUM]: 20, [SEVERITY.LOW]: 10 };
        const pts = basePoints[issue.severity] || 0;

        const payload = {
            status: STATUS.VERIFIED_CLOSED,
            verifiedAt: Date.now(),
            updatedAt: Date.now(),
            pointsAwarded: pts
        };

        const issueRef = doc(firestore, 'issues', localId);
        await updateDoc(issueRef, payload);
        return payload;
    }

    getIssue(localId) {
        return this.issues.find(i => i.localId === localId);
    }

    getAllIssues() {
        return this.issues;
    }
}

export const db = new DB();
export { STATUS, SEVERITY, TYPE };
