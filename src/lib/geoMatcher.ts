// Smart AI/Google Maps-Style Village & Mandal Matcher for Krishna & NTR Districts
import { DEALERSHIP_DATA, VillageInfo, MandalInfo, BranchInfo } from '../data/dealershipData';

export interface GeoMatchResult {
  matched: boolean;
  villageName: string;
  teluguVillageName?: string;
  mandalName: string;
  teluguMandalName?: string;
  branchName: string;
  dealershipCode: '4731' | '4732';
  distanceKm: number;
  approxTravelTime: string;
  confidence: number; // 0.0 - 1.0
  matchType: 'exact' | 'alias' | 'address_token' | 'fuzzy' | 'fallback';
  originalVillage: string;
  originalMandal: string;
}

export interface CanonicalVillageEntry {
  villageName: string;
  teluguVillageName?: string;
  mandalName: string;
  teluguMandalName?: string;
  branchName: string;
  dealershipCode: '4731' | '4732';
  distanceKm: number;
  approxTravelTime: string;
  normalizedVillage: string;
  phoneticVillage: string;
  normalizedMandal: string;
}

// Normalize strings: lowercase, remove non-alphanumeric
export function cleanGeoToken(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Phonetic transformation for Telugu English transliteration variations
export function toPhoneticKey(str: string): string {
  let s = cleanGeoToken(str);
  s = s.replace(/th/g, 't');
  s = s.replace(/ph/g, 'p');
  s = s.replace(/ch/g, 'c');
  s = s.replace(/sh/g, 's');
  s = s.replace(/ee/g, 'i');
  s = s.replace(/ea/g, 'i');
  s = s.replace(/oo/g, 'u');
  s = s.replace(/ou/g, 'au');
  s = s.replace(/w/g, 'v');
  s = s.replace(/y/g, 'i');
  s = s.replace(/ai/g, 'i');
  s = s.replace(/ay/g, 'i');
  s = s.replace(/ck/g, 'k');
  // strip repeated double letters
  s = s.replace(/([a-z])\1+/g, '$1');
  // drop trailing vowels 'u', 'a' which are frequently omitted in Telugu names (e.g., Tiruvuru -> Tiruvur, Nandigama -> Nandigam)
  if (s.length > 4 && (s.endsWith('u') || s.endsWith('a') || s.endsWith('i'))) {
    s = s.slice(0, -1);
  }
  return s;
}

// Noise words in address strings
const NOISE_WORDS = new Set([
  'vill', 'village', 'villg', 'vlg', 'gramam', 'gram', 'town', 'post', 'po',
  'mandal', 'mndl', 'mdl', 'tehsil', 'tq', 'dist', 'district', 'dno', 'hno',
  'door', 'no', 'near', 'opp', 'opposite', 'beside', 'behind', 'road', 'rd',
  'street', 'st', 'bazar', 'bazaar', 'center', 'centre', 'junction', 'jnc',
  'krishna', 'ntr', 'ap', 'andhra', 'pradesh', 'main', 'old', 'new', 'r'
]);

// Strip common suffix noise for cleaner stem comparison
export function stripSuffixNoise(str: string): string {
  let s = cleanGeoToken(str);
  s = s.replace(/(village|vill|vlg|town|gramam|gram|post|mandal|mdl|dist)$/, '');
  return s;
}

// Known colloquial/abbreviated aliases in Krishna and NTR districts
const ALIAS_MAP: Record<string, { village?: string; mandal?: string }> = {
  // Mandals & Major Hubs
  'mailavaram': { mandal: 'Mylavaram', village: 'Mylavaram Town' },
  'mayilavaram': { mandal: 'Mylavaram', village: 'Mylavaram Town' },
  'mylavaram': { mandal: 'Mylavaram', village: 'Mylavaram Town' },
  'kanchikacharla': { mandal: 'Kanchikacherla', village: 'Kanchikacherla' },
  'kanchikarla': { mandal: 'Kanchikacherla', village: 'Kanchikacherla' },
  'kkacherla': { mandal: 'Kanchikacherla', village: 'Kanchikacherla' },
  'jaggayyapet': { mandal: 'Jaggayyapeta', village: 'Jaggayyapeta Town' },
  'jaggaiahpet': { mandal: 'Jaggayyapeta', village: 'Jaggayyapeta Town' },
  'jaggaiahpeta': { mandal: 'Jaggayyapeta', village: 'Jaggayyapeta Town' },
  'jpet': { mandal: 'Jaggayyapeta', village: 'Jaggayyapeta Town' },
  'jpeta': { mandal: 'Jaggayyapeta', village: 'Jaggayyapeta Town' },
  'chanderlapadu': { mandal: 'Chandarlapadu', village: 'Chandarlapadu' },
  'chandralapadu': { mandal: 'Chandarlapadu', village: 'Chandarlapadu' },
  'chandaralapadu': { mandal: 'Chandarlapadu', village: 'Chandarlapadu' },
  'clpadu': { mandal: 'Chandarlapadu', village: 'Chandarlapadu' },
  'gkonduru': { mandal: 'G Konduru', village: 'G.Konduru' },
  'gkondur': { mandal: 'G Konduru', village: 'G.Konduru' },
  'geekonduru': { mandal: 'G Konduru', village: 'G.Konduru' },
  'akonduru': { mandal: 'A.Konduru', village: 'A.Konduru' },
  'akondur': { mandal: 'A.Konduru', village: 'A.Konduru' },
  'vissannapet': { mandal: 'Vissannapeta', village: 'Vissannapeta Town' },
  'vissannapeta': { mandal: 'Vissannapeta', village: 'Vissannapeta Town' },
  'visannapet': { mandal: 'Vissannapeta', village: 'Vissannapeta Town' },
  'visannapeta': { mandal: 'Vissannapeta', village: 'Vissannapeta Town' },
  'vpet': { mandal: 'Vissannapeta', village: 'Vissannapeta Town' },
  'vpeta': { mandal: 'Vissannapeta', village: 'Vissannapeta Town' },
  'penuganchprolu': { mandal: 'Penuganchiprolu', village: 'Penuganchiprolu' },
  'pgprolu': { mandal: 'Penuganchiprolu', village: 'Penuganchiprolu' },
  'thiruvuru': { mandal: 'Tiruvuru', village: 'Tiruvuru Town' },
  'tiruvur': { mandal: 'Tiruvuru', village: 'Tiruvuru Town' },
  'thiruvur': { mandal: 'Tiruvuru', village: 'Tiruvuru Town' },
  'gudiwada': { mandal: 'Gudivada', village: 'Gudivada Town' },
  'goodivada': { mandal: 'Gudivada', village: 'Gudivada Town' },
  'bandar': { mandal: 'Machilipatnam', village: 'Machilipatnam Town' },
  'mtm': { mandal: 'Machilipatnam', village: 'Machilipatnam Town' },
  'chilakalapudi': { mandal: 'Machilipatnam', village: 'Chilakalapudi' },
  'peddana': { mandal: 'Pedana', village: 'Pedana Town' },
  'avanigada': { mandal: 'Avanigadda', village: 'Avanigadda Town' },
  'banthumilli': { mandal: 'Bantumilli', village: 'Bantumilli' },
  'challapalle': { mandal: 'Challapalli', village: 'Challapalli' },
  'pammaru': { mandal: 'Pamarru', village: 'Pamarru' },
  'vuyyur': { mandal: 'Vuyyuru', village: 'Vuyyuru Town' },
  'vuyuru': { mandal: 'Vuyyuru', village: 'Vuyyuru Town' },
  'gannavaram': { mandal: 'Gannavaram', village: 'Gannavaram' },
  'gannavaramairport': { mandal: 'Gannavaram', village: 'Gannavaram' },
  'ungutur': { mandal: 'Unguturu', village: 'Unguturu' },
  'musunur': { mandal: 'Musunur', village: 'Musunuru' },
  'nuzvid': { mandal: 'Nuzvidu', village: 'Nuzvidu Town' },
  'noozvid': { mandal: 'Nuzvidu', village: 'Nuzvidu Town' },
  'noozvidu': { mandal: 'Nuzvidu', village: 'Nuzvidu Town' },
  'agiripalli': { mandal: 'Agiripalle', village: 'Agiripalle' },
  'aagiripalli': { mandal: 'Agiripalle', village: 'Agiripalle' },
  'chattroy': { mandal: 'Chatrai', village: 'Chatrai' },
  'chatrayi': { mandal: 'Chatrai', village: 'Chatrai' },
  'reddigudem': { mandal: 'Reddygudem', village: 'Reddygudem' },
  'nandigam': { mandal: 'Nandigama', village: 'Nandigama Town' },
  'kondapalli': { mandal: 'Ibrahimpatnam', village: 'Kondapalli' },
  'ibpatnam': { mandal: 'Ibrahimpatnam', village: 'Ibrahimpatnam' },
  'vatsavay': { mandal: 'Vatsavai', village: 'Vatsavai' },
  'vatsavayi': { mandal: 'Vatsavai', village: 'Vatsavai' },
  'veerulapadu': { mandal: 'Veerullapadu', village: 'Veerullapadu' },
  // Common Village Typo Aliases
  'ganiathkur': { village: 'Gani Atkur', mandal: 'Tiruvuru' },
  'ganiatkur': { village: 'Gani Atkur', mandal: 'Tiruvuru' },
  'chinthlapadu': { village: 'Chintalapadu', mandal: 'Tiruvuru' },
  'chintalapad': { village: 'Chintalapadu', mandal: 'Tiruvuru' },
  'chinthala padu': { village: 'Chintalapadu', mandal: 'Tiruvuru' },
  'chintalapadu': { village: 'Chintalapadu', mandal: 'Tiruvuru' },
  'pathathiruvuru': { village: 'Patha Tiruvuru', mandal: 'Tiruvuru' },
  'peddakorukondi': { village: 'Peddakorukondi', mandal: 'Tiruvuru' },
  'chinnakorukondi': { village: 'Chinnakorukondi', mandal: 'Tiruvuru' },
  'rajupet': { village: 'Raju Peta', mandal: 'Tiruvuru' },
  'rajupeta': { village: 'Raju Peta', mandal: 'Tiruvuru' },
  'cheemalapadu': { village: 'Cheemalapadu', mandal: 'A.Konduru' },
  'kambampadu': { village: 'Kambampadu', mandal: 'A.Konduru' },
  'kummarigudem': { village: 'Kummarigudem', mandal: 'A.Konduru' },
  'madhavaram': { village: 'Madhavaram', mandal: 'A.Konduru' },
  'reepudi': { village: 'Repudi', mandal: 'A.Konduru' },
  'raypudi': { village: 'Repudi', mandal: 'A.Konduru' },
  'vallampatla': { village: 'Vallampatla', mandal: 'A.Konduru' },
  'anigandlapadu': { village: 'Anigandlapadu', mandal: 'Penuganchiprolu' },
  'agpadu': { village: 'Anigandlapadu', mandal: 'Penuganchiprolu' },
  'kethaveerunipadu': { village: 'Kethaveeruni Padu', mandal: 'Nandigama' },
  'kvpadu': { village: 'Kethaveeruni Padu', mandal: 'Nandigama' },
  'pallagiri': { village: 'Pallagiri', mandal: 'Nandigama' },
  'kondapalliqtr': { village: 'Kondapalli', mandal: 'Ibrahimpatnam' },
  'kanumolu': { village: 'Kanumolu', mandal: 'Bapulapadu' },
  'ventrapragada': { village: 'Ventrapragada', mandal: 'Pedaparupudi' },
  'dosapadu': { village: 'Dosapadu', mandal: 'Unguturu' }
};

// Levenshtein edit distance
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

// Similarity ratio (0.0 to 1.0)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  const len = Math.max(str1.length, str2.length);
  if (len === 0) return 1.0;
  const dist = editDistance(str1, str2);
  return (len - dist) / len;
}

// Build pre-indexed village directory
class MasterGeoDirectory {
  private entries: CanonicalVillageEntry[] = [];
  private byExactVillage: Map<string, CanonicalVillageEntry[]> = new Map();
  private byExactMandal: Map<string, CanonicalVillageEntry[]> = new Map();
  private byPhoneticVillage: Map<string, CanonicalVillageEntry[]> = new Map();
  private mandalList: string[] = [];

  constructor() {
    this.buildIndex();
  }

  private buildIndex() {
    const mandalSet = new Set<string>();

    (['4731', '4732'] as const).forEach(code => {
      const hub = DEALERSHIP_DATA[code];
      hub.branches.forEach(branch => {
        branch.mandals.forEach(mandal => {
          mandalSet.add(mandal.name);
          const normMandal = cleanGeoToken(mandal.name);

          mandal.villages.forEach(v => {
            const normVillage = cleanGeoToken(v.name);
            const phonVillage = toPhoneticKey(v.name);

            const entry: CanonicalVillageEntry = {
              villageName: v.name,
              teluguVillageName: v.teluguName,
              mandalName: mandal.name,
              teluguMandalName: mandal.teluguName,
              branchName: branch.name,
              dealershipCode: code,
              distanceKm: v.distanceKm,
              approxTravelTime: v.approxTravelTime || '20 min',
              normalizedVillage: normVillage,
              phoneticVillage: phonVillage,
              normalizedMandal: normMandal
            };

            this.entries.push(entry);

            // Index by normalized village
            if (!this.byExactVillage.has(normVillage)) {
              this.byExactVillage.set(normVillage, []);
            }
            this.byExactVillage.get(normVillage)!.push(entry);

            // Index by phonetic
            if (!this.byPhoneticVillage.has(phonVillage)) {
              this.byPhoneticVillage.set(phonVillage, []);
            }
            this.byPhoneticVillage.get(phonVillage)!.push(entry);

            // Index by mandal
            if (!this.byExactMandal.has(normMandal)) {
              this.byExactMandal.set(normMandal, []);
            }
            this.byExactMandal.get(normMandal)!.push(entry);
          });
        });
      });
    });

    this.mandalList = Array.from(mandalSet);
  }

  public getAllEntries(): CanonicalVillageEntry[] {
    return this.entries;
  }

  public getMandals(): string[] {
    return this.mandalList;
  }

  // Tokenize an address string into candidate village keywords
  private extractCandidateTokens(addr: string): string[] {
    if (!addr) return [];
    const rawTokens = addr
      .toLowerCase()
      .replace(/[,/\\()\-._#]/g, ' ')
      .split(/\s+/)
      .map(t => cleanGeoToken(t))
      .filter(t => t.length >= 3 && !NOISE_WORDS.has(t));

    const candidates: string[] = [];
    // Single tokens
    candidates.push(...rawTokens);

    // Adjacent pairs (e.g., "Gani Atkur", "Raju Peta", "A Konduru", "G Konduru")
    for (let i = 0; i < rawTokens.length - 1; i++) {
      candidates.push(rawTokens[i] + rawTokens[i + 1]);
    }

    return Array.from(new Set(candidates));
  }

  /**
   * Smart Resolve customer's entered village & mandal with strict Mandal-first hierarchy.
   * If customer provides a Mandal (rawMandal), customer will ALWAYS remain strictly within that Mandal!
   */
  public matchLocation(
    rawVillage?: string,
    rawMandal?: string,
    rawAddress?: string
  ): GeoMatchResult {
    const origV = String(rawVillage || '').trim();
    const origM = String(rawMandal || '').trim();
    const origAddr = String(rawAddress || '').trim();

    const cleanV = cleanGeoToken(origV);
    const cleanM = cleanGeoToken(origM);
    const stemV = stripSuffixNoise(origV);
    const phonV = toPhoneticKey(stemV || origV);
    const phonM = toPhoneticKey(origM);

    // =========================================================================
    // STEP 1: MANDAL-FIRST RESOLUTION (When rawMandal is provided)
    // =========================================================================
    if (cleanM) {
      // Find matching mandal in master directory
      let canonicalMandalEntries: CanonicalVillageEntry[] | undefined = this.byExactMandal.get(cleanM);

      // Check alias map for mandal
      if (!canonicalMandalEntries && ALIAS_MAP[cleanM]?.mandal) {
        const aliasMandal = cleanGeoToken(ALIAS_MAP[cleanM].mandal);
        canonicalMandalEntries = this.byExactMandal.get(aliasMandal);
      }

      // Check phonetic / fuzzy match on mandal name
      if (!canonicalMandalEntries) {
        for (const [normM, entries] of this.byExactMandal.entries()) {
          if (normM.includes(cleanM) || cleanM.includes(normM) || (phonM && toPhoneticKey(normM) === phonM)) {
            canonicalMandalEntries = entries;
            break;
          }
        }
      }

      // If Mandal is recognized in Dealership master directory:
      if (canonicalMandalEntries && canonicalMandalEntries.length > 0) {
        const sampleMandal = canonicalMandalEntries[0];
        const mName = sampleMandal.mandalName;
        const mTelugu = sampleMandal.teluguMandalName;
        const bName = sampleMandal.branchName;
        const dCode = sampleMandal.dealershipCode;

        // Search for village WITHIN this specific mandal's village entries
        // 1. Exact match within this mandal
        const exactMatch = canonicalMandalEntries.find(
          e => e.normalizedVillage === cleanV || e.normalizedVillage === stemV
        );
        if (exactMatch) {
          return {
            matched: true,
            villageName: exactMatch.villageName,
            teluguVillageName: exactMatch.teluguVillageName,
            mandalName: mName,
            teluguMandalName: mTelugu,
            branchName: bName,
            dealershipCode: dCode,
            distanceKm: exactMatch.distanceKm,
            approxTravelTime: exactMatch.approxTravelTime,
            confidence: 1.0,
            matchType: 'exact',
            originalVillage: origV,
            originalMandal: origM
          };
        }

        // 2. Alias match within this mandal
        const aliasTarget = ALIAS_MAP[cleanV]?.village || ALIAS_MAP[stemV]?.village;
        if (aliasTarget) {
          const aliasMatch = canonicalMandalEntries.find(
            e => cleanGeoToken(e.villageName) === cleanGeoToken(aliasTarget)
          );
          if (aliasMatch) {
            return {
              matched: true,
              villageName: aliasMatch.villageName,
              teluguVillageName: aliasMatch.teluguVillageName,
              mandalName: mName,
              teluguMandalName: mTelugu,
              branchName: bName,
              dealershipCode: dCode,
              distanceKm: aliasMatch.distanceKm,
              approxTravelTime: aliasMatch.approxTravelTime,
              confidence: 0.98,
              matchType: 'alias',
              originalVillage: origV,
              originalMandal: origM
            };
          }
        }

        // 3. Phonetic match within this mandal
        if (phonV) {
          const phonMatch = canonicalMandalEntries.find(e => e.phoneticVillage === phonV);
          if (phonMatch) {
            return {
              matched: true,
              villageName: phonMatch.villageName,
              teluguVillageName: phonMatch.teluguVillageName,
              mandalName: mName,
              teluguMandalName: mTelugu,
              branchName: bName,
              dealershipCode: dCode,
              distanceKm: phonMatch.distanceKm,
              approxTravelTime: phonMatch.approxTravelTime,
              confidence: 0.92,
              matchType: 'exact',
              originalVillage: origV,
              originalMandal: origM
            };
          }
        }

        // 4. Token scan within this mandal from village or address
        const villageTokens = this.extractCandidateTokens(origV);
        const addressTokens = this.extractCandidateTokens(origAddr);
        const allTokens = [...villageTokens, ...addressTokens];
        for (const token of allTokens) {
          const tokenMatch = canonicalMandalEntries.find(
            e => e.normalizedVillage === token || e.phoneticVillage === toPhoneticKey(token)
          );
          if (tokenMatch) {
            return {
              matched: true,
              villageName: tokenMatch.villageName,
              teluguVillageName: tokenMatch.teluguVillageName,
              mandalName: mName,
              teluguMandalName: mTelugu,
              branchName: bName,
              dealershipCode: dCode,
              distanceKm: tokenMatch.distanceKm,
              approxTravelTime: tokenMatch.approxTravelTime,
              confidence: 0.88,
              matchType: 'address_token',
              originalVillage: origV,
              originalMandal: origM
            };
          }
        }

        // 5. Fuzzy match within this mandal
        let bestMandalEntry: CanonicalVillageEntry | null = null;
        let bestMandalScore = 0;
        const targetV = cleanV || cleanGeoToken(villageTokens[0] || addressTokens[0] || '');
        if (targetV.length >= 3) {
          for (const entry of canonicalMandalEntries) {
            let score = calculateSimilarity(targetV, entry.normalizedVillage);
            if (phonV) {
              const phonScore = calculateSimilarity(phonV, entry.phoneticVillage);
              score = Math.max(score, phonScore * 0.95);
            }
            if (score > bestMandalScore) {
              bestMandalScore = score;
              bestMandalEntry = entry;
            }
          }
        }

        if (bestMandalEntry && bestMandalScore >= 0.70) {
          return {
            matched: true,
            villageName: bestMandalEntry.villageName,
            teluguVillageName: bestMandalEntry.teluguVillageName,
            mandalName: mName,
            teluguMandalName: mTelugu,
            branchName: bName,
            dealershipCode: dCode,
            distanceKm: bestMandalEntry.distanceKm,
            approxTravelTime: bestMandalEntry.approxTravelTime,
            confidence: bestMandalScore,
            matchType: 'fuzzy',
            originalVillage: origV,
            originalMandal: origM
          };
        }

        // 6. Village not in pre-defined list for this mandal: STRICTLY KEEP IN THIS MANDAL
        return {
          matched: true,
          villageName: origV || `${mName} Rural`,
          teluguVillageName: undefined,
          mandalName: mName,
          teluguMandalName: mTelugu,
          branchName: bName,
          dealershipCode: dCode,
          distanceKm: sampleMandal.distanceKm || 12,
          approxTravelTime: sampleMandal.approxTravelTime || '20 min',
          confidence: 0.85,
          matchType: 'exact',
          originalVillage: origV,
          originalMandal: origM
        };
      }
    }

    // =========================================================================
    // STEP 2: GLOBAL SEARCH (When rawMandal is empty or not provided)
    // =========================================================================
    const checkAlias = (val: string) => {
      if (!val) return null;
      const alias = ALIAS_MAP[val];
      if (!alias) return null;
      return this.entries.find(
        e =>
          (!alias.village || cleanGeoToken(e.villageName) === cleanGeoToken(alias.village)) &&
          (!alias.mandal || cleanGeoToken(e.mandalName) === cleanGeoToken(alias.mandal))
      );
    };

    // 2.1 Alias Map Check
    const aliasMatch = checkAlias(cleanV) || checkAlias(stemV);
    if (aliasMatch) {
      return {
        matched: true,
        villageName: aliasMatch.villageName,
        teluguVillageName: aliasMatch.teluguVillageName,
        mandalName: aliasMatch.mandalName,
        teluguMandalName: aliasMatch.teluguMandalName,
        branchName: aliasMatch.branchName,
        dealershipCode: aliasMatch.dealershipCode,
        distanceKm: aliasMatch.distanceKm,
        approxTravelTime: aliasMatch.approxTravelTime,
        confidence: 0.98,
        matchType: 'alias',
        originalVillage: origV,
        originalMandal: origM
      };
    }

    // 2.2 Exact match on village across all mandals
    const exactLookup = (k: string) => this.byExactVillage.get(k);
    const exactCandidates = exactLookup(cleanV) || exactLookup(stemV);
    if (exactCandidates && exactCandidates.length > 0) {
      const best = exactCandidates[0];
      return {
        matched: true,
        villageName: best.villageName,
        teluguVillageName: best.teluguVillageName,
        mandalName: best.mandalName,
        teluguMandalName: best.teluguMandalName,
        branchName: best.branchName,
        dealershipCode: best.dealershipCode,
        distanceKm: best.distanceKm,
        approxTravelTime: best.approxTravelTime,
        confidence: 1.0,
        matchType: 'exact',
        originalVillage: origV,
        originalMandal: origM
      };
    }

    // 2.3 Phonetic match on village
    if (phonV && this.byPhoneticVillage.has(phonV)) {
      const best = this.byPhoneticVillage.get(phonV)![0];
      return {
        matched: true,
        villageName: best.villageName,
        teluguVillageName: best.teluguVillageName,
        mandalName: best.mandalName,
        teluguMandalName: best.teluguMandalName,
        branchName: best.branchName,
        dealershipCode: best.dealershipCode,
        distanceKm: best.distanceKm,
        approxTravelTime: best.approxTravelTime,
        confidence: 0.92,
        matchType: 'exact',
        originalVillage: origV,
        originalMandal: origM
      };
    }

    // 2.4 Village tokens
    const villageTokens = this.extractCandidateTokens(origV);
    for (const token of villageTokens) {
      const aliasM = checkAlias(token);
      if (aliasM) {
        return {
          matched: true,
          villageName: aliasM.villageName,
          teluguVillageName: aliasM.teluguVillageName,
          mandalName: aliasM.mandalName,
          teluguMandalName: aliasM.teluguMandalName,
          branchName: aliasM.branchName,
          dealershipCode: aliasM.dealershipCode,
          distanceKm: aliasM.distanceKm,
          approxTravelTime: aliasM.approxTravelTime,
          confidence: 0.95,
          matchType: 'alias',
          originalVillage: origV,
          originalMandal: origM
        };
      }
      if (this.byExactVillage.has(token)) {
        const best = this.byExactVillage.get(token)![0];
        return {
          matched: true,
          villageName: best.villageName,
          teluguVillageName: best.teluguVillageName,
          mandalName: best.mandalName,
          teluguMandalName: best.teluguMandalName,
          branchName: best.branchName,
          dealershipCode: best.dealershipCode,
          distanceKm: best.distanceKm,
          approxTravelTime: best.approxTravelTime,
          confidence: 0.90,
          matchType: 'address_token',
          originalVillage: origV,
          originalMandal: origM
        };
      }
    }

    // 2.5 Address Tokens
    const addressTokens = this.extractCandidateTokens(origAddr);
    for (const token of addressTokens) {
      if (this.byExactVillage.has(token)) {
        const best = this.byExactVillage.get(token)![0];
        return {
          matched: true,
          villageName: best.villageName,
          teluguVillageName: best.teluguVillageName,
          mandalName: best.mandalName,
          teluguMandalName: best.teluguMandalName,
          branchName: best.branchName,
          dealershipCode: best.dealershipCode,
          distanceKm: best.distanceKm,
          approxTravelTime: best.approxTravelTime,
          confidence: 0.82,
          matchType: 'address_token',
          originalVillage: origV,
          originalMandal: origM
        };
      }
    }

    // 2.6 Fuzzy search
    let bestScore = 0;
    let bestEntry: CanonicalVillageEntry | null = null;
    const targetV = cleanV || cleanGeoToken(villageTokens[0] || addressTokens[0] || '');
    if (targetV.length >= 4) {
      for (const entry of this.entries) {
        let score = calculateSimilarity(targetV, entry.normalizedVillage);
        if (score > bestScore) {
          bestScore = score;
          bestEntry = entry;
        }
      }
    }

    if (bestEntry && bestScore >= 0.72) {
      return {
        matched: true,
        villageName: bestEntry.villageName,
        teluguVillageName: bestEntry.teluguVillageName,
        mandalName: bestEntry.mandalName,
        teluguMandalName: bestEntry.teluguMandalName,
        branchName: bestEntry.branchName,
        dealershipCode: bestEntry.dealershipCode,
        distanceKm: bestEntry.distanceKm,
        approxTravelTime: bestEntry.approxTravelTime,
        confidence: Math.min(bestScore, 0.95),
        matchType: 'fuzzy',
        originalVillage: origV,
        originalMandal: origM
      };
    }

    // 2.7 Fallback: return as-is so no data is ever dropped
    return {
      matched: false,
      villageName: origV || 'Unknown Village',
      mandalName: origM || 'General',
      branchName: 'Tiruvuru',
      dealershipCode: '4731',
      distanceKm: 0,
      approxTravelTime: '—',
      confidence: 0.1,
      matchType: 'fallback',
      originalVillage: origV,
      originalMandal: origM
    };
  }
}

// Global Singleton
export const masterGeoDirectory = new MasterGeoDirectory();
