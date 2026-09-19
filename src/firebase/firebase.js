import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyB_tykISV76pK0R_DhHQFpnpuWptvAz8L0",
  authDomain: "qbola-sanantonio.firebaseapp.com",
  projectId: "qbola-sanantonio",
  storageBucket: "qbola-sanantonio.firebasestorage.app",
  messagingSenderId: "1052818038226",
  appId: "1:1052818038226:web:fc8a53bf77777f51a13c0b",
  measurementId: "G-RZBWT154DM"
};

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

export default app