import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // firebase/auth ইমপোর্ট করা হলো
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyAW8vLWLIVO5gWAiV7zkDjlqVvM_zRfNuE",
  authDomain: "osanlift-38.firebaseapp.com",
  projectId: "osanlift-38",
  storageBucket: "osanlift-38.firebasestorage.app",
  messagingSenderId: "712772667400",
  appId: "1:712772667400:web:6b60b66a34b58604aaa9bd",
  measurementId: "G-LH29NFD1WE"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // auth এক্সপোর্ট করা হলো
export const db = getFirestore(app);

export default app;
// Import the functions you need from the SDKs you need
