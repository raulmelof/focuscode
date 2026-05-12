import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// As variáveis de ambiente começam com EXPO_PUBLIC_ para serem lidas nativamente pelo Expo
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Evita a inicialização múltipla caso o HMR (Hot Module Replacement) tente recarregar este arquivo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializamos e exportamos o Firestore (banco de dados) e Auth (autenticação)
export const db = getFirestore(app);
export const auth = getAuth(app);

// Função auxiliar para autenticar anonimamente
export const signInAnonymouslyToFirebase = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Usuário logado anonimamente com UID:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Erro ao autenticar anonimamente:", error);
    throw error;
  }
};

export default app;
