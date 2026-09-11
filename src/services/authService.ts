import { SystemUser } from "../components/UserManagementModal";
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  BRANCH_DEFINITIONS,
  resolveBranchFromSupervisorOrCode,
  isRecordMatchingBranchOrSupervisor,
} from "../utils/supervisorBranchMapper";

export const DEFAULT_BRANCHES = [
  "All Branches (Master)",
  "Machilipatnam (మచిలీపట్నం)",
  "Gudivada (గుడివాడ)",
  "Tiruvuru (తిరువూరు)",
  "Vijayawada - Poranki (విజయవాడ)",
  "Nandigama (నందిగామ)",
  "Nuzvidu (నూజివీడు)",
  "Jaggayyapeta (జగ్గయ్యపేట)",
  "Mylavaram (మైలవరం)",
  "Kanchikacherla (కంచికచర్ల)",
];

export const DEFAULT_USERS: SystemUser[] = [
  {
    id: "admin_master",
    username: "admin",
    password: "admin123",
    name: "Master Admin (Sri Gayathri)",
    branch: "All Branches (Master)",
    role: "Super Admin",
    allowedMenus: [
      "dashboard",
      "service_camp_planning",
      "free_service_followup",
      "telecalling",
      "complaints",
      "attendance",
      "new_entry",
      "saved_cards",
      "customer_data",
      "customers_and_jobcards",
      "reports",
      "databases",
      "user_management",
    ],
    canEdit: true,
    canDelete: true,
    canUpdate: true,
    canCreate: true,
    isAdmin: true,
    dataScope: "all",
  },
  {
    id: "usr_mtm_sup",
    username: "msg",
    password: "mtm123",
    name: "Machilipatnam Supervisor (MTM)",
    branch: "Machilipatnam",
    role: "Supervisor",
    allowedMenus: [
      "dashboard",
      "free_service_followup",
      "telecalling",
      "complaints",
      "attendance",
      "new_entry",
      "saved_cards",
      "customer_data",
      "customers_and_jobcards",
      "reports",
    ],
    canEdit: true,
    canDelete: false,
    canUpdate: true,
    canCreate: true,
    isAdmin: false,
    dataScope: "branch",
  },
  {
    id: "usr_gud_sup",
    username: "gst",
    password: "gud123",
    name: "Gudivada Supervisor (GUD)",
    branch: "Gudivada",
    role: "Supervisor",
    allowedMenus: [
      "dashboard",
      "free_service_followup",
      "telecalling",
      "complaints",
      "attendance",
      "new_entry",
      "saved_cards",
      "customer_data",
      "customers_and_jobcards",
      "reports",
    ],
    canEdit: true,
    canDelete: false,
    canUpdate: true,
    canCreate: true,
    isAdmin: false,
    dataScope: "branch",
  },
  {
    id: "usr_tvr_sup",
    username: "tsg",
    password: "tvr123",
    name: "Tiruvuru Supervisor (TVR)",
    branch: "Tiruvuru",
    role: "Supervisor",
    allowedMenus: [
      "dashboard",
      "free_service_followup",
      "telecalling",
      "complaints",
      "attendance",
      "new_entry",
      "saved_cards",
      "customer_data",
      "customers_and_jobcards",
      "reports",
    ],
    canEdit: true,
    canDelete: false,
    canUpdate: true,
    canCreate: true,
    isAdmin: false,
    dataScope: "branch",
  },
  {
    id: "usr_vja_sup",
    username: "vsg",
    password: "vja123",
    name: "Vijayawada Supervisor (VJA)",
    branch: "Vijayawada",
    role: "Supervisor",
    allowedMenus: [
      "dashboard",
      "free_service_followup",
      "telecalling",
      "complaints",
      "attendance",
      "new_entry",
      "saved_cards",
      "customer_data",
      "customers_and_jobcards",
      "reports",
    ],
    canEdit: true,
    canDelete: false,
    canUpdate: true,
    canCreate: true,
    isAdmin: false,
    dataScope: "branch",
  },
  {
    id: "usr_ndg_sup",
    username: "nsg",
    password: "ndg123",
    name: "Nandigama Supervisor (NDG)",
    branch: "Nandigama",
    role: "Supervisor",
    allowedMenus: [
      "dashboard",
      "free_service_followup",
      "telecalling",
      "complaints",
      "attendance",
      "new_entry",
      "saved_cards",
      "customer_data",
      "customers_and_jobcards",
      "reports",
    ],
    canEdit: true,
    canDelete: false,
    canUpdate: true,
    canCreate: true,
    isAdmin: false,
    dataScope: "branch",
  },
];

const LOCAL_USERS_KEY = "sri_system_users_v2";
const LOCAL_BRANCHES_KEY = "sri_branches_list_v2";
const CURRENT_USER_KEY = "sri_current_logged_user_v2";

// Load cached users from localStorage
export function getLocalUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((u: SystemUser) => {
          if (u.allowedMenus && u.allowedMenus.includes("customers_and_jobcards")) {
            const set = new Set([...u.allowedMenus, "saved_cards", "customer_data"]);
            return { ...u, allowedMenus: Array.from(set) };
          }
          return u;
        });
      }
    }
  } catch {}
  return DEFAULT_USERS;
}

// Save users to localStorage
export function setLocalUsers(users: SystemUser[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {}
}

// Load cached branches from localStorage
export function getLocalBranches(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_BRANCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_BRANCHES;
}

// Save branches to localStorage
export function setLocalBranches(branches: string[]): void {
  try {
    localStorage.setItem(LOCAL_BRANCHES_KEY, JSON.stringify(branches));
  } catch {}
}

// Get currently logged-in user
export function getCurrentLoggedUser(): SystemUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

// Set currently logged-in user
export function setCurrentLoggedUser(user: SystemUser | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch {}
}

// Save user to Firestore + LocalStorage
export async function persistUserToFirestore(user: SystemUser): Promise<void> {
  try {
    const userRef = doc(db, "system_users", user.id);
    await setDoc(userRef, { ...user, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("Could not save user to Firestore, cached locally:", err);
  }
}

// Delete user from Firestore + LocalStorage
export async function removeUserFromFirestore(userId: string): Promise<void> {
  try {
    const userRef = doc(db, "system_users", userId);
    await deleteDoc(userRef);
  } catch (err) {
    console.warn("Could not delete user from Firestore, updated locally:", err);
  }
}

// Save branches to Firestore
export async function persistBranchesToFirestore(branches: string[]): Promise<void> {
  try {
    const branchRef = doc(db, "settings", "branches");
    await setDoc(branchRef, { list: branches, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("Could not save branches to Firestore, cached locally:", err);
  }
}

// Data isolation helper
export function isRecordVisibleForUser(
  recordBranch: string | undefined | null,
  recordCreatedBy: string | undefined | null,
  currentUser: SystemUser | null,
  adminSelectedBranchFilter: string = "All Branches (Master)",
  recordSupervisor?: string | undefined | null
): boolean {
  if (!currentUser) return true;

  // If currentUser is Super Admin
  if (currentUser.isAdmin || currentUser.role === "Super Admin") {
    if (!adminSelectedBranchFilter || adminSelectedBranchFilter === "All Branches (Master)") {
      return true;
    }
    return isRecordMatchingBranchOrSupervisor(recordBranch, recordSupervisor, adminSelectedBranchFilter);
  }

  // If user dataScope is "all"
  if (currentUser.dataScope === "all") {
    return true;
  }

  // If user dataScope is "own"
  if (currentUser.dataScope === "own") {
    if (!recordCreatedBy) return true;
    return (
      recordCreatedBy.toLowerCase().trim() === currentUser.username.toLowerCase().trim() ||
      recordCreatedBy.toLowerCase().trim() === currentUser.name.toLowerCase().trim()
    );
  }

  // By default, user has dataScope "branch" (or user.branch is assigned)
  if (currentUser.branch && currentUser.branch !== "All Branches (Master)") {
    // Check if record matches by branch, supervisor code, or createdBy
    if (isRecordMatchingBranchOrSupervisor(recordBranch, recordSupervisor, currentUser.branch)) {
      return true;
    }
    if (recordSupervisor && currentUser.username) {
      if (
        recordSupervisor.toLowerCase().includes(currentUser.username.toLowerCase()) ||
        currentUser.username.toLowerCase().includes(recordSupervisor.toLowerCase())
      ) {
        return true;
      }
    }
    // If neither branch nor supervisor is set on record, show it so it is not lost
    if (!recordBranch && !recordSupervisor) {
      return true;
    }
    return false;
  }

  return true;
}

// Subscribe to system users in Firestore for real-time multi-window & multi-device sync
export function subscribeToSystemUsers(callback: (users: SystemUser[]) => void) {
  try {
    const colRef = collection(db, "system_users");
    return onSnapshot(colRef, (snapshot) => {
      const users: SystemUser[] = [];
      snapshot.forEach((d) => {
        users.push({ id: d.id, ...(d.data() as any) });
      });
      if (users.length > 0) {
        setLocalUsers(users);
        callback(users);
      }
    }, (err) => {
      console.warn("Users listener notice:", err);
    });
  } catch (err) {
    console.warn("Could not subscribe to system users:", err);
    return () => {};
  }
}

// Subscribe to branches in Firestore for real-time sync
export function subscribeToBranches(callback: (branches: string[]) => void) {
  try {
    const docRef = doc(db, "settings", "branches");
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          setLocalBranches(data.list);
          callback(data.list);
        }
      }
    }, (err) => {
      console.warn("Branches listener notice:", err);
    });
  } catch (err) {
    console.warn("Could not subscribe to branches:", err);
    return () => {};
  }
}
