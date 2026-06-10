import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBCcsZcqWZSL3EjJ-9e5LE_T0BT8VfSCP0",
  authDomain: "nu-chapter-connect-portal.firebaseapp.com",
  projectId: "nu-chapter-connect-portal",
  storageBucket: "nu-chapter-connect-portal.firebasestorage.app",
  messagingSenderId: "107094410758",
  appId: "1:107094410758:web:690ab70eb405cdd57ae587"
};

const app = initializeApp(firebaseConfig);

export { app };