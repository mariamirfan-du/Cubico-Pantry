// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgHPOAre8TyVSmaW1QtKD_nz5wJL8VqLw",
  authDomain: "pantry-tracker-e9fda.firebaseapp.com",
  projectId: "pantry-tracker-e9fda",
  storageBucket: "pantry-tracker-e9fda.appspot.com",
  messagingSenderId: "992145695149",
  appId: "1:992145695149:web:b00f3a19d91199ec4e0124",
//   measurementId: "G-DNWHXYMRE3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)

export {firestore}