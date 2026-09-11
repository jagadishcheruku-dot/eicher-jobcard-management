// Supervisor & Branch Mapping Engine for Sri Gayathri Automotives (Eicher Tractors)
// Maps short codes and supervisor abbreviations to canonical Dealership Branches

export interface BranchMapping {
  branchId: string;
  branchName: string;
  teluguName: string;
  shortCodes: string[];
  supervisorCodes: string[];
  canonicalVillagesAndMandals?: string[];
}

export const BRANCH_DEFINITIONS: BranchMapping[] = [
  {
    branchId: "machilipatnam_21",
    branchName: "Machilipatnam",
    teluguName: "మచిలీపట్నం",
    shortCodes: ["mtm", "machilipatnam", "machilipatnam_21", "mtm branch", "machilipatnam branch"],
    supervisorCodes: ["mtm", "msg", "m.s.g", "ms_g", "machilipatnam", "mtm_sup", "mtm_supervisor"],
  },
  {
    branchId: "gudiwada",
    branchName: "Gudivada",
    teluguName: "గుడివాడ",
    shortCodes: ["gud", "gudiwada", "gudivada", "gudivada branch", "gudiwada branch"],
    supervisorCodes: ["gud", "gst", "g.s.t", "gs_t", "gudivada", "gudiwada", "gud_sup", "gud_supervisor"],
  },
  {
    branchId: "tiruvuru",
    branchName: "Tiruvuru",
    teluguName: "తిరువూరు",
    shortCodes: ["tvr", "tiruvuru", "tiruvur", "tvr branch", "tiruvuru branch"],
    supervisorCodes: ["tvr", "tsg", "t.s.g", "ts_g", "tiruvuru", "tvr_sup", "tvr_supervisor"],
  },
  {
    branchId: "poranki_vijayawada",
    branchName: "Vijayawada (Poranki)",
    teluguName: "విజయవాడ",
    shortCodes: ["vja", "vijayawada", "poranki", "poranki_vijayawada", "vja branch", "vijayawada branch", "poranki branch"],
    supervisorCodes: ["vja", "vsg", "v.s.g", "vs_g", "vijayawada", "poranki", "vja_sup", "vja_supervisor"],
  },
  {
    branchId: "nandigama",
    branchName: "Nandigama",
    teluguName: "నందిగామ",
    shortCodes: ["ndg", "nandigama", "nandigam", "ndg branch", "nandigama branch"],
    supervisorCodes: ["ndg", "nsg", "n.s.g", "ns_g", "nandigama", "ndg_sup", "ndg_supervisor"],
  },
  {
    branchId: "nuzvidu",
    branchName: "Nuzvidu",
    teluguName: "నూజివీడు",
    shortCodes: ["nzv", "nuzvid", "nuzvidu", "nzv branch", "nuzvid branch"],
    supervisorCodes: ["nzv", "nsg_nzv", "nuzvid", "nuzvidu", "nzv_sup", "nzv_supervisor"],
  },
  {
    branchId: "jaggayyapeta",
    branchName: "Jaggayyapeta",
    teluguName: "జగ్గయ్యపేట",
    shortCodes: ["jpt", "jaggayyapeta", "jaggaiahpeta", "jpt branch", "jaggayyapeta branch"],
    supervisorCodes: ["jpt", "jsg", "j.s.g", "js_g", "jaggayyapeta", "jaggaiahpet", "jpt_sup"],
  },
  {
    branchId: "mylavaram",
    branchName: "Mylavaram",
    teluguName: "మైలవరం",
    shortCodes: ["myl", "mylavaram", "mailavaram", "myl branch", "mylavaram branch"],
    supervisorCodes: ["myl", "msg_myl", "mylavaram", "mailavaram", "myl_sup"],
  },
  {
    branchId: "kanchikacherla",
    branchName: "Kanchikacherla",
    teluguName: "కంచికచర్ల",
    shortCodes: ["kck", "kanchikacherla", "kanchikarla", "kck branch"],
    supervisorCodes: ["kck", "ksg", "k.s.g", "ks_g", "kanchikacherla", "kck_sup"],
  },
];

/**
 * Normalizes any branch / supervisor token for case-insensitive matching
 */
export function normalizeCodeToken(token: any): string {
  if (token == null) return "";
  return String(token)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Resolves canonical branch info given a supervisor code, supervisor name, branch name, or text
 */
export function resolveBranchFromSupervisorOrCode(
  supervisorVal: any,
  branchVal?: any
): {
  branchId: string;
  branchName: string;
  teluguName: string;
  isMatched: boolean;
  matchedFrom: "branch" | "supervisor" | "none";
} {
  const normSup = normalizeCodeToken(supervisorVal);
  const normBranch = normalizeCodeToken(branchVal);

  // 1. Check direct branch match first
  if (normBranch) {
    for (const b of BRANCH_DEFINITIONS) {
      if (
        b.shortCodes.some((code) => {
          const normCode = normalizeCodeToken(code);
          return normBranch === normCode || normBranch.includes(normCode) || normCode.includes(normBranch);
        })
      ) {
        return {
          branchId: b.branchId,
          branchName: b.branchName,
          teluguName: b.teluguName,
          isMatched: true,
          matchedFrom: "branch",
        };
      }
    }
  }

  // 2. Check supervisor code match (e.g. MTM, msg -> Machilipatnam, GUD, gst -> Gudivada, TVR, tsg -> Tiruvuru, VJA, vsg -> Vijayawada, NDG, nsg -> Nandigama)
  if (normSup) {
    for (const b of BRANCH_DEFINITIONS) {
      if (
        b.supervisorCodes.some((supCode) => {
          const normCode = normalizeCodeToken(supCode);
          return normSup === normCode || normSup.startsWith(normCode) || normSup.includes(normCode);
        }) ||
        b.shortCodes.some((code) => {
          const normCode = normalizeCodeToken(code);
          return normSup === normCode || normSup.startsWith(normCode) || normSup.includes(normCode);
        })
      ) {
        return {
          branchId: b.branchId,
          branchName: b.branchName,
          teluguName: b.teluguName,
          isMatched: true,
          matchedFrom: "supervisor",
        };
      }
    }
  }

  // Fallback if no match
  const rawBranchStr = String(branchVal || "").trim();
  const rawSupStr = String(supervisorVal || "").trim();

  return {
    branchId: normBranch || normSup || "unassigned",
    branchName: rawBranchStr || rawSupStr || "Unassigned",
    teluguName: rawBranchStr || rawSupStr || "కేటాయించబడలేదు",
    isMatched: false,
    matchedFrom: "none",
  };
}

/**
 * Checks if a customer or job card record matches a target branch filter or user's assigned branch
 */
export function isRecordMatchingBranchOrSupervisor(
  recordBranch: any,
  recordSupervisor: any,
  targetBranchFilter: string
): boolean {
  if (!targetBranchFilter || targetBranchFilter === "all" || targetBranchFilter === "All Branches (Master)") {
    return true;
  }

  const resolved = resolveBranchFromSupervisorOrCode(recordSupervisor, recordBranch);
  const normTarget = normalizeCodeToken(targetBranchFilter);

  // If resolved branchId or branchName matches target filter
  if (
    normalizeCodeToken(resolved.branchId) === normTarget ||
    normalizeCodeToken(resolved.branchName) === normTarget ||
    normalizeCodeToken(resolved.teluguName) === normTarget
  ) {
    return true;
  }

  // Check if target filter matches any codes in the resolved definition
  const def = BRANCH_DEFINITIONS.find((b) => b.branchId === resolved.branchId || b.branchName === resolved.branchName);
  if (def) {
    if (
      def.shortCodes.some((c) => normalizeCodeToken(c) === normTarget) ||
      def.supervisorCodes.some((c) => normalizeCodeToken(c) === normTarget)
    ) {
      return true;
    }
  }

  // Check raw string inclusions
  const rawB = normalizeCodeToken(recordBranch);
  const rawS = normalizeCodeToken(recordSupervisor);
  if (rawB && (rawB === normTarget || rawB.includes(normTarget) || normTarget.includes(rawB))) return true;
  if (rawS && (rawS === normTarget || rawS.includes(normTarget) || normTarget.includes(rawS))) return true;

  return false;
}
