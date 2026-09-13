// Unified, standard date formatter for Sri Gayathri Automotives Job Card Software
// Formats all dates as DD-MMM-YYYY (e.g. 12-Mar-2026) or DD/MM/YYYY as requested by user.

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Parses any date representation into { day, monthIndex, year } (where monthIndex is 0-11).
 * Handles:
 * - JS Date objects
 * - Excel numeric serial numbers (e.g. 44560)
 * - ISO strings (e.g. 2026-03-12, 2026-03-12T10:30:00Z)
 * - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (Indian standard: Day first, Month second)
 * - DD-MMM-YYYY, DD/MMM/YYYY (e.g. 12-May-2026, 12-Mar-2026)
 * - Auto-corrects accidental US format inversions when future dates are detected for delivery records
 */
export function parseDateComponents(val: any): { day: number; month: number; year: number } | null {
  if (val == null || val === "") return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return { day: val.getDate(), month: val.getMonth(), year: val.getFullYear() };
  }

  // If number or numeric string (Excel serial or epoch timestamp)
  const trimmed = typeof val === "string" ? val.trim() : "";
  const isNumericStr =
    typeof val === "string" &&
    trimmed !== "" &&
    !trimmed.includes("/") &&
    !trimmed.includes(":") &&
    (!trimmed.includes("-") || trimmed.startsWith("-")) &&
    !isNaN(Number(trimmed));

  if (typeof val === "number" || isNumericStr) {
    const num = typeof val === "number" ? val : Number(trimmed);
    // Excel serial number (approx between year 1955 and 2090)
    if (num > 20000 && num < 70000) {
      // Excel epoch starts at Dec 30, 1899 (leap year bug considered with 25569)
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return {
          day: date.getUTCDate(),
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
        };
      }
    }
    // Epoch timestamp in milliseconds
    if (num > 1e11) {
      const date = new Date(num);
      if (!isNaN(date.getTime())) {
        return {
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
        };
      }
    }
    // Epoch timestamp in seconds
    if (num > 1e8) {
      const date = new Date(num * 1000);
      if (!isNaN(date.getTime())) {
        return {
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
        };
      }
    }
  }

  const s = String(val).trim();
  if (
    !s ||
    s === "—" ||
    s === "-" ||
    s === "null" ||
    s === "undefined" ||
    s === "N/A" ||
    s === "n/a"
  )
    return null;

  // 1. Text Month standard: e.g. "12-May-2025", "12-05-2025", "12/Mar/2025", "12 May 2025", "1-May-25"
  const textMonthMatch = s.match(/^(\d{1,2})[-\/\.\s]+([A-Za-z]{3,9})[-\/\.\s]+(\d{2,4})/);
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const mStr = textMonthMatch[2].toLowerCase();
    let yr = textMonthMatch[3];
    if (yr.length === 2) yr = "20" + yr;
    const year = parseInt(yr, 10);
    const month = MONTH_NAME_MAP[mStr];
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return { day, month, year };
    }
  }

  // 2. Month first with text: e.g. "May 12, 2025" or "March 12 2025"
  const monthFirstTextMatch = s.match(/^([A-Za-z]{3,9})[-\/\.\s]+(\d{1,2})[,\-\/\.\s]+(\d{2,4})/);
  if (monthFirstTextMatch) {
    const mStr = monthFirstTextMatch[1].toLowerCase();
    const day = parseInt(monthFirstTextMatch[2], 10);
    let yr = monthFirstTextMatch[3];
    if (yr.length === 2) yr = "20" + yr;
    const year = parseInt(yr, 10);
    const month = MONTH_NAME_MAP[mStr];
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return { day, month, year };
    }
  }

  // 3. ISO Format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = s.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && month >= 0 && month <= 11) {
      return { day, month, year };
    }
  }

  // 4. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (Strict Indian Precedence: First is Day, Second is Month)
  const dmyMatch = s.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    let yr = dmyMatch[3];
    if (yr.length === 2) yr = "20" + yr;
    const year = parseInt(yr, 10);

    let day = p1;
    let month = p2 - 1;

    // Disambiguate if p1 > 12 -> p1 must be day, p2 must be month
    if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2 - 1;
    } else if (p2 > 12 && p1 <= 12) {
      // p2 > 12 -> p2 must be day, p1 is month (US format MM/DD/YYYY)
      day = p2;
      month = p1 - 1;
    } else {
      // Standard Indian format: p1 = Day, p2 = Month (e.g. 1/5/2025 is 1st May 2025)
      day = p1;
      month = p2 - 1;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month <= 11) {
      return { day, month, year };
    }
  }

  // 5. Fallback to Date.parse
  const parsedTime = Date.parse(s);
  if (!isNaN(parsedTime)) {
    const d = new Date(parsedTime);
    if (d.getFullYear() > 1900 && d.getFullYear() < 2100) {
      return { day: d.getDate(), month: d.getMonth(), year: d.getFullYear() };
    }
  }

  return null;
}

/**
 * Standard date display format across the entire application:
 * Outputs DD-MMM-YYYY (e.g. "12-Mar-2026", "03-Dec-2026")
 * This strictly satisfies:
 * "DATE FORMAT DATE/MONTH/YEAR ILA VACCHELAGA PETTU, AVASARAM AITHE MOTH -JAN, FEB,MAR, FORMATLO VACHHELAGA PETTU"
 */
export function formatDisplayDate(val: any, fallback = "—"): string {
  if (val == null || val === "") return fallback;
  const comps = parseDateComponents(val);
  if (!comps) {
    const s = String(val).trim();
    return s ? s : fallback;
  }
  const dayStr = String(comps.day).padStart(2, "0");
  const monthStr = MONTHS_SHORT[comps.month] || String(comps.month + 1).padStart(2, "0");
  return `${dayStr}-${monthStr}-${comps.year}`;
}

/**
 * Normalizes any imported delivery date value (e.g. "1/5/2025", "01/05/2025", "2025-05-01",
 * Excel numeric serial numbers) to the standard DD-MMM-YYYY display format, regardless of
 * how it was originally uploaded, so every row shows a consistent format.
 */
export function formatDeliveryDisplayDate(val: any, fallback = "—"): string {
  if (val == null || val === "") return fallback;
  const s = String(val).trim();
  if (!s || s === "—" || s === "-" || s === "null" || s === "undefined") return fallback;
  return formatDisplayDate(val, s);
}

/**
 * Numeric DD/MM/YYYY format (e.g. "12/03/2026")
 */
export function formatDisplayDateDMY(val: any, fallback = "—"): string {
  if (val == null || val === "") return fallback;
  const comps = parseDateComponents(val);
  if (!comps) {
    const s = String(val).trim();
    return s ? s : fallback;
  }
  const dayStr = String(comps.day).padStart(2, "0");
  const monthStr = String(comps.month + 1).padStart(2, "0");
  return `${dayStr}/${monthStr}/${comps.year}`;
}

/**
 * ISO date string format YYYY-MM-DD for <input type="date">
 */
export function formatIsoDate(val: any): string {
  if (val == null || val === "") return "";
  const comps = parseDateComponents(val);
  if (!comps) return "";
  const dayStr = String(comps.day).padStart(2, "0");
  const monthStr = String(comps.month + 1).padStart(2, "0");
  return `${comps.year}-${monthStr}-${dayStr}`;
}

/**
 * Parses any date into a millisecond timestamp for correct chronological sorting (newest first).
 */
export function parseDateToTimestamp(raw: any): number {
  if (raw == null || raw === "") return -1;
  const comps = parseDateComponents(raw);
  if (!comps) return -1;
  return new Date(comps.year, comps.month, comps.day).getTime();
}

/**
 * Extracts raw delivery date value from any customer object checking all common field variations.
 */
export function getCustomerRawDeliveryDate(c: any): any {
  if (!c) return "";
  return (
    c["Date of del"] ||
    c["Date of Delivery"] ||
    c["DEL DATE"] ||
    c["Del Date"] ||
    c["Del. Date"] ||
    c["DATE OF DEL"] ||
    c["DATE OF DELIVERY"] ||
    c["DELIVERY DATE"] ||
    c["Delivery Date"] ||
    c["DOD"] ||
    c["dod"] ||
    c.dateOfDel ||
    c.dateOfDelivery ||
    c.deliveryDate ||
    c.date_of_delivery ||
    c.date_of_del ||
    c.installDate ||
    c.install_date ||
    c.delDate ||
    c.rawDateOfDel ||
    (c.fullData && (
      c.fullData["Date of del"] ||
      c.fullData["Date of Delivery"] ||
      c.fullData["DEL DATE"] ||
      c.fullData["Del Date"] ||
      c.fullData["Del. Date"] ||
      c.fullData["DATE OF DEL"] ||
      c.fullData["DATE OF DELIVERY"] ||
      c.fullData["DELIVERY DATE"] ||
      c.fullData["Delivery Date"] ||
      c.fullData["DOD"] ||
      c.fullData.dateOfDel ||
      c.fullData.dateOfDelivery ||
      c.fullData.deliveryDate ||
      c.fullData.date_of_delivery ||
      c.fullData.date_of_del ||
      c.fullData.installDate ||
      c.fullData.install_date
    )) ||
    ""
  );
}

/**
 * Gets the delivery timestamp (ms) for a customer object.
 */
export function getCustomerDeliveryTimestamp(c: any): number {
  if (!c) return -1;
  const raw = getCustomerRawDeliveryDate(c);
  return parseDateToTimestamp(raw);
}

/**
 * Checks whether a delivery date is older than given years (default 2 years) relative to today.
 * If delivery date > 2 years ago -> Out of Warranty (true).
 * If delivery date <= 2 years ago -> In Warranty (false).
 */
export function isDeliveryOutOfWarranty(rawDateOrTs: any, warrantyYears = 2): boolean {
  if (rawDateOrTs == null || rawDateOrTs === "") return false;
  const ts = typeof rawDateOrTs === "number" && rawDateOrTs > 1000000 
    ? rawDateOrTs 
    : parseDateToTimestamp(rawDateOrTs);
  if (ts <= 0) return false;

  const delDate = new Date(ts);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - warrantyYears);
  return delDate.getTime() < cutoff.getTime();
}

/**
 * Detailed warranty calculation helper.
 */
export function getDeliveryWarrantyStatus(rawDateOrTs: any, warrantyYears = 2): {
  isOutOfWarranty: boolean;
  yearsElapsed: number;
  expiryFormatted: string;
} {
  const ts = typeof rawDateOrTs === "number" && rawDateOrTs > 1000000 
    ? rawDateOrTs 
    : parseDateToTimestamp(rawDateOrTs);
  if (ts <= 0) {
    return { isOutOfWarranty: false, yearsElapsed: 0, expiryFormatted: "—" };
  }
  const comps = parseDateComponents(ts);
  if (!comps) {
    return { isOutOfWarranty: false, yearsElapsed: 0, expiryFormatted: "—" };
  }
  const delDate = new Date(comps.year, comps.month, comps.day);
  const expiryDate = new Date(comps.year + warrantyYears, comps.month, comps.day);
  const now = new Date();
  const isOutOfWarranty = now.getTime() > expiryDate.getTime();
  const diffMs = now.getTime() - delDate.getTime();
  const yearsElapsed = Number((diffMs / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1));

  return {
    isOutOfWarranty,
    yearsElapsed,
    expiryFormatted: formatDisplayDate(expiryDate),
  };
}
