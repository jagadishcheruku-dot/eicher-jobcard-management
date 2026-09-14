import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';

setLogLevel('silent');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const databaseId = (firebaseConfigJson as any).firestoreDatabaseId || '(default)';

// The workshop's job card collection runs to thousands of documents and
// Firestore bills per document read. An in-memory cache is discarded on every
// reload, so each visit re-downloaded the whole collection and the project
// burned through its daily read quota in a handful of page opens. Persisting
// the cache in IndexedDB means a revisit reads from disk and only changed
// documents come over the network.
let firestoreDb: any;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true,
  }, databaseId);
} catch {
  // Private browsing and blocked site data leave IndexedDB unavailable.
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    }, databaseId);
  } catch {
    try {
      firestoreDb = getFirestore(app, databaseId);
    } catch (e) {
      console.warn('Firestore fallback warning:', e);
    }
  }
}

let authInstance: any = null;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn('Firebase getAuth warning:', e);
}

export const db = firestoreDb;
export const auth = authInstance;

