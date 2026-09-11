// Comprehensive Geographic Data, Coordinates, and Distance Matrix for Krishna & NTR Districts

export interface GeoLocation {
  id: string;
  name: string;
  teluguName: string;
  type: 'branch' | 'mandal' | 'town' | 'village';
  dealershipCode?: '4731' | '4732';
  branchId?: string;
  mandalName?: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  isBranch?: boolean;
}

// 1. All Eicher Dealership Branches with Precise GPS Coordinates
export const BRANCH_LOCATIONS: GeoLocation[] = [
  {
    id: 'gudiwada',
    name: 'Gudivada (4732 HQ)',
    teluguName: 'గుడివాడ (4732 ప్రధాన కేంద్రం)',
    type: 'branch',
    dealershipCode: '4732',
    lat: 16.441,
    lng: 80.9926,
    address: 'Eluru Road / Bypass Junction, Gudivada, Krishna Dist',
    phone: '9848045678',
    isBranch: true
  },
  {
    id: 'machilipatnam_21',
    name: 'Machilipatnam (21 Branch)',
    teluguName: 'మచిలీపట్నం (21 బ్రాంచ్)',
    type: 'branch',
    dealershipCode: '4732',
    lat: 16.1875,
    lng: 81.1389,
    address: 'Bypass Highway / Chilakalapudi, Machilipatnam, Krishna Dist',
    phone: '9848067890',
    isBranch: true
  },
  {
    id: 'poranki_vijayawada',
    name: 'Poranki - Vijayawada Branch',
    teluguName: 'పోరంకి - విజయవాడ బ్రాంచ్',
    type: 'branch',
    dealershipCode: '4732',
    lat: 16.4862,
    lng: 80.7047,
    address: 'Bandar Road / Auto Nagar / Poranki Main Road, Vijayawada',
    phone: '9848056789',
    isBranch: true
  },
  {
    id: 'vuyyuru',
    name: 'Vuyyuru Service Point',
    teluguName: 'వుయ్యూరు సర్వీస్ పాయింట్',
    type: 'branch',
    dealershipCode: '4732',
    lat: 16.3683,
    lng: 80.8447,
    address: 'Main Road / Sugar Factory Road, Vuyyuru, Krishna Dist',
    phone: '9848078901',
    isBranch: true
  },
  {
    id: 'avanigadda',
    name: 'Avanigadda Branch',
    teluguName: 'అవనిగడ్డ బ్రాంచ్',
    type: 'branch',
    dealershipCode: '4732',
    lat: 16.0211,
    lng: 80.9189,
    address: 'Main Road, Near Bus Stand, Avanigadda, Krishna Dist',
    phone: '9848089012',
    isBranch: true
  },
  {
    id: 'nandigama',
    name: 'Nandigama (4731 HQ)',
    teluguName: 'నందిగామ (4731 ప్రధాన కేంద్రం)',
    type: 'branch',
    dealershipCode: '4731',
    lat: 16.7844,
    lng: 80.2974,
    address: 'Hyderabad Highway NH65, Nandigama, NTR/Krishna Dist',
    phone: '9848034567',
    isBranch: true
  },
  {
    id: 'nuzvidu',
    name: 'Nuzvidu Branch',
    teluguName: 'నూజివీడు బ్రాంచ్',
    type: 'branch',
    dealershipCode: '4731',
    lat: 16.785,
    lng: 80.8464,
    address: 'Bypass Road / Mylavaram Road Junction, Nuzvidu',
    phone: '9848023456',
    isBranch: true
  },
  {
    id: 'tiruvuru',
    name: 'Tiruvuru Branch',
    teluguName: 'తిరువూరు బ్రాంచ్',
    type: 'branch',
    dealershipCode: '4731',
    lat: 17.1128,
    lng: 80.6122,
    address: 'Main Road, Near Bus Stand / Bypass, Tiruvuru',
    phone: '9848012345',
    isBranch: true
  },
  {
    id: 'jaggayyapeta',
    name: 'Jaggayyapeta Point',
    teluguName: 'జగ్గయ్యపేట పాయింట్',
    type: 'branch',
    dealershipCode: '4731',
    lat: 16.8928,
    lng: 80.0978,
    address: 'NH65 Bypass, Jaggayyapeta, NTR Dist',
    phone: '9848090123',
    isBranch: true
  }
];

// 2. Key Mandal Headquarters and Towns in Krishna & NTR Districts with Coordinates
export const MANDAL_LOCATIONS: GeoLocation[] = [
  // Krishna District Mandals (4732 Region)
  { id: 'm_gudivada', name: 'Gudivada', teluguName: 'గుడివాడ', type: 'mandal', lat: 16.441, lng: 80.9926 },
  { id: 'm_gudlavalleru', name: 'Gudlavalleru', teluguName: 'గుడ్లవల్లేరు', type: 'mandal', lat: 16.3475, lng: 81.0483 },
  { id: 'm_nandivada', name: 'Nandivada', teluguName: 'నందివాడ', type: 'mandal', lat: 16.4892, lng: 80.9789 },
  { id: 'm_mudinepalli', name: 'Mudinepalli', teluguName: 'ముదినేపల్లి', type: 'mandal', lat: 16.4172, lng: 81.1275 },
  { id: 'm_pamarru', name: 'Pamarru', teluguName: 'పామర్రు', type: 'mandal', lat: 16.3267, lng: 80.9633 },
  { id: 'm_pedaparupudi', name: 'Pedaparupudi', teluguName: 'పెదపారుపూడి', type: 'mandal', lat: 16.4483, lng: 80.8933 },
  { id: 'm_vuyyuru', name: 'Vuyyuru', teluguName: 'వుయ్యూరు', type: 'mandal', lat: 16.3683, lng: 80.8447 },
  { id: 'm_thotlavalluru', name: 'Thotlavalluru', teluguName: 'తోట్లవల్లూరు', type: 'mandal', lat: 16.3128, lng: 80.7911 },
  { id: 'm_penamaluru', name: 'Penamaluru / Poranki', teluguName: 'పెనమలూరు / పోరంకి', type: 'mandal', lat: 16.4862, lng: 80.7047 },
  { id: 'm_vijayawada_rural', name: 'Vijayawada Rural', teluguName: 'విజయవాడ రూరల్', type: 'mandal', lat: 16.5186, lng: 80.648 },
  { id: 'm_gannavaram', name: 'Gannavaram', teluguName: 'గన్నవరం', type: 'mandal', lat: 16.5414, lng: 80.8033 },
  { id: 'm_kankipadu', name: 'Kankipadu', teluguName: 'కంకిపాడు', type: 'mandal', lat: 16.425, lng: 80.7722 },
  { id: 'm_machilipatnam', name: 'Machilipatnam', teluguName: 'మచిలీపట్నం', type: 'mandal', lat: 16.1875, lng: 81.1389 },
  { id: 'm_pedana', name: 'Pedana', teluguName: 'పెడన', type: 'mandal', lat: 16.2625, lng: 81.1444 },
  { id: 'm_bantumilli', name: 'Bantumilli', teluguName: 'బంటుమిల్లి', type: 'mandal', lat: 16.3667, lng: 81.2667 },
  { id: 'm_kruthivennu', name: 'Kruthivennu', teluguName: 'కృతివెన్ను', type: 'mandal', lat: 16.3028, lng: 81.3833 },
  { id: 'm_movva', name: 'Movva', teluguName: 'మొవ్వ', type: 'mandal', lat: 16.2306, lng: 80.9139 },
  { id: 'm_ghantasala', name: 'Ghantasala', teluguName: 'ఘంటసాల', type: 'mandal', lat: 16.1486, lng: 80.9389 },
  { id: 'm_challapalli', name: 'Challapalli', teluguName: 'చల్లపల్లి', type: 'mandal', lat: 16.1139, lng: 80.9333 },
  { id: 'm_avanigadda', name: 'Avanigadda', teluguName: 'అవనిగడ్డ', type: 'mandal', lat: 16.0211, lng: 80.9189 },
  { id: 'm_nagayalanka', name: 'Nagayalanka', teluguName: 'నాగాయలంక', type: 'mandal', lat: 15.9486, lng: 80.9167 },
  { id: 'm_koduru', name: 'Koduru', teluguName: 'కోడూరు', type: 'mandal', lat: 15.9333, lng: 80.8833 },
  { id: 'm_kaikaluru', name: 'Kaikaluru', teluguName: 'కైకలూరు', type: 'mandal', lat: 16.5583, lng: 81.2056 },
  { id: 'm_mandavalli', name: 'Mandavalli', teluguName: 'మండవల్లి', type: 'mandal', lat: 16.5167, lng: 81.15 },

  // NTR / North Krishna District Mandals (4731 Region)
  { id: 'm_nandigama', name: 'Nandigama', teluguName: 'నందిగామ', type: 'mandal', lat: 16.7844, lng: 80.2974 },
  { id: 'm_kanchikacherla', name: 'Kanchikacherla', teluguName: 'కంచికచర్ల', type: 'mandal', lat: 16.685, lng: 80.3958 },
  { id: 'm_ibrahimpatnam', name: 'Ibrahimpatnam', teluguName: 'ఇబ్రహీంపట్నం', type: 'mandal', lat: 16.5892, lng: 80.5283 },
  { id: 'm_kondapalli', name: 'Kondapalli', teluguName: 'కొండపల్లి', type: 'mandal', lat: 16.6192, lng: 80.5408 },
  { id: 'm_jaggayyapeta', name: 'Jaggayyapeta', teluguName: 'జగ్గయ్యపేట', type: 'mandal', lat: 16.8928, lng: 80.0978 },
  { id: 'm_penuganchiprolu', name: 'Penuganchiprolu', teluguName: 'పెనుగంచిప్రోలు', type: 'mandal', lat: 16.9181, lng: 80.2458 },
  { id: 'm_vatsavai', name: 'Vatsavai', teluguName: 'వత్సవాయి', type: 'mandal', lat: 17.0219, lng: 80.1717 },
  { id: 'm_veerullapadu', name: 'Veerullapadu', teluguName: 'వీరుళ్లపాడు', type: 'mandal', lat: 16.7214, lng: 80.4411 },
  { id: 'm_chandarlapadu', name: 'Chandarlapadu', teluguName: 'చందర్లపాడు', type: 'mandal', lat: 16.7264, lng: 80.1983 },
  { id: 'm_gkonduru', name: 'G.Konduru', teluguName: 'జి.కొండూరు', type: 'mandal', lat: 16.6833, lng: 80.6083 },
  { id: 'm_mylavaram', name: 'Mylavaram', teluguName: 'మైలవరం', type: 'mandal', lat: 16.7725, lng: 80.6389 },
  { id: 'm_nuzvidu', name: 'Nuzvidu', teluguName: 'నూజివీడు', type: 'mandal', lat: 16.785, lng: 80.8464 },
  { id: 'm_agiripalli', name: 'Agiripalli', teluguName: 'అగిరిపల్లి', type: 'mandal', lat: 16.6667, lng: 80.8167 },
  { id: 'm_chatrai', name: 'Chatrai', teluguName: 'చాత్రాయి', type: 'mandal', lat: 16.9583, lng: 80.8833 },
  { id: 'm_musunuru', name: 'Musunuru', teluguName: 'ముసునూరు', type: 'mandal', lat: 16.8333, lng: 80.9667 },
  { id: 'm_reddygudem', name: 'Reddygudem', teluguName: 'రెడ్డిగూడెం', type: 'mandal', lat: 16.85, lng: 80.6833 },
  { id: 'm_tiruvuru', name: 'Tiruvuru', teluguName: 'తిరువూరు', type: 'mandal', lat: 17.1128, lng: 80.6122 },
  { id: 'm_akonduru', name: 'A.Konduru', teluguName: 'ఎ.కొండూరు', type: 'mandal', lat: 17.0667, lng: 80.5333 },
  { id: 'm_gampalagudem', name: 'Gampalagudem', teluguName: 'గంపలగూడెం', type: 'mandal', lat: 17.0083, lng: 80.4833 },
  { id: 'm_vissannapeta', name: 'Vissannapeta', teluguName: 'విస్సన్నపేట', type: 'mandal', lat: 16.95, lng: 80.7333 }
];

// Fixed Branch-to-Branch Distance Matrix (Road Distance in Km)
export const BRANCH_DISTANCE_MATRIX: Record<string, Record<string, number>> = {
  gudiwada: {
    gudiwada: 0,
    machilipatnam_21: 36,
    poranki_vijayawada: 42,
    vuyyuru: 28,
    avanigadda: 58,
    nandigama: 95,
    nuzvidu: 46,
    tiruvuru: 88,
    jaggayyapeta: 125
  },
  machilipatnam_21: {
    gudiwada: 36,
    machilipatnam_21: 0,
    poranki_vijayawada: 68,
    vuyyuru: 54,
    avanigadda: 42,
    nandigama: 122,
    nuzvidu: 82,
    tiruvuru: 118,
    jaggayyapeta: 152
  },
  poranki_vijayawada: {
    gudiwada: 42,
    machilipatnam_21: 68,
    poranki_vijayawada: 0,
    vuyyuru: 18,
    avanigadda: 62,
    nandigama: 55,
    nuzvidu: 45,
    tiruvuru: 82,
    jaggayyapeta: 84
  },
  vuyyuru: {
    gudiwada: 28,
    machilipatnam_21: 54,
    poranki_vijayawada: 18,
    vuyyuru: 0,
    avanigadda: 48,
    nandigama: 72,
    nuzvidu: 58,
    tiruvuru: 96,
    jaggayyapeta: 102
  },
  avanigadda: {
    gudiwada: 58,
    machilipatnam_21: 42,
    poranki_vijayawada: 62,
    vuyyuru: 48,
    avanigadda: 0,
    nandigama: 115,
    nuzvidu: 102,
    tiruvuru: 140,
    jaggayyapeta: 146
  },
  nandigama: {
    gudiwada: 95,
    machilipatnam_21: 122,
    poranki_vijayawada: 55,
    vuyyuru: 72,
    avanigadda: 115,
    nandigama: 0,
    nuzvidu: 75,
    tiruvuru: 65,
    jaggayyapeta: 32
  },
  nuzvidu: {
    gudiwada: 46,
    machilipatnam_21: 82,
    poranki_vijayawada: 45,
    vuyyuru: 58,
    avanigadda: 102,
    nandigama: 75,
    nuzvidu: 0,
    tiruvuru: 48,
    jaggayyapeta: 104
  },
  tiruvuru: {
    gudiwada: 88,
    machilipatnam_21: 118,
    poranki_vijayawada: 82,
    vuyyuru: 96,
    avanigadda: 140,
    nandigama: 65,
    nuzvidu: 48,
    tiruvuru: 0,
    jaggayyapeta: 80
  },
  jaggayyapeta: {
    gudiwada: 125,
    machilipatnam_21: 152,
    poranki_vijayawada: 84,
    vuyyuru: 102,
    avanigadda: 146,
    nandigama: 32,
    nuzvidu: 104,
    tiruvuru: 80,
    jaggayyapeta: 0
  }
};

// Haversine formula to compute great-circle distance between two GPS coordinates
export function calculateCrowDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert straight-line distance to estimated Andhra Pradesh road distance
// Applying curvature factor ~1.28x for highway/rural road routes
export function calculateEstimatedRoadDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const straightLine = calculateCrowDistanceKm(lat1, lon1, lat2, lon2);
  if (straightLine < 0.5) return 0;
  // Road factor between 1.22 and 1.32 depending on distance
  const factor = straightLine < 15 ? 1.32 : straightLine < 40 ? 1.28 : 1.24;
  return Math.round(straightLine * factor * 10) / 10;
}

// Format travel time given distance in km and average speed in km/h
export function calculateTravelTime(distanceKm: number, speedKmH: number): string {
  if (distanceKm <= 0) return '0 min';
  const totalMinutes = Math.round((distanceKm / speedKmH) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

// Estimate fuel cost in INR
export function estimateFuelCost(distanceKm: number, mileageKmPerLiter: number, fuelPricePerLiter = 98): { liters: number; costInr: number } {
  if (distanceKm <= 0) return { liters: 0, costInr: 0 };
  const liters = Math.round((distanceKm / mileageKmPerLiter) * 10) / 10;
  const costInr = Math.round(liters * fuelPricePerLiter);
  return { liters, costInr };
}

export interface VehicleTripEstimate {
  vehicleKey: 'van' | 'bike' | 'tractor' | 'car';
  labelEn: string;
  labelTe: string;
  fuelTypeEn: string;
  fuelTypeTe: string;
  mileageKmpl: number;
  ratePerLiter: number;
  liters: number;
  costInr: number;
  travelTime: string;
  speedKmH: number;
  notesEn: string;
  notesTe: string;
}

export function getAllVehicleTripEstimates(distanceKm: number): Record<'van' | 'bike' | 'tractor' | 'car', VehicleTripEstimate> {
  const vanFuel = estimateFuelCost(distanceKm, 12, 98);
  const bikeFuel = estimateFuelCost(distanceKm, 48, 108);
  const tractorFuel = estimateFuelCost(distanceKm, 6, 98);
  const carFuel = estimateFuelCost(distanceKm, 16, 98);

  return {
    van: {
      vehicleKey: 'van',
      labelEn: 'Mobile Service Van',
      labelTe: 'సర్వీస్ వ్యాన్ (Mobile Van)',
      fuelTypeEn: 'Diesel',
      fuelTypeTe: 'డీజిల్',
      mileageKmpl: 12,
      ratePerLiter: 98,
      liters: vanFuel.liters,
      costInr: vanFuel.costInr,
      travelTime: calculateTravelTime(distanceKm, 35),
      speedKmH: 35,
      notesEn: 'Loaded with tools, spares & air compressor (~12 km/L)',
      notesTe: 'టూల్స్, స్పేర్ పార్ట్స్ & కంప్రెషర్ లోడ్ (~12 కి.మీ/లీ)'
    },
    bike: {
      vehicleKey: 'bike',
      labelEn: 'Technician Bike',
      labelTe: 'టెక్నీషియన్ బైక్ (Tech Bike)',
      fuelTypeEn: 'Petrol',
      fuelTypeTe: 'పెట్రోల్',
      mileageKmpl: 48,
      ratePerLiter: 108,
      liters: bikeFuel.liters,
      costInr: bikeFuel.costInr,
      travelTime: calculateTravelTime(distanceKm, 42),
      speedKmH: 42,
      notesEn: 'Field technician emergency visits (~48 km/L)',
      notesTe: 'ఫీల్డ్ టెక్నీషియన్ విజిట్స్ (~48 కి.మీ/లీ)'
    },
    tractor: {
      vehicleKey: 'tractor',
      labelEn: 'Eicher Tractor (Road)',
      labelTe: 'ట్రాక్టర్ (రోడ్డు డ్రైవింగ్)',
      fuelTypeEn: 'Diesel',
      fuelTypeTe: 'డీజిల్',
      mileageKmpl: 6,
      ratePerLiter: 98,
      liters: tractorFuel.liters,
      costInr: tractorFuel.costInr,
      travelTime: calculateTravelTime(distanceKm, 22),
      speedKmH: 22,
      notesEn: 'Tractor road haulage & transit (~6 km/L / 3.5L/hr)',
      notesTe: 'క్యాంప్ లేదా వర్క్‌షాప్‌కి ట్రాక్టర్ రోడ్డు ప్రయాణం (~6 కి.మీ/లీ)'
    },
    car: {
      vehicleKey: 'car',
      labelEn: 'Field Officer Car',
      labelTe: 'ఫీల్డ్ ఆఫీసర్ కారు',
      fuelTypeEn: 'Diesel',
      fuelTypeTe: 'డీజిల్',
      mileageKmpl: 16,
      ratePerLiter: 98,
      liters: carFuel.liters,
      costInr: carFuel.costInr,
      travelTime: calculateTravelTime(distanceKm, 52),
      speedKmH: 52,
      notesEn: 'Dealership manager / sales supervisor car (~16 km/L)',
      notesTe: 'డీలర్‌షిప్ సూపర్వైజర్ / ఆఫీసర్ విజిట్ (~16 కి.మీ/లీ)'
    }
  };
}

