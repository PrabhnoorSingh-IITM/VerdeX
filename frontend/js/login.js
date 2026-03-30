/**
 * VerdeX Login Logic
 * Handles authentication and role-based redirection.
 */

import { auth } from '../../backend/firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // LOGIN
    const loginForm = document.getElementById('verde-login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type=submit]');
            const oldText = btn.textContent;
            btn.textContent = 'Signing in...';
            btn.disabled = true;

            const email = document.getElementById('loginId').value;
            const password = document.getElementById('loginPass').value;
            
            console.log("VerdeX Auth: Attempting login for", email);
            
            try {
                // Real Firebase Auth Call
                await signInWithEmailAndPassword(auth, email, password);
                if (typeof showToast === 'function') {
                    showToast('Welcome back! 👋', 'success');
                }
                setTimeout(() => window.location.href = 'dashboard.html', 800);
            } catch (error) {
                console.error("Login Error:", error);
                
                // Detailed error mapping
                let msg = "Authentication Failed";
                if (error.code === 'auth/invalid-credential') msg = "Incorrect email or password.";
                else if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
                
                if (typeof showToast === 'function') {
                    showToast(msg, "error");
                } else {
                    alert(msg);
                }
            } finally {
                btn.textContent = oldText;
                btn.disabled = false;
            }
        };
    }

    // SIGNUP
    const signupForm = document.getElementById('verde-signup-form');
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type=submit]');
            const oldText = btn.textContent;
            btn.textContent = 'Creating account...';
            btn.disabled = true;

            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPass').value;
            
            // Gather real profile details
            const roleEl = document.querySelector('input[name="signupRole"]:checked');
            const profile = {
                firstName: document.getElementById('signupFirstName').value,
                lastName: document.getElementById('signupLastName').value,
                rollNo: document.getElementById('signupRollNo').value,
                branch: document.getElementById('signupBranch').value,
                semester: document.getElementById('signupSemester').value,
                role: roleEl ? roleEl.value : 'student',
                createdAt: Date.now(),
                attendance: {
                    overall: 82,
                    subjects: [
                      { name: "Data Structures", code: "CS301", total: 45, present: 38, percentage: 84 },
                      { name: "Operating Systems", code: "CS302", total: 40, present: 30, percentage: 75 },
                      { name: "DBMS", code: "CS303", total: 42, present: 38, percentage: 90 },
                    ]
                },
                fees: {
                    total: 125000,
                    paid: 75000,
                    due: 50000,
                    transactions: [
                      { id: "TXN001", desc: "Semester Fee", amount: 45000, date: "2026-01-15", status: "paid" },
                      { id: "TXN002", desc: "Library Fee", amount: 2000, date: "2026-01-20", status: "paid" },
                      { id: "TXN006", desc: "Semester Fee - Sem 7", amount: 45000, date: "2026-04-01", status: "pending" },
                    ]
                },
                timetable: {
                    Monday: [
                      { time: "9:00-10:00", subject: "Data Structures", room: "CS-101", faculty: "Dr. R. Verma" },
                      { time: "10:00-11:00", subject: "Operating Systems", room: "CS-102", faculty: "Prof. A. Kumar" },
                    ],
                    Tuesday: [
                      { time: "9:00-10:00", subject: "Computer Networks", room: "CS-103", faculty: "Prof. K. Rao" },
                    ],
                    Wednesday: [],
                    Thursday: [],
                    Friday: [],
                    Saturday: []
                }
            };
            
            try {
                // Real Firebase Signup Call
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Save Real User Data to Firestore immediately
                const uid = userCredential.user.uid;
                const { db } = await import('../../backend/firebase-config.js');
                const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                await setDoc(doc(db, 'users', uid), profile);
                
                if (typeof showToast === 'function') {
                    showToast('Account created! Welcome to VerdeX 🎉', 'success');
                }
                setTimeout(() => window.location.href = 'dashboard.html', 1200);
            } catch (error) {
                console.error("Signup Error:", error);
                
                let msg = "Failed to create account";
                if (error.code === 'auth/email-already-in-use') msg = "Email already in use. Please log in.";
                else if (error.code === 'auth/weak-password') msg = "Password is too weak (min 6 characters).";
                
                if (typeof showToast === 'function') {
                    showToast(msg, "error");
                } else {
                    alert(msg);
                }
            } finally {
                btn.textContent = oldText;
                btn.disabled = false;
            }
        };
    }
}

init();
