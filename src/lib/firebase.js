import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuqx6NzLsOfdYM0FlRDaXXCY77FB2gtUI",
  authDomain: "el-elegido-juego.firebaseapp.com",
  projectId: "el-elegido-juego",
  storageBucket: "el-elegido-juego.firebasestorage.app",
  messagingSenderId: "183753048942",
  appId: "1:183753048942:web:37b6660e2e84ed445b777f",
};

const app = initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app);

export const docRef = (code) => doc(firestoreDb, "rooms", code);
export const setDocument = (ref, data) => setDoc(ref, data);
export const updateDocument = (ref, data) => updateDoc(ref, data);
export const deleteDocument = (ref) => deleteDoc(ref);

export async function getDocument(ref) {
  const snap = await getDoc(ref);
  return { exists: () => snap.exists(), data: () => snap.data() };
}

export function onSnapshotCompat(ref, cb) {
  return onSnapshot(ref, (snap) =>
    cb({ exists: () => snap.exists(), data: () => snap.data() }),
  );
}
