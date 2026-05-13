import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
}

const mapFirebaseError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-email':
      return 'Formato de e-mail inválido.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Escolha uma senha mais forte.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    default:
      return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    const errorMessage = mapFirebaseError(error.code);
    return { success: false, error: errorMessage };
  }
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    const errorMessage = mapFirebaseError(error.code);
    return { success: false, error: errorMessage };
  }
};

export const signOut = async (): Promise<AuthResponse> => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Erro ao sair da conta.' };
  }
};
