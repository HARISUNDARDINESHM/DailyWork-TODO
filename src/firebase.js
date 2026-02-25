import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAOx-5L_GmTxImJ3XMGtqZhm592QafPjic",
    authDomain: "dailyworkapp-7f192.firebaseapp.com",
    projectId: "dailyworkapp-7f192",
    storageBucket: "dailyworkapp-7f192.firebasestorage.app",
    messagingSenderId: "868727315010",
    appId: "1:868727315010:web:3550f0f5aa9692e6ad6bdb",
    measurementId: "G-Q2HM48N6YL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
