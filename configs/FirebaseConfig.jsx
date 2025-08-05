// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvxxB8Ds53nMzSIBJFCURSkNrs9LznwCs",
  authDomain: "tripbot-2eded.firebaseapp.com",
  projectId: "tripbot-2eded",
  storageBucket: "tripbot-2eded.firebasestorage.app",
  messagingSenderId: "911525943345",
  appId: "1:911525943345:web:f170372c023a86fae3dd10",
  measurementId: "G-32H2M6HH0J"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

