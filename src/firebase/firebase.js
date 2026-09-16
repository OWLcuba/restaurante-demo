import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
    apiKey: "AIzaSyAwLnWOHIcjqY0xmzcf2T9_FZRPD01Vx7k",
    authDomain: "restaurante-demo-e8430.firebaseapp.com",
    projectId: "restaurante-demo-e8430",
    storageBucket: "restaurante-demo-e8430.firebasestorage.app",
    messagingSenderId: "65300795495",
    appId: "1:65300795495:web:07c92f17e0fb1a849544c2"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

export default app