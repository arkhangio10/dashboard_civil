// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase
  const firebaseConfig = {
      apiKey: "AIzaSyDIYhOKNaW9ezL_QTgf0PBvOECgIcIFNyM",
      authDomain: "pruebas-9e15f.firebaseapp.com",
      projectId: "pruebas-9e15f",
      storageBucket: "pruebas-9e15f.firebasestorage.app",
      messagingSenderId: "296337222687",
      appId: "1:296337222687:web:769e163e258d6c3f95392a"
    };
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;