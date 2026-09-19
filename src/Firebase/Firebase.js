import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // firebase/auth ইমপোর্ট করা হলো
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWioDjDeYN3ezE8yt5wBENQEHFB3qFbC4",
  authDomain: "hren-cfeaa.firebaseapp.com",
  projectId: "hren-cfeaa",
  storageBucket: "hren-cfeaa.firebasestorage.app",
  messagingSenderId: "572265672202",
  appId: "1:572265672202:web:5010186325f8a82673b9f3",
  measurementId: "G-FW5TM7D389"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app); // auth এক্সপোর্ট করা হলো
export const db = getFirestore(app);

export default app;