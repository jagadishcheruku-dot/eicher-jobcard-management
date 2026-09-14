// Firebase Firestore sync for backend data persistence
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

let firestoreDb: any = null;

function getFirestoreDb() {
  if (!firestoreDb) {
    try {
      const firebaseConfig = {
        apiKey: firebaseConfigJson.apiKey,
        authDomain: firebaseConfigJson.authDomain,
        projectId: firebaseConfigJson.projectId,
        storageBucket: firebaseConfigJson.storageBucket,
        messagingSenderId: firebaseConfigJson.messagingSenderId,
        appId: firebaseConfigJson.appId,
      };

      const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
      firestoreDb = getFirestore(app);
    } catch (error) {
      console.warn('Firebase initialization warning:', error);
      return null;
    }
  }
  return firestoreDb;
}

export async function syncCustomersToFirestore(customers: any[]) {
  try {
    const db = getFirestoreDb();
    if (!db) {
      console.warn('Firestore not available, skipping sync');
      return false;
    }

    const batch = writeBatch(db);
    const customersRef = collection(db, 'customers');

    // Clear existing and add new
    const existing = await getDocs(customersRef);
    existing.docs.forEach((doc) => batch.delete(doc.ref));

    customers.forEach((customer, index) => {
      const docRef = doc(customersRef, String(customer.chassisNo || customer.chassis_no || index));
      batch.set(docRef, customer);
    });

    await batch.commit();
    console.log(`✅ Synced ${customers.length} customers to Firestore`);
    return true;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn('❌ PERMISSION DENIED syncing customers - Firestore Rules likely not PUBLISHED. Backend cannot sync data to Firestore.');
    } else {
      console.warn('Error syncing customers to Firestore:', error.code, error.message);
    }
    return false;
  }
}

export async function syncJobCardsToFirestore(jobCards: any[]) {
  try {
    const db = getFirestoreDb();
    if (!db) {
      console.warn('Firestore not available, skipping sync');
      return false;
    }

    const batch = writeBatch(db);
    const jobCardsRef = collection(db, 'jobCards');

    // Clear existing and add new
    const existing = await getDocs(jobCardsRef);
    existing.docs.forEach((doc) => batch.delete(doc.ref));

    jobCards.forEach((card, index) => {
      const docRef = doc(jobCardsRef, String(card.jobNo || card.onlineJobCardNo || index));
      batch.set(docRef, card);
    });

    await batch.commit();
    console.log(`✅ Synced ${jobCards.length} job cards to Firestore`);
    return true;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn('❌ PERMISSION DENIED syncing job cards - Firestore Rules likely not PUBLISHED. Backend cannot sync data to Firestore.');
    } else {
      console.warn('Error syncing job cards to Firestore:', error.code, error.message);
    }
    return false;
  }
}

export async function syncComplaintsToFirestore(complaints: any[]) {
  try {
    const db = getFirestoreDb();
    if (!db) {
      console.warn('Firestore not available, skipping sync');
      return false;
    }

    const batch = writeBatch(db);
    const complaintsRef = collection(db, 'complaints');

    // Clear existing and add new
    const existing = await getDocs(complaintsRef);
    existing.docs.forEach((doc) => batch.delete(doc.ref));

    complaints.forEach((complaint, index) => {
      const docRef = doc(complaintsRef, String(complaint._id || complaint.id || index));
      batch.set(docRef, complaint);
    });

    await batch.commit();
    console.log(`✅ Synced ${complaints.length} complaints to Firestore`);
    return true;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn('❌ PERMISSION DENIED syncing complaints - Firestore Rules likely not PUBLISHED. Backend cannot sync data to Firestore.');
    } else {
      console.warn('Error syncing complaints to Firestore:', error.code, error.message);
    }
    return false;
  }
}

export async function syncAllDataToFirestore(data: any) {
  try {
    const db = getFirestoreDb();
    if (!db) {
      console.warn('Firestore not available for full sync');
      return false;
    }

    const promises = [];

    if (data.customers && Array.isArray(data.customers)) {
      promises.push(syncCustomersToFirestore(data.customers));
    }

    if (data.jobcards && Array.isArray(data.jobcards)) {
      promises.push(syncJobCardsToFirestore(data.jobcards));
    }

    if (data.complaints && Array.isArray(data.complaints)) {
      promises.push(syncComplaintsToFirestore(data.complaints));
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r !== false);
      if (allSuccess) {
        console.log('✅ All data synced to Firestore');
      }
      return allSuccess;
    }

    return true;
  } catch (error) {
    console.warn('Error in syncAllDataToFirestore:', error);
    return false;
  }
}
