// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore , collection, addDoc, getDocs, query, where, doc, getDoc,updateDoc, deleteDoc,setDoc} from "firebase/firestore";
import dotenv from "dotenv"
dotenv.config()
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:process.env.FIREBASE_API_KEY, 
  authDomain: process.env.AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId:process.env.MESSAGING_SENDER_ID, 
  appId: process.env.APP_ID,
  measurementId:process.env.MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    firestore,
}



