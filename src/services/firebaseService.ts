import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcMIcHLwydy-Nyzt3RA-zUyUhdkzfSRo",
  authDomain: "eicher-jobcard-management.firebaseapp.com",
  projectId: "eicher-jobcard-management",
  storageBucket: "eicher-jobcard-management.firebasestorage.app",
  messagingSenderId: "470719498844",
  appId: "1:470719498844:web:9117b16590d973d9ccf499",
  measurementId: "G-Q5W7DR1K0Y",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection names
export const CUSTOMERS_COLLECTION = "customers";
export const JOB_CARDS_COLLECTION = "jobCards";
export const COMPLAINTS_COLLECTION = "complaints";
export const CALL_LOGS_COLLECTION = "callLogs";

// Save customer data
export const saveCustomers = async (customers: any[]) => {
  try {
    const customersRef = collection(db, CUSTOMERS_COLLECTION);
    for (const customer of customers) {
      const chassisNo = customer["Chassis no"] || customer.chassisNo || customer.chassis;
      if (chassisNo) {
        const q = query(customersRef, where("chassisNo", "==", chassisNo));
        const snapshot = await getDocs(q);

        const docData = {
          ...customer,
          chassisNo: chassisNo,
          updatedAt: serverTimestamp(),
        };

        if (snapshot.docs.length > 0) {
          await updateDoc(snapshot.docs[0].ref, docData);
        } else {
          await addDoc(customersRef, docData);
        }
      }
    }
    console.log("✅ Customers saved to Firestore");
  } catch (error) {
    console.error("❌ Error saving customers:", error);
    throw error;
  }
};

// Get all customers
export const getCustomers = async () => {
  try {
    const customersRef = collection(db, CUSTOMERS_COLLECTION);
    const snapshot = await getDocs(customersRef);
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`✅ Loaded ${customers.length} customers from Firestore`);
    return customers;
  } catch (error) {
    console.error("❌ Error loading customers:", error);
    return [];
  }
};

// Save job cards
export const saveJobCards = async (jobCards: any[]) => {
  try {
    const jobCardsRef = collection(db, JOB_CARDS_COLLECTION);
    for (const card of jobCards) {
      const jobNo = card.jobNo || card.jobNumber || card.onlineJobCardNo;
      if (jobNo) {
        const q = query(jobCardsRef, where("jobNo", "==", jobNo));
        const snapshot = await getDocs(q);

        const docData = {
          ...card,
          jobNo: jobNo,
          updatedAt: serverTimestamp(),
        };

        if (snapshot.docs.length > 0) {
          await updateDoc(snapshot.docs[0].ref, docData);
        } else {
          await addDoc(jobCardsRef, docData);
        }
      }
    }
    console.log("✅ Job cards saved to Firestore");
  } catch (error) {
    console.error("❌ Error saving job cards:", error);
    throw error;
  }
};

// Get all job cards
export const getJobCards = async () => {
  try {
    const jobCardsRef = collection(db, JOB_CARDS_COLLECTION);
    const snapshot = await getDocs(jobCardsRef);
    const jobCards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`✅ Loaded ${jobCards.length} job cards from Firestore`);
    return jobCards;
  } catch (error) {
    console.error("❌ Error loading job cards:", error);
    return [];
  }
};

// Save complaints/free service
export const saveComplaints = async (complaints: any[]) => {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    for (const complaint of complaints) {
      const id = complaint.id || complaint._id;
      if (id) {
        const q = query(complaintsRef, where("_id", "==", id));
        const snapshot = await getDocs(q);

        const docData = {
          ...complaint,
          _id: id,
          updatedAt: serverTimestamp(),
        };

        if (snapshot.docs.length > 0) {
          await updateDoc(snapshot.docs[0].ref, docData);
        } else {
          await addDoc(complaintsRef, docData);
        }
      }
    }
    console.log("✅ Complaints saved to Firestore");
  } catch (error) {
    console.error("❌ Error saving complaints:", error);
    throw error;
  }
};

// Get all complaints
export const getComplaints = async () => {
  try {
    const complaintsRef = collection(db, COMPLAINTS_COLLECTION);
    const snapshot = await getDocs(complaintsRef);
    const complaints = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(`✅ Loaded ${complaints.length} complaints from Firestore`);
    return complaints;
  } catch (error) {
    console.error("❌ Error loading complaints:", error);
    return [];
  }
};

// Save call log
export const saveCallLog = async (callLog: any) => {
  try {
    const callLogsRef = collection(db, CALL_LOGS_COLLECTION);
    await addDoc(callLogsRef, {
      ...callLog,
      createdAt: serverTimestamp(),
    });
    console.log("✅ Call log saved to Firestore");
  } catch (error) {
    console.error("❌ Error saving call log:", error);
    throw error;
  }
};

// Delete customer
export const deleteCustomer = async (chassisNo: string) => {
  try {
    const customersRef = collection(db, CUSTOMERS_COLLECTION);
    const q = query(customersRef, where("chassisNo", "==", chassisNo));
    const snapshot = await getDocs(q);

    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
    console.log(`✅ Customer ${chassisNo} deleted from Firestore`);
  } catch (error) {
    console.error("❌ Error deleting customer:", error);
    throw error;
  }
};

// Check if Firestore has data
export const hasFirestoreData = async () => {
  try {
    const customersRef = collection(db, CUSTOMERS_COLLECTION);
    const snapshot = await getDocs(query(customersRef, where("chassisNo", "!=", "")));
    return snapshot.size > 0;
  } catch {
    return false;
  }
};
