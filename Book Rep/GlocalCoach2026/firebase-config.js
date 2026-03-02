/* ============================================
   GlocalCoach 2026 — Firebase Configuration
   ============================================ */

var firebaseConfig = {
    apiKey: "AIzaSyCUnSPsEhJIeYnT6ptmyN7MZnwgeXY39oo",
    authDomain: "glocalcoach2026.firebaseapp.com",
    projectId: "glocalcoach2026",
    storageBucket: "glocalcoach2026.firebasestorage.app",
    messagingSenderId: "165294302965",
    appId: "1:165294302965:web:febc5c5af1571d04ab87bc",
    measurementId: "G-6N9R5KXYMQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global references
var auth = firebase.auth();
var db = firebase.firestore();

console.log('🔥 Firebase initialized — GlocalCoach 2026');
