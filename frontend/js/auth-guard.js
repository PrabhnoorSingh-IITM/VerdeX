/**
 * VerdeX Auth Guard & Navigation
 * Protects routes and handles global navigation.
 */

import { auth, db } from '../../backend/firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const PUBLIC_PAGES = ['login.html', 'index.html'];

export function initAuthGuard(requiredRole) {
    onAuthStateChanged(auth, async (user) => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (!user && !PUBLIC_PAGES.includes(currentPage)) {
            window.location.href = 'login.html';
            return;
        }

        if (user) {
            console.log(`Auth Guard: User ${user.email} logged in.`);
            
            // Fetch real user profile from Firestore
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const profileData = userDoc.data();
                    
                    // Format for legacy UI compatibility
                    const legacyProfile = {
                        name: `${profileData.firstName || 'New'} ${profileData.lastName || 'Student'}`,
                        rollNo: profileData.rollNo || 'Pending',
                        branch: profileData.branch || 'Pending',
                        semester: profileData.semester || 'Pending',
                        role: profileData.role || 'student',
                        avatar: (profileData.firstName ? profileData.firstName.charAt(0) : 'U') + 
                                (profileData.lastName ? profileData.lastName.charAt(0) : 'E'),
                        attendance: profileData.attendance || null,
                        fees: profileData.fees || null,
                        timetable: profileData.timetable || null
                    };

                    const cached = sessionStorage.getItem('verdeUserProfile');
                    const serialized = JSON.stringify(legacyProfile);
                    
                    if (cached !== serialized) {
                        sessionStorage.setItem('verdeUserProfile', serialized);
                        // Force structural reload to inject synced user data
                        if (currentPage !== 'login.html') {
                            window.location.reload();
                        }
                    }
                }
            } catch(e) {
                console.error("Auth Guard: Failed to load user profile", e);
            }

            window.dispatchEvent(new CustomEvent('userAuthenticated', { detail: { user } }));
        }
    });
}

export async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Logout Error:", error);
    }
}
