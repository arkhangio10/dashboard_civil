// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase - Idealmente esto debería venir de variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDIYhOKNaW9ezL_QTgf0PBvOECgIcIFNyM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pruebas-9e15f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pruebas-9e15f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pruebas-9e15f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "296337222687",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:296337222687:web:769e163e258d6c3f95392a"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;