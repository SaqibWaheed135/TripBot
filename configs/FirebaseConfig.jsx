// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 👈 Add this

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDvxxB8Ds53nMzSIBJFCURSkNrs9LznwCs",
//   authDomain: "tripbot-2eded.firebaseapp.com",
//   projectId: "tripbot-2eded",
//   storageBucket: "tripbot-2eded.appspot.com",  // 👈 should be .appspot.com not .firebasestorage.app
//   messagingSenderId: "911525943345",
//   appId: "1:911525943345:web:f170372c023a86fae3dd10",
//   measurementId: "G-32H2M6HH0J"
// };

const firebaseConfig = {
  apiKey: "AIzaSyAAYE_F48uBjRvgqM9smHpmGjaZ-I4Jr8o",
  authDomain: "tripbrain-planner-ab61d.firebaseapp.com",
  projectId: "tripbrain-planner-ab61d",
  storageBucket: "tripbrain-planner-ab61d.firebasestorage.app",
  messagingSenderId: "634373954851",
  appId: "1:634373954851:web:f4f55ec8714c545e990096",
  measurementId: "G-NNKD366BFZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // 👈 Add this
