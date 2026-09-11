// Comprehensive Krishna & NTR District Territory & Route Distance Map Explorer
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Route as RouteIcon,
  Compass,
  ArrowRight,
  ArrowUpDown,
  Search,
  ExternalLink,
  Clock,
  Fuel,
  Car,
  Bike,
  Truck,
  Info,
  CheckCircle2,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Building2,
  Share2,
  Copy,
  Plus,
  LocateFixed,
  Map as MapIcon,
  Phone,
  Users
} from 'lucide-react';
import {
  BRANCH_LOCATIONS,
  MANDAL_LOCATIONS,
  BRANCH_DISTANCE_MATRIX,
  calculateEstimatedRoadDistanceKm,
  calculateTravelTime,
  estimateFuelCost,
  getAllVehicleTripEstimates,
  VehicleTripEstimate,
  GeoLocation
} from '../data/districtGeoData';
import { DEALERSHIP_DATA, BranchInfo, MandalInfo, VillageInfo } from '../data/dealershipData';

interface KrishnaDistrictRouteMapProps {
  isTe: boolean;
  onSelectCampVillage?: (villageName: string, mandalName: string, branchName: string, dealershipCode: '4731' | '4732') => void;
}

export const KrishnaDistrictRouteMap: React.FC<KrishnaDistrictRouteMapProps> = ({
  isTe,
  onSelectCampVillage
}) => {
  // All combined searchable locations (Branches + Mandals + All 600+ Villages)
  const allSearchableLocations = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      teluguName: string;
      type: 'branch' | 'mandal' | 'village';
      dealershipCode: '4731' | '4732';
      branchName: string;
      mandalName?: string;
      lat: number;
      lng: number;
      distanceFromBranchKm?: number;
    }> = [];

    // Add Branches
    BRANCH_LOCATIONS.forEach(b => {
      list.push({
        id: b.id,
        name: b.name,
        teluguName: b.teluguName,
        type: 'branch',
        dealershipCode: b.dealershipCode || '4732',
        branchName: b.name,
        lat: b.lat,
        lng: b.lng
      });
    });

    // Add Mandals
    MANDAL_LOCATIONS.forEach(m => {
      // Find matching branch if available
      let branchName = 'Gudivada';
      let dCode: '4731' | '4732' = '4732';
      for (const code of ['4731', '4732'] as const) {
        for (const b of DEALERSHIP_DATA[code].branches) {
          if (b.mandals.some(man => man.name.toLowerCase() === m.name.toLowerCase())) {
            branchName = b.name;
            dCode = code;
            break;
          }
        }
      }

      list.push({
        id: m.id,
        name: `${m.name} (Mandal HQ)`,
        teluguName: `${m.teluguName} (మండల కేంద్రం)`,
        type: 'mandal',
        dealershipCode: dCode,
        branchName: branchName,
        mandalName: m.name,
        lat: m.lat,
        lng: m.lng
      });
    });

    // Add Villages from DEALERSHIP_DATA
    (['4731', '4732'] as const).forEach(code => {
      DEALERSHIP_DATA[code].branches.forEach(branch => {
        // Approximate branch coordinates
        const branchGeo = BRANCH_LOCATIONS.find(b => b.id === branch.id) || {
          lat: code === '4731' ? 16.7844 : 16.441,
          lng: code === '4731' ? 80.2974 : 80.9926
        };

        branch.mandals.forEach(mandal => {
          const mandalGeo = MANDAL_LOCATIONS.find(m => m.name.toLowerCase() === mandal.name.toLowerCase()) || branchGeo;

          mandal.villages.forEach((v, vIdx) => {
            // Estimate village coordinates relative to mandal/branch if exact GPS not stored
            const angle = (vIdx * 37) * (Math.PI / 180);
            const distDeg = (v.distanceKm || 5) / 111; // 1 deg ~ 111 km
            const vLat = (mandalGeo.lat || branchGeo.lat) + (Math.sin(angle) * distDeg * 0.7);
            const vLng = (mandalGeo.lng || branchGeo.lng) + (Math.cos(angle) * distDeg * 0.7);

            list.push({
              id: `v_${branch.id}_${mandal.name}_${v.name}`,
              name: `${v.name}, ${mandal.name}`,
              teluguName: `${v.teluguName || v.name}, ${mandal.teluguName || mandal.name}`,
              type: 'village',
              dealershipCode: code,
              branchName: branch.name,
              mandalName: mandal.name,
              lat: vLat,
              lng: vLng,
              distanceFromBranchKm: v.distanceKm
            });
          });
        });
      });
    });

    return list;
  }, []);

  // Route Planning State: From & To
  const [fromQuery, setFromQuery] = useState<string>('Gudivada (4732 HQ)');
  const [toQuery, setToQuery] = useState<string>('Machilipatnam (21 Branch)');
  const [fromGeo, setFromGeo] = useState<GeoLocation | null>(BRANCH_LOCATIONS[0]); // Default Gudivada
  const [toGeo, setToGeo] = useState<GeoLocation | null>(BRANCH_LOCATIONS[1]); // Default Machilipatnam

  // Autocomplete suggestions
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Map view type: 'visual' (lightweight vector interactive map) | 'google_embed' (embedded Google Maps)
  const [mapMode, setMapMode] = useState<'visual' | 'google_embed'>('visual');

  // Coverage radius circles toggle (10km, 20km, 30km)
  const [showRadiusRings, setShowRadiusRings] = useState(true);
  const [activeBranchRadar, setActiveBranchRadar] = useState<string>('gudiwada');
  const [radarRadiusFilter, setRadarRadiusFilter] = useState<'all' | '10' | '20' | '30' | '30plus'>('all');

  // Map zoom and pan state for visual vector map
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copiedToast, setCopiedToast] = useState(false);

  // Multi-vehicle Fuel Estimation States
  const [selectedFuelVehicle, setSelectedFuelVehicle] = useState<'van' | 'bike' | 'tractor' | 'car'>('van');
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [showVehicleBreakdown, setShowVehicleBreakdown] = useState<boolean>(true);

  // Filtered suggestions
  const fromSuggestions = useMemo(() => {
    if (!fromQuery.trim()) return allSearchableLocations.slice(0, 8);
    const q = fromQuery.toLowerCase();
    return allSearchableLocations
      .filter(l => l.name.toLowerCase().includes(q) || l.teluguName.toLowerCase().includes(q))
      .slice(0, 10);
  }, [fromQuery, allSearchableLocations]);

  const toSuggestions = useMemo(() => {
    if (!toQuery.trim()) return allSearchableLocations.slice(0, 8);
    const q = toQuery.toLowerCase();
    return allSearchableLocations
      .filter(l => l.name.toLowerCase().includes(q) || l.teluguName.toLowerCase().includes(q))
      .slice(0, 10);
  }, [toQuery, allSearchableLocations]);

  // Handle select From
  const handleSelectFrom = (item: any) => {
    setFromQuery(item.name);
    setFromGeo({
      id: item.id,
      name: item.name,
      teluguName: item.teluguName,
      type: item.type,
      dealershipCode: item.dealershipCode,
      lat: item.lat,
      lng: item.lng,
      address: item.mandalName ? `${item.name}, ${item.mandalName}` : item.name
    });
    setShowFromSuggestions(false);
  };

  // Handle select To
  const handleSelectTo = (item: any) => {
    setToQuery(item.name);
    setToGeo({
      id: item.id,
      name: item.name,
      teluguName: item.teluguName,
      type: item.type,
      dealershipCode: item.dealershipCode,
      lat: item.lat,
      lng: item.lng,
      address: item.mandalName ? `${item.name}, ${item.mandalName}` : item.name
    });
    setShowToSuggestions(false);
  };

  // Swap From and To
  const handleSwapRoute = () => {
    const tempQ = fromQuery;
    const tempG = fromGeo;
    setFromQuery(toQuery);
    setFromGeo(toGeo);
    setToQuery(tempQ);
    setToGeo(tempG);
  };

  // Calculate Route Metrics & Multi-vehicle Estimates
  const routeMetrics = useMemo(() => {
    if (!fromGeo || !toGeo) {
      const fallbackVehicles = getAllVehicleTripEstimates(0);
      return {
        oneWayDistanceKm: 0,
        distanceKm: 0,
        bikeTime: '0 min',
        vanTime: '0 min',
        tractorTime: '0 min',
        carTime: '0 min',
        vanFuel: { liters: 0, costInr: 0 },
        bikeFuel: { liters: 0, costInr: 0 },
        corridor: 'Connecting Road',
        vehicles: fallbackVehicles
      };
    }

    // Check fixed branch matrix first
    let oneWayDistanceKm = 0;
    if (fromGeo.isBranch && toGeo.isBranch && BRANCH_DISTANCE_MATRIX[fromGeo.id]?.[toGeo.id]) {
      oneWayDistanceKm = BRANCH_DISTANCE_MATRIX[fromGeo.id][toGeo.id];
    } else {
      oneWayDistanceKm = calculateEstimatedRoadDistanceKm(fromGeo.lat, fromGeo.lng, toGeo.lat, toGeo.lng);
    }

    const effectiveDistanceKm = isRoundTrip ? oneWayDistanceKm * 2 : oneWayDistanceKm;

    // Travel times for different vehicles
    const bikeTime = calculateTravelTime(effectiveDistanceKm, 42); // 42 km/h
    const vanTime = calculateTravelTime(effectiveDistanceKm, 35); // 35 km/h
    const tractorTime = calculateTravelTime(effectiveDistanceKm, 22); // 22 km/h
    const carTime = calculateTravelTime(effectiveDistanceKm, 52); // 52 km/h

    // Multi-vehicle fuel & trip calculations
    const vehicles = getAllVehicleTripEstimates(effectiveDistanceKm);

    // Identify corridor
    let corridor = 'State Highway & District Rural Road';
    if (oneWayDistanceKm > 40) {
      if (
        (fromGeo.name.includes('Nandigama') || toGeo.name.includes('Nandigama')) ||
        (fromGeo.name.includes('Jaggayyapeta') || toGeo.name.includes('Jaggayyapeta'))
      ) {
        corridor = 'NH-65 (Hyderabad - Vijayawada Highway)';
      } else if (
        (fromGeo.name.includes('Machilipatnam') || toGeo.name.includes('Machilipatnam')) ||
        (fromGeo.name.includes('Vijayawada') || toGeo.name.includes('Vijayawada'))
      ) {
        corridor = 'NH-216 / Machilipatnam-Vijayawada Highway';
      } else {
        corridor = 'NH-16 / GNT Road & State Highway';
      }
    }

    return {
      oneWayDistanceKm,
      distanceKm: effectiveDistanceKm,
      bikeTime,
      vanTime,
      tractorTime,
      carTime,
      vanFuel: { liters: vehicles.van.liters, costInr: vehicles.van.costInr },
      bikeFuel: { liters: vehicles.bike.liters, costInr: vehicles.bike.costInr },
      corridor,
      vehicles
    };
  }, [fromGeo, toGeo, isRoundTrip]);

  // Direct Google Maps Directions Navigation URL
  const googleMapsDirectionsUrl = useMemo(() => {
    const origin = encodeURIComponent(
      fromGeo ? `${fromGeo.name} Krishna NTR Andhra Pradesh` : fromQuery || 'Gudivada'
    );
    const destination = encodeURIComponent(
      toGeo ? `${toGeo.name} Krishna NTR Andhra Pradesh` : toQuery || 'Machilipatnam'
    );
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  }, [fromGeo, toGeo, fromQuery, toQuery]);

  // Google Maps Search / Location Embed URL
  const googleMapsEmbedUrl = useMemo(() => {
    const dest = encodeURIComponent(
      toGeo ? `${toGeo.name} Krishna NTR Andhra Pradesh` : toQuery || 'Machilipatnam'
    );
    return `https://maps.google.com/maps?q=${dest}&t=&z=11&ie=UTF8&iwloc=&output=embed`;
  }, [toGeo, toQuery]);

  // Copy Route Summary to clipboard for sharing
  const handleCopyRouteSummary = () => {
    const tripTypeStr = isRoundTrip
      ? (isTe ? 'రౌండ్ ట్రిప్ (రాను-పోను 2x)' : 'Round Trip (2-Way)')
      : (isTe ? 'వన్-వే ప్రయాణం (1-Way)' : 'One-Way Trip');

    const v = routeMetrics.vehicles;

    const text = isTe
      ? `📍 *రూట్ & దూరాల వివరాలు - శ్రీ గాయత్రి ఆటోమోటివ్స్*\n` +
        `🚗 ఎక్కడి నుండి: ${fromGeo?.name || fromQuery}\n` +
        `🏁 ఎక్కడికి: ${toGeo?.name || toQuery}\n` +
        `📏 రోడ్డు దూరం (${tripTypeStr}): ${routeMetrics.distanceKm} కి.మీ\n` +
        `🛣️ కారిడార్: ${routeMetrics.corridor}\n\n` +
        `⏱️ *ప్రయాణ సమయాలు:*\n` +
        `  • 🚐 సర్వీస్ వ్యాన్: ${v.van.travelTime} (~35 km/h)\n` +
        `  • 🏍️ టెక్నీషియన్ బైక్: ${v.bike.travelTime} (~42 km/h)\n` +
        `  • 🚜 ట్రాక్టర్ రోడ్డు సమయం: ${v.tractor.travelTime} (~22 km/h)\n\n` +
        `⛽ *ఇంధన ఖర్చుల అంచనా (${tripTypeStr}):*\n` +
        `  • 🚐 వ్యాన్ (డీజిల్ @ 12 km/L): ~${v.van.liters} L (రూ. ~₹${v.van.costInr})\n` +
        `  • 🏍️ బైక్ (పెట్రోల్ @ 48 km/L): ~${v.bike.liters} L (రూ. ~₹${v.bike.costInr})\n` +
        `  • 🚜 ట్రాక్టర్ (డీజిల్ @ 6 km/L): ~${v.tractor.liters} L (రూ. ~₹${v.tractor.costInr})\n` +
        `  • 🚗 ఫీల్డ్ కారు (డీజిల్ @ 16 km/L): ~${v.car.liters} L (రూ. ~₹${v.car.costInr})\n\n` +
        `🗺️ గూగుల్ మ్యాప్స్ లైవ్ GPS: ${googleMapsDirectionsUrl}`
      : `📍 *Route & Distance Details - Sri Gayatri Automotives*\n` +
        `🚗 From: ${fromGeo?.name || fromQuery}\n` +
        `🏁 To: ${toGeo?.name || toQuery}\n` +
        `📏 Road Distance (${tripTypeStr}): ${routeMetrics.distanceKm} km\n` +
        `🛣️ Corridor: ${routeMetrics.corridor}\n\n` +
        `⏱️ *Estimated Travel Times:*\n` +
        `  • 🚐 Mobile Van: ${v.van.travelTime} (~35 km/h)\n` +
        `  • 🏍️ Tech Bike: ${v.bike.travelTime} (~42 km/h)\n` +
        `  • 🚜 Tractor: ${v.tractor.travelTime} (~22 km/h)\n\n` +
        `⛽ *Fuel & Trip Cost Estimates (${tripTypeStr}):*\n` +
        `  • 🚐 Van (Diesel @ 12 km/L): ~${v.van.liters} L (~₹${v.van.costInr})\n` +
        `  • 🏍️ Bike (Petrol @ 48 km/L): ~${v.bike.liters} L (~₹${v.bike.costInr})\n` +
        `  • 🚜 Tractor (Diesel @ 6 km/L): ~${v.tractor.liters} L (~₹${v.tractor.costInr})\n` +
        `  • 🚗 Field Car (Diesel @ 16 km/L): ~${v.car.liters} L (~₹${v.car.costInr})\n\n` +
        `🗺️ Google Maps Directions: ${googleMapsDirectionsUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Convert GPS Coordinates to SVG Canvas Coordinates (Bounds: Lat 15.8 to 17.2, Lng 80.0 to 81.5)
  const mapSvgBounds = {
    minLat: 15.85,
    maxLat: 17.2,
    minLng: 79.95,
    maxLng: 81.55,
    width: 800,
    height: 600
  };

  const gpsToSvg = (lat: number, lng: number) => {
    const x = ((lng - mapSvgBounds.minLng) / (mapSvgBounds.maxLng - mapSvgBounds.minLng)) * mapSvgBounds.width;
    // Invert Y because latitude goes up northwards
    const y = ((mapSvgBounds.maxLat - lat) / (mapSvgBounds.maxLat - mapSvgBounds.minLat)) * mapSvgBounds.height;
    return { x: Math.round(x), y: Math.round(y) };
  };

  // Active Branch Radar Villages
  const radarBranchInfo = useMemo(() => {
    return BRANCH_LOCATIONS.find(b => b.id === activeBranchRadar) || BRANCH_LOCATIONS[0];
  }, [activeBranchRadar]);

  const radarVillages = useMemo(() => {
    let branchData: BranchInfo | null = null;
    for (const code of ['4731', '4732'] as const) {
      const found = DEALERSHIP_DATA[code].branches.find(b => b.id === activeBranchRadar || b.name.toLowerCase().includes(radarBranchInfo.name.split(' ')[0].toLowerCase()));
      if (found) {
        branchData = found;
        break;
      }
    }

    if (!branchData) return [];

    const list: Array<{
      villageName: string;
      teluguName?: string;
      mandalName: string;
      distanceKm: number;
      approxTravelTime?: string;
    }> = [];

    branchData.mandals.forEach(m => {
      m.villages.forEach(v => {
        list.push({
          villageName: v.name,
          teluguName: v.teluguName,
          mandalName: m.name,
          distanceKm: v.distanceKm,
          approxTravelTime: v.approxTravelTime
        });
      });
    });

    // Sort by distance ascending
    list.sort((a, b) => a.distanceKm - b.distanceKm);

    if (radarRadiusFilter === '10') {
      return list.filter(v => v.distanceKm <= 10);
    } else if (radarRadiusFilter === '20') {
      return list.filter(v => v.distanceKm > 10 && v.distanceKm <= 20);
    } else if (radarRadiusFilter === '30') {
      return list.filter(v => v.distanceKm > 20 && v.distanceKm <= 30);
    } else if (radarRadiusFilter === '30plus') {
      return list.filter(v => v.distanceKm > 30);
    }
    return list;
  }, [activeBranchRadar, radarBranchInfo, radarRadiusFilter]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. EXPLANATION BANNER: HOW DISTANCES ARE CALCULATED IN THE SYSTEM */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-4 md:p-6 rounded-2xl shadow-xl border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-black bg-amber-400 text-slate-950 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Compass className="w-3.5 h-3.5" />
                {isTe ? 'కృష్ణా & ఎన్టీఆర్ జిల్లా టెరిటరీ రూట్ మ్యాప్' : 'Krishna & NTR District Route Explorer'}
              </span>
              <span className="text-xs text-blue-200 font-semibold hidden sm:inline">
                • 8 Workshop Hubs & 600+ Village Network
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-amber-400 shrink-0" />
              <span>
                {isTe
                  ? 'సర్వీస్ క్యాంప్ ప్లానింగ్ & దూరాల కాలిక్యులేటర్'
                  : 'Service Camp Planning & Distance Calculator'}
              </span>
            </h2>

            <p className="text-xs text-slate-200 max-w-3xl leading-relaxed">
              {isTe ? (
                <>
                  <strong className="text-amber-300">దూరం ఎక్కడ నుండి లెక్కించబడుతుంది? :</strong> మాస్టర్ ప్లానింగ్ సిస్టమ్‌లో
                  ప్రతి గ్రామానికి దూరం (<span className="font-mono font-bold text-amber-300">DistanceKm</span>), ఆ గ్రామానికి సేవలందించే
                  సంబంధిత <strong className="text-white underline">ఈచర్ డీలర్షిప్ వర్క్‌షాప్/బ్రాంచ్ హెడ్‌క్వార్టర్స్</strong> (ఉదా. గుడివాడ HQ, మచిలీపట్నం-21, పోరంకి, వుయ్యూరు, అవనిగడ్డ, నందిగామ, నూజివీడు, తిరువూరు) నుండి లెక్కించబడుతుంది.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">Where is distance calculated from? :</strong> In the Service Camp Directory, the distance (<span className="font-mono font-bold text-amber-300">DistanceKm</span>) for every village is measured directly from its respective <strong className="text-white underline">Assigned Dealership Workshop Branch HQ</strong> where technicians and mobile service vans are stationed.
                </>
              )}
            </p>
          </div>

          {/* Quick Hub Badges */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <div className="px-3 py-1.5 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl border border-white/20 text-xs">
              <div className="font-bold text-amber-300">4732 Hub (Krishna)</div>
              <div className="text-[11px] text-slate-300">Gudivada, Machilipatnam, Poranki, Avanigadda</div>
            </div>
            <div className="px-3 py-1.5 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl border border-white/20 text-xs">
              <div className="font-bold text-emerald-300">4731 Hub (NTR)</div>
              <div className="text-[11px] text-slate-300">Nandigama, Nuzvidu, Tiruvuru, Jaggayyapeta</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE FROM -> TO ROUTE PLANNER & CALCULATOR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-900 text-white rounded-lg">
              <Navigation className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isTe ? 'పాయింట్-టు-పాయింట్ రూట్ & డ్రైవింగ్ దూరాల కాలిక్యులేటర్' : 'Point-to-Point Route & Travel Distance Calculator'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isTe
                  ? 'ఎక్కడి నుండి ఎక్కడికైనా రోడ్డు దూరం, ప్రయాణ సమయం, మరియు ఇంధన ఖర్చును వెంటనే లెక్కించండి.'
                  : 'Calculate accurate driving distances, vehicle travel times, and route maps across Krishna & NTR.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRouteSummary}
              className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              title="Copy route details to share on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-700" />
              <span>{copiedToast ? (isTe ? 'కాపీ చేయబడింది! ✅' : 'Copied! ✅') : (isTe ? 'వివరాలు కాపీ చేయండి' : 'Share Route')}</span>
            </button>

            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-black bg-blue-900 hover:bg-blue-950 text-white rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTe ? 'గూగుల్ మ్యాప్స్ GPS 🚀' : 'Open Google Maps GPS'}</span>
            </a>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
          {/* FROM & TO SELECTION INPUTS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* FROM INPUT */}
            <div className="md:col-span-5 relative">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                <span>{isTe ? 'ఎక్కడి నుండి (From Place / Branch)' : 'From Location (Start Point)'}</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  value={fromQuery}
                  onChange={e => {
                    setFromQuery(e.target.value);
                    setShowFromSuggestions(true);
                  }}
                  onFocus={() => setShowFromSuggestions(true)}
                  placeholder={isTe ? 'బ్రాంచ్ లేదా గ్రామం పేరు టైప్ చేయండి...' : 'Type branch, town, or village name...'}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                />
                {fromQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromQuery('');
                      setShowFromSuggestions(true);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showFromSuggestions && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {isTe ? 'బ్రాంచ్‌లు & గ్రామాల జాబితా' : 'Select Starting Location'}
                  </div>
                  {fromSuggestions.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectFrom(item)}
                      className="w-full text-left p-2.5 hover:bg-emerald-50 text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.teluguName}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                        item.type === 'branch' ? 'bg-amber-100 text-amber-900' : item.type === 'mandal' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SWAP BUTTON */}
            <div className="md:col-span-2 flex justify-center">
              <button
                type="button"
                onClick={handleSwapRoute}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl shadow-2xs transition cursor-pointer hover:rotate-180 duration-200"
                title={isTe ? 'రూట్ రివర్స్ చేయండి (Swap Origin & Destination)' : 'Swap Start & Destination'}
              >
                <ArrowUpDown className="w-4 h-4 text-blue-900 md:rotate-90" />
              </button>
            </div>

            {/* TO INPUT */}
            <div className="md:col-span-5 relative">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
                <span>{isTe ? 'ఎక్కడికి (To Place / Camp Village)' : 'To Destination (Camp / Village)'}</span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-4 h-4 text-rose-600" />
                </div>
                <input
                  type="text"
                  value={toQuery}
                  onChange={e => {
                    setToQuery(e.target.value);
                    setShowToSuggestions(true);
                  }}
                  onFocus={() => setShowToSuggestions(true)}
                  placeholder={isTe ? 'చేరవలసిన గ్రామం లేదా బ్రాంచ్ పేరు...' : 'Type destination village or town name...'}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-bold text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:border-rose-600 focus:ring-2 focus:ring-rose-100 outline-none transition"
                />
                {toQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setToQuery('');
                      setShowToSuggestions(true);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showToSuggestions && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {isTe ? 'చేరవలసిన ప్రదేశాన్ని ఎంచుకోండి' : 'Select Destination Location'}
                  </div>
                  {toSuggestions.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTo(item)}
                      className="w-full text-left p-2.5 hover:bg-rose-50 text-xs flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.teluguName}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                        item.type === 'branch' ? 'bg-amber-100 text-amber-900' : item.type === 'mandal' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* QUICK BRANCH SELECT CHIPS */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isTe ? 'త్వరిత ఎంపిక (Quick Select Branches):' : 'Quick Pick Fixed Branches:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BRANCH_LOCATIONS.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    if (fromGeo?.id === b.id) {
                      handleSelectTo(b);
                    } else {
                      handleSelectFrom(b);
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    fromGeo?.id === b.id
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                      : toGeo?.id === b.id
                      ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  <Building2 className="w-3 h-3 text-amber-500" />
                  <span>{b.name.split(' (')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TRIP TYPE (ONE-WAY vs ROUND-TRIP) & COMPARISON TOGGLE */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 pb-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                {isTe ? 'ప్రయాణ రకం (Trip Type):' : 'Trip Distance Mode:'}
              </span>
              <div className="inline-flex rounded-lg bg-slate-200 p-0.5 border border-slate-300">
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(false)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    !isRoundTrip ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>➡️</span>
                  <span>{isTe ? 'వన్-వే ప్రయాణం (1-Way)' : 'One-Way (1-Way)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(true)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    isRoundTrip ? 'bg-amber-400 text-slate-950 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🔁</span>
                  <span>{isTe ? 'రౌండ్ ట్రిప్ (రాను-పోను 2x)' : 'Round Trip (2-Way 2x)'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowVehicleBreakdown(!showVehicleBreakdown)}
              className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs"
            >
              <Fuel className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {showVehicleBreakdown
                  ? (isTe ? '▼ వాహనాల పూర్తి పోలిక దాచండి' : '▼ Hide Vehicle Logistics')
                  : (isTe ? '▶ వాహనాల వారీగా ఇంధన పోలిక చూడండి' : '▶ Compare All Vehicle Logistics')}
              </span>
            </button>
          </div>

          {/* CALCULATION RESULTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Road Distance */}
            <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <RouteIcon className="w-3.5 h-3.5 text-blue-700" />
                    <span>{isTe ? 'రోడ్డు దూరం' : 'Road Distance'}</span>
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isRoundTrip ? 'bg-amber-200 text-amber-950' : 'bg-blue-100 text-blue-900'}`}>
                    {isRoundTrip ? '2x Round' : '1x One-Way'}
                  </span>
                </div>
                <div className="text-2xl font-black text-blue-950 mt-1 font-mono">
                  {routeMetrics.distanceKm} <span className="text-sm font-bold">km</span>
                </div>
                {isRoundTrip && (
                  <div className="text-[10px] text-blue-700 font-medium">
                    (One-way: {routeMetrics.oneWayDistanceKm} km)
                  </div>
                )}
              </div>
              <div className="text-[10px] text-blue-800 mt-2 truncate font-medium pt-1 border-t border-blue-200/80" title={routeMetrics.corridor}>
                🛣️ {routeMetrics.corridor}
              </div>
            </div>

            {/* 2. Mobile Service Van Time & Fuel */}
            <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isTe ? 'సర్వీస్ వ్యాన్ (వ్యాన్)' : 'Mobile Service Van'}</span>
                </div>
                <div className="text-xl font-black text-emerald-950 mt-1 font-mono">
                  {routeMetrics.vehicles.van.travelTime}
                </div>
                <div className="text-[10px] font-bold text-emerald-900 mt-0.5">
                  Avg. ~35 km/h with tools
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-emerald-200/80 text-[10px] font-bold text-emerald-800 flex items-center justify-between">
                <span>⛽ {isTe ? 'వ్యాన్ డీజిల్:' : 'Van Diesel:'}</span>
                <span className="font-mono text-emerald-950">~₹{routeMetrics.vehicles.van.costInr} ({routeMetrics.vehicles.van.liters}L)</span>
              </div>
            </div>

            {/* 3. Technician Bike Time & Fuel */}
            <div className="p-3 bg-purple-50/90 rounded-xl border border-purple-200 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-purple-700" />
                  <span>{isTe ? 'టెక్నీషియన్ బైక్' : 'Technician Bike'}</span>
                </div>
                <div className="text-xl font-black text-purple-950 mt-1 font-mono">
                  {routeMetrics.vehicles.bike.travelTime}
                </div>
                <div className="text-[10px] font-bold text-purple-900 mt-0.5">
                  Avg. ~42 km/h
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-purple-200/80 text-[10px] font-bold text-purple-800 flex items-center justify-between">
                <span>⛽ {isTe ? 'బైక్ పెట్రోల్:' : 'Bike Petrol:'}</span>
                <span className="font-mono text-purple-950">~₹{routeMetrics.vehicles.bike.costInr} ({routeMetrics.vehicles.bike.liters}L)</span>
              </div>
            </div>

            {/* 4. Tractor Road Speed & Fuel */}
            <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isTe ? 'ట్రాక్టర్ రోడ్డు స్పీడ్' : 'Tractor Road Transit'}</span>
                </div>
                <div className="text-xl font-black text-amber-950 mt-1 font-mono">
                  {routeMetrics.vehicles.tractor.travelTime}
                </div>
                <div className="text-[10px] font-bold text-amber-900 mt-0.5">
                  Avg. ~22 km/h (~3.5L/hr)
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-amber-200/80 text-[10px] font-bold text-amber-900 flex items-center justify-between">
                <span>⛽ {isTe ? 'ట్రాక్టర్ డీజిల్:' : 'Tractor Diesel:'}</span>
                <span className="font-mono text-amber-950">~₹{routeMetrics.vehicles.tractor.costInr} ({routeMetrics.vehicles.tractor.liters}L)</span>
              </div>
            </div>

            {/* 5. Fuel & Expenses Box with vehicle switcher & breakdown */}
            <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border border-slate-300 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isTe ? 'ఇంధన అంచనా' : 'Fuel Estimation'}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isRoundTrip ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                    {isRoundTrip ? '2x Round' : '1x One-Way'}
                  </span>
                </div>

                {/* Vehicle Switcher Tabs Inside Fuel Box */}
                <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-300/80 rounded-lg mb-1.5">
                  {[
                    { key: 'van', labelTe: 'వ్యాన్', labelEn: 'Van', icon: '🚐' },
                    { key: 'bike', labelTe: 'బైక్', labelEn: 'Bike', icon: '🏍️' },
                    { key: 'tractor', labelTe: 'ట్రాక్టర్', labelEn: 'Tractor', icon: '🚜' },
                    { key: 'car', labelTe: 'కారు', labelEn: 'Car', icon: '🚗' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedFuelVehicle(tab.key as any)}
                      className={`py-0.5 text-[9px] font-bold rounded flex items-center justify-center gap-0.5 transition cursor-pointer ${
                        selectedFuelVehicle === tab.key
                          ? 'bg-white text-slate-950 shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span className="truncate">{isTe ? tab.labelTe : tab.labelEn}</span>
                    </button>
                  ))}
                </div>

                {/* Selected vehicle main price */}
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-black text-slate-950 font-mono">
                    ~₹{routeMetrics.vehicles[selectedFuelVehicle].costInr.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 font-mono">
                    ~{routeMetrics.vehicles[selectedFuelVehicle].liters} L
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 font-medium truncate">
                  {routeMetrics.vehicles[selectedFuelVehicle].fuelTypeTe} ({routeMetrics.vehicles[selectedFuelVehicle].mileageKmpl} km/L @ ₹{routeMetrics.vehicles[selectedFuelVehicle].ratePerLiter})
                </div>
              </div>

              {/* Multi-vehicle breakdown list right inside the fuel box */}
              <div className="mt-2 pt-1.5 border-t border-slate-300 space-y-1 text-[10px]">
                <div className={`flex items-center justify-between ${selectedFuelVehicle === 'van' ? 'font-black text-emerald-950 bg-emerald-100/70 px-1 rounded' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-1">
                    <span>🚐</span> {isTe ? 'వ్యాన్:' : 'Van:'}
                  </span>
                  <span className="font-mono font-bold">~₹{routeMetrics.vehicles.van.costInr} ({routeMetrics.vehicles.van.liters}L)</span>
                </div>
                <div className={`flex items-center justify-between ${selectedFuelVehicle === 'bike' ? 'font-black text-purple-950 bg-purple-100/70 px-1 rounded' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-1">
                    <span>🏍️</span> {isTe ? 'బైక్:' : 'Bike:'}
                  </span>
                  <span className="font-mono font-bold">~₹{routeMetrics.vehicles.bike.costInr} ({routeMetrics.vehicles.bike.liters}L)</span>
                </div>
                <div className={`flex items-center justify-between ${selectedFuelVehicle === 'tractor' ? 'font-black text-amber-950 bg-amber-100/70 px-1 rounded' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-1">
                    <span>🚜</span> {isTe ? 'ట్రాక్టర్:' : 'Tractor:'}
                  </span>
                  <span className="font-mono font-bold">~₹{routeMetrics.vehicles.tractor.costInr} ({routeMetrics.vehicles.tractor.liters}L)</span>
                </div>
              </div>
            </div>
          </div>

          {/* DEDICATED MULTI-VEHICLE LOGISTICS & FUEL COMPARISON DETAIL CONTAINER */}
          {showVehicleBreakdown && (
            <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-md border border-slate-700/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs md:text-sm font-black text-white">
                    {isTe
                      ? 'వాహనాల వారీగా ప్రయాణ & ఇంధన ఖర్చుల పోలిక (Vehicle Fuel & Logistics Comparison)'
                      : 'Vehicle Fuel & Travel Comparison (Van vs Bike vs Tractor vs Car)'}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-amber-300">
                  {isRoundTrip ? (isTe ? 'మొత్తం దూరం: ' : 'Total Distance: ') : (isTe ? 'వన్-వే దూరం: ' : 'One-Way Distance: ')}
                  <strong>{routeMetrics.distanceKm} km</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Mobile Service Van Card */}
                <div className="p-3 bg-slate-800/90 rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-emerald-300 flex items-center gap-1.5">
                      <span>🚐</span>
                      <span>{isTe ? 'మొబైల్ సర్వీస్ వ్యాన్' : 'Mobile Service Van'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 rounded">
                      డీజిల్ @ ₹98/L
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-700">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'ఇంధన ఖర్చు' : 'Fuel Cost'}</div>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        ~₹{routeMetrics.vehicles.van.costInr.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'డీజిల్ మొత్తం' : 'Diesel Vol.'}</div>
                      <div className="text-sm font-black text-white font-mono">
                        {routeMetrics.vehicles.van.liters} <span className="text-xs font-normal">Litres</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'సగటు మైలేజ్:' : 'Avg. Mileage:'}</span>
                      <span className="font-bold text-white">~12 km/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'ప్రయాణ సమయం:' : 'Travel Time:'}</span>
                      <span className="font-bold text-amber-300">{routeMetrics.vehicles.van.travelTime} (~35 km/h)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      {isTe ? 'టూల్స్, కంప్రెషర్, ఆయిల్ & స్పేర్ పార్ట్స్ లోడ్' : 'Loaded with tools, oil drums & compressor'}
                    </div>
                  </div>
                </div>

                {/* 2. Technician Bike Card */}
                <div className="p-3 bg-slate-800/90 rounded-xl border border-purple-500/40 hover:border-purple-400 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-purple-300 flex items-center gap-1.5">
                      <span>🏍️</span>
                      <span>{isTe ? 'టెక్నీషియన్ బైక్' : 'Technician Bike'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-700 rounded">
                      పెట్రోల్ @ ₹108/L
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-700">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'ఇంధన ఖర్చు' : 'Fuel Cost'}</div>
                      <div className="text-lg font-black text-purple-400 font-mono">
                        ~₹{routeMetrics.vehicles.bike.costInr.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'పెట్రోల్ మొత్తం' : 'Petrol Vol.'}</div>
                      <div className="text-sm font-black text-white font-mono">
                        {routeMetrics.vehicles.bike.liters} <span className="text-xs font-normal">Litres</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'సగటు మైలేజ్:' : 'Avg. Mileage:'}</span>
                      <span className="font-bold text-white">~48 km/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'ప్రయాణ సమయం:' : 'Travel Time:'}</span>
                      <span className="font-bold text-amber-300">{routeMetrics.vehicles.bike.travelTime} (~42 km/h)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      {isTe ? 'ఎమర్జెన్సీ విజిట్స్ & చిన్న రిపేర్లు' : 'Quick breakdown visits & minor services'}
                    </div>
                  </div>
                </div>

                {/* 3. Eicher Tractor Road Transit Card */}
                <div className="p-3 bg-slate-800/90 rounded-xl border border-amber-500/40 hover:border-amber-400 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-amber-300 flex items-center gap-1.5">
                      <span>🚜</span>
                      <span>{isTe ? 'ట్రాక్టర్ రోడ్డు ప్రయాణం' : 'Eicher Tractor Transit'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-700 rounded">
                      డీజిల్ @ ₹98/L
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-700">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'ఇంధన ఖర్చు' : 'Fuel Cost'}</div>
                      <div className="text-lg font-black text-amber-400 font-mono">
                        ~₹{routeMetrics.vehicles.tractor.costInr.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'డీజిల్ మొత్తం' : 'Diesel Vol.'}</div>
                      <div className="text-sm font-black text-white font-mono">
                        {routeMetrics.vehicles.tractor.liters} <span className="text-xs font-normal">Litres</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'సగటు మైలేజ్:' : 'Avg. Mileage:'}</span>
                      <span className="font-bold text-white">~6 km/L (~3.5L/hr)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'ప్రయాణ సమయం:' : 'Travel Time:'}</span>
                      <span className="font-bold text-amber-300">{routeMetrics.vehicles.tractor.travelTime} (~22 km/h)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      {isTe ? 'రైతు ట్రాక్టర్‌ను వర్క్‌షాప్‌కి తేవడం/డెలివరీ' : 'Tractor driving to workshop / camp point'}
                    </div>
                  </div>
                </div>

                {/* 4. Field Officer Car Card */}
                <div className="p-3 bg-slate-800/90 rounded-xl border border-blue-500/40 hover:border-blue-400 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-blue-300 flex items-center gap-1.5">
                      <span>🚗</span>
                      <span>{isTe ? 'ఫీల్డ్ ఆఫీసర్ కారు' : 'Field Officer Car'}</span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-700 rounded">
                      డీజిల్ @ ₹98/L
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-700">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'ఇంధన ఖర్చు' : 'Fuel Cost'}</div>
                      <div className="text-lg font-black text-blue-400 font-mono">
                        ~₹{routeMetrics.vehicles.car.costInr.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{isTe ? 'డీజిల్ మొత్తం' : 'Diesel Vol.'}</div>
                      <div className="text-sm font-black text-white font-mono">
                        {routeMetrics.vehicles.car.liters} <span className="text-xs font-normal">Litres</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'సగటు మైలేజ్:' : 'Avg. Mileage:'}</span>
                      <span className="font-bold text-white">~16 km/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{isTe ? 'ప్రయాణ సమయం:' : 'Travel Time:'}</span>
                      <span className="font-bold text-amber-300">{routeMetrics.vehicles.car.travelTime} (~52 km/h)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      {isTe ? 'బ్రాంచ్ మేనేజర్ / డీలర్‌షిప్ ఆఫీసర్ విజిట్' : 'Dealership branch manager / officer visit'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QUICK ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-800">
                {fromGeo?.name || fromQuery} ➔ {toGeo?.name || toQuery}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onSelectCampVillage && toGeo?.type === 'village' && (
                <button
                  type="button"
                  onClick={() => {
                    const mandal = (toGeo as any).mandalName || 'Gudivada';
                    const branch = (toGeo as any).branchName || 'Gudivada';
                    const dCode = (toGeo as any).dealershipCode || '4732';
                    onSelectCampVillage(toGeo.name.split(',')[0], mandal, branch, dCode);
                  }}
                  className="px-3.5 py-1.5 text-xs font-black bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTe ? 'ఈ గ్రామంలో క్యాంప్ షెడ్యూల్ చేయండి' : 'Schedule Camp in this Village'}</span>
                </button>
              )}

              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 text-xs font-black bg-blue-900 hover:bg-blue-950 text-white rounded-lg shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTe ? 'గూగుల్ మ్యాప్స్ టర్న్-బై-టర్న్ నావిగేషన్' : 'Launch Google Maps Turn-by-Turn GPS'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE DISTRICT MAP VISUALIZER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Map Header & Mode Switcher */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm md:text-base font-black">
                {isTe ? 'కృష్ణా & ఎన్టీఆర్ జిల్లా ఇంటరాక్టివ్ నెట్‌వర్క్ మ్యాప్' : 'Krishna & NTR District Territory Map'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isTe
                  ? 'వర్క్‌షాప్ బ్రాంచ్‌లు, కవరేజ్ రింగ్స్ (10, 20, 30 km), మరియు రూట్ లైన్స్'
                  : 'Dealership branches, coverage radius rings, and live connecting routes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Mode: Visual vs Google Embed */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setMapMode('visual')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                  mapMode === 'visual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isTe ? 'లైట్ వెక్టార్ మ్యాప్' : 'Light Vector Map'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMapMode('google_embed')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer flex items-center gap-1 ${
                  mapMode === 'google_embed' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isTe ? 'గూగుల్ లైవ్ మ్యాప్' : 'Google Live Embed'}</span>
              </button>
            </div>

            {mapMode === 'visual' && (
              <button
                type="button"
                onClick={() => setShowRadiusRings(!showRadiusRings)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                  showRadiusRings
                    ? 'bg-amber-400 text-slate-950 border-amber-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>{showRadiusRings ? '⭕ Rings ON' : '⭕ Rings OFF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* MAP CONTENT CANVAS */}
        {mapMode === 'visual' ? (
          <div className="relative bg-slate-950 overflow-hidden select-none" style={{ minHeight: '520px' }}>
            {/* SVG Interactive Canvas */}
            <svg
              viewBox={`0 0 ${mapSvgBounds.width} ${mapSvgBounds.height}`}
              className="w-full h-auto max-h-[600px]"
              style={{
                transform: `scale(${zoomLevel}) translate(${mapCenter.x}px, ${mapCenter.y}px)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out'
              }}
            >
              <defs>
                {/* Gradient for connecting route line */}
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>

                {/* Glow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* District Outline / Grid Background */}
              <rect x="0" y="0" width={mapSvgBounds.width} height={mapSvgBounds.height} fill="#0b1329" />

              {/* Bay of Bengal Water Area representation (South / East of Krishna) */}
              <path
                d="M 520,600 Q 600,450 750,420 L 800,420 L 800,600 Z"
                fill="#082f49"
                opacity="0.6"
              />
              <text x="640" y="520" fill="#38bdf8" fontSize="12" fontWeight="bold" opacity="0.5">
                BAY OF BENGAL
              </text>

              {/* Krishna River Path representation */}
              <path
                d="M 50,220 Q 200,280 320,310 T 520,480 T 600,600"
                fill="none"
                stroke="#0284c7"
                strokeWidth="5"
                opacity="0.4"
              />
              <text x="180" y="270" fill="#38bdf8" fontSize="10" opacity="0.6" transform="rotate(10 180 270)">
                ~ Krishna River ~
              </text>

              {/* Major Highway connecting lines between branches */}
              <g opacity="0.3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3">
                {/* Gudivada to Machilipatnam */}
                <line x1={gpsToSvg(16.441, 80.9926).x} y1={gpsToSvg(16.441, 80.9926).y} x2={gpsToSvg(16.1875, 81.1389).x} y2={gpsToSvg(16.1875, 81.1389).y} />
                {/* Gudivada to Poranki / Vijayawada */}
                <line x1={gpsToSvg(16.441, 80.9926).x} y1={gpsToSvg(16.441, 80.9926).y} x2={gpsToSvg(16.4862, 80.7047).x} y2={gpsToSvg(16.4862, 80.7047).y} />
                {/* Vijayawada to Nandigama */}
                <line x1={gpsToSvg(16.4862, 80.7047).x} y1={gpsToSvg(16.4862, 80.7047).y} x2={gpsToSvg(16.7844, 80.2974).x} y2={gpsToSvg(16.7844, 80.2974).y} />
                {/* Vijayawada to Nuzvidu */}
                <line x1={gpsToSvg(16.4862, 80.7047).x} y1={gpsToSvg(16.4862, 80.7047).y} x2={gpsToSvg(16.785, 80.8464).x} y2={gpsToSvg(16.785, 80.8464).y} />
                {/* Nuzvidu to Tiruvuru */}
                <line x1={gpsToSvg(16.785, 80.8464).x} y1={gpsToSvg(16.785, 80.8464).y} x2={gpsToSvg(17.1128, 80.6122).x} y2={gpsToSvg(17.1128, 80.6122).y} />
                {/* Nandigama to Tiruvuru */}
                <line x1={gpsToSvg(16.7844, 80.2974).x} y1={gpsToSvg(16.7844, 80.2974).y} x2={gpsToSvg(17.1128, 80.6122).x} y2={gpsToSvg(17.1128, 80.6122).y} />
                {/* Machilipatnam to Avanigadda */}
                <line x1={gpsToSvg(16.1875, 81.1389).x} y1={gpsToSvg(16.1875, 81.1389).y} x2={gpsToSvg(16.0211, 80.9189).x} y2={gpsToSvg(16.0211, 80.9189).y} />
              </g>

              {/* COVERAGE RADIUS RINGS AROUND BRANCHES */}
              {showRadiusRings && (
                <g>
                  {BRANCH_LOCATIONS.map(branch => {
                    const pt = gpsToSvg(branch.lat, branch.lng);
                    // 10km ~ 18px on our SVG coordinate system
                    return (
                      <g key={`ring-${branch.id}`} opacity="0.35">
                        {/* 10 km ring */}
                        <circle cx={pt.x} cy={pt.y} r="22" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
                        {/* 20 km ring */}
                        <circle cx={pt.x} cy={pt.y} r="44" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
                        {/* 30 km ring */}
                        <circle cx={pt.x} cy={pt.y} r="66" fill="none" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4,4" opacity="0.6" />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* MANDAL LOCATIONS (Small dots) */}
              <g>
                {MANDAL_LOCATIONS.map(m => {
                  const pt = gpsToSvg(m.lat, m.lng);
                  return (
                    <g
                      key={`mandal-dot-${m.id}`}
                      className="cursor-pointer hover:opacity-100"
                      onClick={() => handleSelectTo(m)}
                    >
                      <circle cx={pt.x} cy={pt.y} r="3" fill="#94a3b8" opacity="0.7" />
                      <text
                        x={pt.x}
                        y={pt.y - 6}
                        fill="#cbd5e1"
                        fontSize="8"
                        textAnchor="middle"
                        fontWeight="500"
                        opacity="0.8"
                      >
                        {m.name}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* DYNAMIC CONNECTING ROUTE LINE (Between Selected From and To) */}
              {fromGeo && toGeo && (
                <g>
                  {(() => {
                    const pt1 = gpsToSvg(fromGeo.lat, fromGeo.lng);
                    const pt2 = gpsToSvg(toGeo.lat, toGeo.lng);
                    const midX = (pt1.x + pt2.x) / 2;
                    const midY = (pt1.y + pt2.y) / 2;

                    return (
                      <>
                        {/* Outer Glow Route */}
                        <line
                          x1={pt1.x}
                          y1={pt1.y}
                          x2={pt2.x}
                          y2={pt2.y}
                          stroke="#fbbf24"
                          strokeWidth="8"
                          opacity="0.4"
                          strokeLinecap="round"
                        />
                        {/* Main Animated Route */}
                        <line
                          x1={pt1.x}
                          y1={pt1.y}
                          x2={pt2.x}
                          y2={pt2.y}
                          stroke="url(#routeGradient)"
                          strokeWidth="3.5"
                          strokeDasharray="6,4"
                          strokeLinecap="round"
                        />
                        {/* Distance Badge on the Route Center */}
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x="-32"
                            y="-12"
                            width="64"
                            height="24"
                            rx="12"
                            fill="#0f172a"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                          />
                          <text
                            x="0"
                            y="4"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {routeMetrics.distanceKm} km
                          </text>
                        </g>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* DEALERSHIP BRANCHES (Large glowing pins) */}
              <g>
                {BRANCH_LOCATIONS.map(b => {
                  const pt = gpsToSvg(b.lat, b.lng);
                  const isFrom = fromGeo?.id === b.id;
                  const isTo = toGeo?.id === b.id;
                  const color = isFrom ? '#10b981' : isTo ? '#ef4444' : b.dealershipCode === '4731' ? '#10b981' : '#38bdf8';

                  return (
                    <g
                      key={`branch-pin-${b.id}`}
                      className="cursor-pointer group"
                      onClick={() => {
                        if (!fromGeo) {
                          handleSelectFrom(b);
                        } else {
                          handleSelectTo(b);
                        }
                      }}
                    >
                      {/* Pulse Circle for Selected */}
                      {(isFrom || isTo) && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="16"
                          fill={color}
                          opacity="0.3"
                          className="animate-ping"
                        />
                      )}

                      {/* Main Node */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isFrom || isTo ? '10' : '8'}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />

                      {/* Hub Badge */}
                      <rect
                        x={pt.x - 30}
                        y={pt.y + 12}
                        width="60"
                        height="16"
                        rx="4"
                        fill="#0f172a"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x={pt.x}
                        y={pt.y + 24}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {b.name.split(' (')[0]}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Floating Zoom & Pan Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-xl">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4 text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setMapCenter({ x: 0, y: 0 });
                }}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 text-[11px] text-white space-y-1.5 shadow-xl">
              <div className="font-bold text-amber-300 text-xs border-b border-slate-700 pb-1">
                {isTe ? 'మ్యాప్ సంకేతాలు (Legend)' : 'Map Legend'}
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
                <span>From Point / 4731 NTR Branches</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 border border-white"></span>
                <span>4732 Krishna Branches</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 border border-white"></span>
                <span>To Destination Point</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>⭕ Rings: 10km (Blue), 20km (Gold), 30km (Red)</span>
              </div>
            </div>
          </div>
        ) : (
          /* EMBEDDED GOOGLE MAPS ROUTE VIEW */
          <div className="relative bg-slate-100" style={{ height: '520px' }}>
            <iframe
              title="Google Maps Route Viewer"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={googleMapsEmbedUrl}
            ></iframe>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. FIXED BRANCH-TO-BRANCH DISTANCE MATRIX */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-900" />
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isTe ? 'ఫిక్స్‌డ్ బ్రాంచ్‌ల మధ్య దూరాల పట్టిక (Branch-to-Branch Distance Matrix)' : 'Fixed Branch-to-Branch Distance Matrix'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isTe
                  ? 'వర్క్‌షాప్ బ్రాంచ్‌ల మధ్య ఖచ్చితమైన రోడ్డు దూరాలు. ఏదైనా బాక్స్‌పై క్లిక్ చేసి నేరుగా రూట్ లోడ్ చేయండి.'
                  : 'Official road distances between all Eicher dealership workshop hubs in km.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blue-950 text-white font-bold">
                <th className="p-2.5 border border-blue-900">{isTe ? 'బ్రాంచ్ నుండి ➔' : 'From / To ➔'}</th>
                {BRANCH_LOCATIONS.map(b => (
                  <th key={`head-${b.id}`} className="p-2.5 text-center border border-blue-900 whitespace-nowrap">
                    {b.name.split(' (')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {BRANCH_LOCATIONS.map(fromB => (
                <tr key={`row-${fromB.id}`} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-bold text-slate-900 bg-slate-100 border border-slate-200 whitespace-nowrap">
                    {fromB.name.split(' (')[0]}
                  </td>
                  {BRANCH_LOCATIONS.map(toB => {
                    const isSame = fromB.id === toB.id;
                    const dist = BRANCH_DISTANCE_MATRIX[fromB.id]?.[toB.id] ?? 0;
                    const isSelected = (fromGeo?.id === fromB.id && toGeo?.id === toB.id) || (fromGeo?.id === toB.id && toGeo?.id === fromB.id);

                    return (
                      <td
                        key={`cell-${fromB.id}-${toB.id}`}
                        onClick={() => {
                          if (!isSame) {
                            handleSelectFrom(fromB);
                            handleSelectTo(toB);
                          }
                        }}
                        className={`p-2.5 text-center font-mono font-bold border border-slate-200 transition ${
                          isSame
                            ? 'bg-slate-200 text-slate-400 cursor-default'
                            : isSelected
                            ? 'bg-amber-100 text-amber-950 ring-2 ring-amber-500 cursor-pointer'
                            : 'hover:bg-blue-50 text-blue-900 cursor-pointer'
                        }`}
                      >
                        {isSame ? '—' : `${dist} km`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BRANCH COVERAGE RADAR & RADIUS VILLAGE DIRECTORY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isTe ? 'బ్రాంచ్ కవరేజ్ రాడార్ & దూరాల వారీగా గ్రామాలు' : 'Branch Coverage Radius & Village Directory'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isTe
                  ? 'ఒక బ్రాంచ్ కేంద్రంగా 10km, 20km, 30km పరిధిలోని గ్రామాల వివరాలు.'
                  : 'Explore all mapped villages categorized by travel distance from selected branch.'}
              </p>
            </div>
          </div>

          {/* Branch Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">{isTe ? 'బ్రాంచ్:' : 'Branch:'}</span>
            <select
              value={activeBranchRadar}
              onChange={e => setActiveBranchRadar(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 shadow-2xs outline-none cursor-pointer"
            >
              {BRANCH_LOCATIONS.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {/* Radius Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: isTe ? 'అన్ని గ్రామాలు' : 'All Villages', color: 'bg-slate-800' },
                { key: '10', label: isTe ? '🟢 0 - 10 km (లోకల్ పరిధి)' : '🟢 0 - 10 km (Local)', color: 'bg-emerald-700' },
                { key: '20', label: isTe ? '🟡 10 - 20 km (సమీప పరిధి)' : '🟡 10 - 20 km (Mid)', color: 'bg-amber-600' },
                { key: '30', label: isTe ? '🟠 20 - 30 km (బాహ్య పరిధి)' : '🟠 20 - 30 km (Outer)', color: 'bg-orange-600' },
                { key: '30plus', label: isTe ? '🔴 30+ km (క్యాంప్ సిఫార్సు)' : '🔴 30+ km (Camp Recommended)', color: 'bg-rose-700' }
              ].map(pill => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setRadarRadiusFilter(pill.key as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    radarRadiusFilter === pill.key
                      ? `${pill.color} text-white shadow-xs`
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-600">
              {radarVillages.length} {isTe ? 'గ్రామాలు కనుగొనబడ్డాయి' : 'villages in radius'}
            </span>
          </div>

          {/* Villages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1">
            {radarVillages.map((v, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs">{v.villageName}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {v.mandalName} Mandal • {v.approxTravelTime || `${v.distanceKm * 2} min`}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${
                    v.distanceKm <= 10
                      ? 'bg-emerald-100 text-emerald-900'
                      : v.distanceKm <= 20
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}>
                    {v.distanceKm} km
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectFrom(radarBranchInfo);
                      handleSelectTo({
                        id: `v_${v.villageName}`,
                        name: `${v.villageName}, ${v.mandalName}`,
                        teluguName: `${v.teluguName || v.villageName}`,
                        type: 'village',
                        lat: radarBranchInfo.lat + (v.distanceKm / 111) * 0.7,
                        lng: radarBranchInfo.lng + (v.distanceKm / 111) * 0.7
                      });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="block text-[9px] text-blue-900 font-bold hover:underline mt-1 cursor-pointer"
                  >
                    {isTe ? 'రూట్ చూడండి ➔' : 'View Route ➔'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default KrishnaDistrictRouteMap;
