import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTIONS = {
  CUSTOMERS: "customers",
  JOB_CARDS: "jobCards",
  COMPLAINTS: "complaints",
  CALL_LOGS: "callLogs",
};

const SYNC_KEYS = {
  CUSTOMERS: "sri_all_customers",
  JOB_CARDS: "sri_all_jobcards",
  COMPLAINTS: "sri_all_complaints",
};

// Only sync when user is idle (5 minutes)
const SYNC_INTERVAL = 5 * 60 * 1000;
let lastSyncTime = 0;

/**
 * Smart sync: Only writes to Firebase, never reads
 * Data comes from localStorage (fast)
 * Firebase keeps a backup (permanent)
 */
export const smartSyncToFirebase = async (dataType: "customers" | "jobCards" | "complaints", data: any[]) => {
  // Throttle: Only sync once every 5 minutes
  if (Date.now() - lastSyncTime < SYNC_INTERVAL) {
    console.log("⏱️ Skipping sync (too soon)");
    return;
  }

  lastSyncTime = Date.now();

  try {
    const collectionName = dataType === "customers" ? COLLECTIONS.CUSTOMERS :
                          dataType === "jobCards" ? COLLECTIONS.JOB_CARDS :
                          COLLECTIONS.COMPLAINTS;

    if (data.length === 0) return;

    const batch = writeBatch(db);
    const collectionRef = collection(db, collectionName);

    // Get existing docs to update (not create)
    const existingDocs = await getDocs(collectionRef);
    const existingIds = new Map(existingDocs.docs.map(d => [d.id, d.ref]));

    // Update existing docs in batch
    let updated = 0;
    for (const item of data.slice(0, 500)) { // Limit to 500 to stay under batch limits
      const key = item["Chassis no"] || item.chassisNo || item.jobNo || item.jobNumber || item.id;

      if (key && existingIds.has(key)) {
        batch.update(existingIds.get(key)!, {
          ...item,
          syncedAt: serverTimestamp(),
        });
        updated++;
      }
    }

    if (updated > 0) {
      await batch.commit();
      console.log(`✅ Synced ${updated} ${dataType} to Firebase (background)`);
    }
  } catch (error) {
    console.error(`❌ Sync error for ${dataType}:`, error);
    // Don't throw - sync failures shouldn't break the app
  }
};

/**
 * Background sync worker
 * Runs every 5 minutes to keep Firebase updated
 */
export const startBackgroundSync = () => {
  // Initial sync after 30 seconds
  setTimeout(() => {
    syncLocalDataToFirebase();
  }, 30000);

  // Then sync every 5 minutes
  setInterval(() => {
    syncLocalDataToFirebase();
  }, SYNC_INTERVAL);
};

const syncLocalDataToFirebase = async () => {
  try {
    // Get data from localStorage
    const customersData = localStorage.getItem(SYNC_KEYS.CUSTOMERS);
    const jobCardsData = localStorage.getItem(SYNC_KEYS.JOB_CARDS);
    const complaintsData = localStorage.getItem(SYNC_KEYS.COMPLAINTS);

    if (customersData) {
      await smartSyncToFirebase("customers", JSON.parse(customersData));
    }

    if (jobCardsData) {
      await smartSyncToFirebase("jobCards", JSON.parse(jobCardsData));
    }

    if (complaintsData) {
      await smartSyncToFirebase("complaints", JSON.parse(complaintsData));
    }
  } catch (error) {
    console.error("❌ Background sync failed:", error);
  }
};

/**
 * Save call log to Firebase immediately
 */
export const saveCallLogToFirebase = async (callLog: any) => {
  try {
    await addDoc(collection(db, COLLECTIONS.CALL_LOGS), {
      ...callLog,
      createdAt: serverTimestamp(),
    });
    console.log("✅ Call log saved to Firebase");
  } catch (error) {
    console.error("❌ Error saving call log:", error);
  }
};

/**
 * Delete customer from Firebase
 */
export const deleteCustomerFromFirebase = async (chassisNo: string) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where("chassisNo", "==", chassisNo)
    );
    const snapshot = await getDocs(q);

    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
    console.log(`✅ Customer ${chassisNo} deleted from Firebase`);
  } catch (error) {
    console.error("❌ Error deleting customer:", error);
  }
};
