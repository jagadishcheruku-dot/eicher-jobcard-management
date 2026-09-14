import { useEffect, useState } from "react";
import {
  getCustomers,
  getJobCards,
  getComplaints,
  saveCustomers,
  saveJobCards,
  saveComplaints,
  hasFirestoreData,
} from "../services/firebaseService";

export const useFirebaseSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync data FROM Firestore TO app
  const syncFromFirestore = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hasData = await hasFirestoreData();
      if (!hasData) {
        console.log("ℹ️ No data in Firestore yet");
        setIsSynced(true);
        return;
      }

      const [customers, jobCards, complaints] = await Promise.all([
        getCustomers(),
        getJobCards(),
        getComplaints(),
      ]);

      // Update localStorage with Firestore data
      if (customers.length > 0) {
        try {
          localStorage.setItem("sri_all_customers", JSON.stringify(customers));
        } catch (e) {
          console.warn("⚠️ Could not update localStorage (quota exceeded)");
        }
      }

      if (jobCards.length > 0) {
        try {
          localStorage.setItem("sri_all_jobcards", JSON.stringify(jobCards));
        } catch (e) {
          console.warn("⚠️ Could not update localStorage (quota exceeded)");
        }
      }

      if (complaints.length > 0) {
        try {
          localStorage.setItem("sri_all_complaints", JSON.stringify(complaints));
        } catch (e) {
          console.warn("⚠️ Could not update localStorage (quota exceeded)");
        }
      }

      console.log("✅ Data synced from Firestore");
      setIsSynced(true);
    } catch (err) {
      console.error("❌ Sync error:", err);
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Sync data FROM app TO Firestore
  const syncToFirestore = async (
    customers?: any[],
    jobCards?: any[],
    complaints?: any[]
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const promises = [];

      if (customers && customers.length > 0) {
        promises.push(saveCustomers(customers));
      }

      if (jobCards && jobCards.length > 0) {
        promises.push(saveJobCards(jobCards));
      }

      if (complaints && complaints.length > 0) {
        promises.push(saveComplaints(complaints));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        console.log("✅ Data synced to Firestore");
      }
    } catch (err) {
      console.error("❌ Sync error:", err);
      setError(err instanceof Error ? err.message : "Sync failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isSynced,
    error,
    syncFromFirestore,
    syncToFirestore,
  };
};
