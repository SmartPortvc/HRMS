import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA7adtzYmh4iLDi3WsBSpqzSc6RSAe3D0Y",
  authDomain: "hrms-workflow-8f4cb.firebaseapp.com",
  projectId: "hrms-workflow-8f4cb",
  storageBucket: "hrms-workflow-8f4cb.firebasestorage.app",
  messagingSenderId: "295174710980",
  appId: "1:295174710980:web:e228427740ba548586cb91"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);