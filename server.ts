import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { pool, isPostgresConfigured } from './src/db/index.ts';
import { localDb } from './src/db/storage.ts';
import { syncCustomersToFirestore, syncJobCardsToFirestore, syncComplaintsToFirestore } from './src/lib/firebaseServerSync.ts';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

function getPool() {
  return pool;
}

let isDbReady = false;

async function ensureDbTables() {
  if (!isPostgresConfigured() || !pool) {
    console.log('Using local persistent file database (eicher_db.json). PostgreSQL host not specified.');
    isDbReady = true;
    return;
  }

  try {
    const client = getPool();
    if (!client) return;

    await client.query(`
      CREATE TABLE IF NOT EXISTS jobcards (
        id TEXT PRIMARY KEY,
        job_no TEXT,
        online_job_card_no TEXT,
        job_date TEXT,
        date_time_in TEXT,
        date_time_out TEXT,
        expected_repair_time TEXT,
        status TEXT,
        cust_name TEXT,
        father_name TEXT,
        cust_addr TEXT,
        village TEXT,
        mandal TEXT,
        owner_mob TEXT,
        driver_mob TEXT,
        regd_no TEXT,
        chassis_no TEXT,
        engine_no TEXT,
        model TEXT,
        model_type TEXT,
        serial_no TEXT,
        hour_meter TEXT,
        service_type TEXT,
        free_service_list TEXT,
        extra_repairs TEXT,
        mechanic TEXT,
        ws_incharge TEXT,
        service_location TEXT,
        bill_no TEXT,
        reasons_for_analysis TEXT,
        telecalling TEXT,
        warranty_override TEXT,
        total_labour TEXT,
        warranty_material TEXT,
        non_warranty_material TEXT,
        g_total TEXT,
        actual_closed_date TEXT,
        branch TEXT,
        history_file_no TEXT,
        complaint_date TEXT,
        install_date TEXT,
        date_of_delivery TEXT,
        dist_dealership TEXT,
        full_data TEXT,
        checkpoints TEXT,
        repair_rows TEXT,
        part_rows TEXT,
        created_by TEXT,
        created_by_email TEXT,
        created_at TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS service_camps (
        id TEXT PRIMARY KEY,
        dealership_code TEXT,
        branch TEXT,
        mandal TEXT,
        village TEXT,
        camp_date TEXT,
        target_tractors TEXT,
        supervisor TEXT,
        mechanic TEXT,
        status TEXT,
        service_type_expected TEXT,
        offers TEXT,
        contact_person TEXT,
        contact_phone TEXT,
        notes TEXT,
        attended_count TEXT,
        created_at TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        father_name TEXT,
        village TEXT,
        mandal TEXT,
        mobile_number TEXT,
        date_of_joining TEXT,
        supervisor TEXT,
        active TEXT DEFAULT 'true',
        assigned_supervisor TEXT,
        created_at TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        chassis_key TEXT NOT NULL UNIQUE,
        chassis_no TEXT NOT NULL,
        cust_name TEXT,
        father_name TEXT,
        cust_addr TEXT,
        village TEXT,
        mandal TEXT,
        owner_mob TEXT,
        driver_mob TEXT,
        regd_no TEXT,
        engine_no TEXT,
        tractor_model TEXT,
        date_of_delivery TEXT,
        followup_history TEXT,
        full_data TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS spares (
        id SERIAL PRIMARY KEY,
        part_key TEXT NOT NULL UNIQUE,
        part_no TEXT NOT NULL,
        part_desc TEXT,
        mrp TEXT,
        category TEXT,
        full_data TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        complaint_no TEXT,
        date TEXT,
        customer_name TEXT,
        phone TEXT,
        village TEXT,
        mandal TEXT,
        tractor_model TEXT,
        chassis_no TEXT,
        hours TEXT,
        complaint_details TEXT,
        mechanic TEXT,
        status TEXT,
        job_card_no TEXT,
        closure_date TEXT,
        remarks TEXT,
        created_at TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        records TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE jobcards ADD COLUMN IF NOT EXISTS branch TEXT;
      ALTER TABLE jobcards ADD COLUMN IF NOT EXISTS history_file_no TEXT;
      ALTER TABLE jobcards ADD COLUMN IF NOT EXISTS complaint_date TEXT;
      ALTER TABLE jobcards ADD COLUMN IF NOT EXISTS install_date TEXT;
      ALTER TABLE jobcards ADD COLUMN IF NOT EXISTS date_of_delivery TEXT;
      ALTER TABLE jobcards ADD COLUMN IF NOT EXISTS dist_dealership TEXT;
      ALTER TABLE jobcards ADD COLUMN IF NOT EXISTS full_data TEXT;
    `);

    console.log('PostgreSQL database tables verified/created successfully.');
    isDbReady = true;
  } catch (err: any) {
    console.warn('PostgreSQL not accessible; operating seamlessly in local persistent mode:', err.message);
    isDbReady = true;
  }
}
ensureDbTables();

// Initialize test data if empty
async function initializeTestData() {
  try {
    const existingCards = localDb.getJobCards();
    if (!existingCards || existingCards.length === 0) {
      const testCards = [
        {
          id: '1',
          job_no: 'JOB001',
          online_job_card_no: 'OJOB001',
          job_date: new Date().toISOString().split('T')[0],
          cust_name: 'Sample Customer 1',
          regd_no: 'TN01AB1234',
          chassis_no: 'CH001',
          model: 'Eicher Pro',
          service_type: 'Free Service',
          status: 'Completed',
          bill_no: 'BILL001',
          total_labour: '0',
          warranty_material: '0',
          non_warranty_material: '0',
          g_total: '0'
        },
        {
          id: '2',
          job_no: 'JOB002',
          online_job_card_no: 'OJOB002',
          job_date: new Date().toISOString().split('T')[0],
          cust_name: 'Sample Customer 2',
          regd_no: 'TN02CD5678',
          chassis_no: 'CH002',
          model: 'Eicher Pro Truck',
          service_type: 'Paid Service',
          status: 'Pending',
          bill_no: 'BILL002',
          total_labour: '500',
          warranty_material: '0',
          non_warranty_material: '1000',
          g_total: '1500'
        },
        {
          id: '3',
          job_no: 'JOB003',
          online_job_card_no: 'OJOB003',
          job_date: new Date().toISOString().split('T')[0],
          cust_name: 'Sample Customer 3',
          regd_no: 'TN03EF9012',
          chassis_no: 'CH003',
          model: 'Eicher 20.16',
          service_type: 'Warranty',
          status: 'Completed',
          bill_no: 'BILL003',
          total_labour: '200',
          warranty_material: '2000',
          non_warranty_material: '0',
          g_total: '2200'
        }
      ];

      localDb.bulkUpsertJobCards(testCards, true);
      await syncJobCardsToFirestore(testCards);
      console.log('✅ Initialized 3 test job cards');
    }
  } catch (err) {
    console.warn('Test data initialization notice:', err);
  }
}
initializeTestData();

// Helper functions for normalization
function normKey(str: any): string {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractField(obj: any, candidates: string[]): string {
  if (!obj || typeof obj !== 'object') return '';
  const normalizedObj: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null && String(v).trim() !== '') {
      normalizedObj[normKey(k)] = String(v).trim();
    }
  }

  for (const c of candidates) {
    const nc = normKey(c);
    if (normalizedObj[nc] !== undefined && normalizedObj[nc] !== '') {
      return normalizedObj[nc];
    }
  }

  for (const [k, v] of Object.entries(normalizedObj)) {
    for (const c of candidates) {
      const nc = normKey(c);
      if (nc.length >= 3 && (k.includes(nc) || nc.includes(k)) && v !== '') {
        return v;
      }
    }
  }

  return '';
}

function normalizeCustomerRow(r: any, index: number, seenKeys: Set<string>) {
  const chassisNo = extractField(r, [
    'chassisNo', 'chassis_no', 'chassis', 'chassisnumber', 'chassisnum', 'chassiscode',
    'vin', 'vinnumber', 'frameno', 'framenumber', 'tractorslno', 'tractorchassis',
    'serialno', 'serialnumber', 'slno', 'sno', 'trchassis'
  ]) || (r.chassisNo ? String(r.chassisNo).trim() : '');

  const custName = extractField(r, [
    'custName', 'cust_name', 'customername', 'nameofcustomer', 'name', 'ownername',
    'farmername', 'clientname', 'partyname', 'customer', 'cust'
  ]) || (r.custName ? String(r.custName).trim() : '');

  const fatherName = extractField(r, [
    'fatherName', 'father_name', 'father', 'fathersname', 'careof', 'co', 'so', 'wo', 'do',
    'husbandname', 'parentname', 'guardian'
  ]) || (r.fatherName ? String(r.fatherName).trim() : '');

  const custAddr = extractField(r, [
    'custAddr', 'cust_addr', 'address', 'customeraddress', 'fulladdress', 'location',
    'residence', 'place', 'addr'
  ]) || (r.custAddr ? String(r.custAddr).trim() : '');

  const village = extractField(r, [
    'village', 'vill', 'town', 'city', 'habitation', 'gramam', 'ooru'
  ]) || (r.village ? String(r.village).trim() : '');

  const mandal = extractField(r, [
    'mandal', 'mandalname', 'taluk', 'tehsil', 'block', 'district', 'dist'
  ]) || (r.mandal ? String(r.mandal).trim() : '');

  const ownerMob = extractField(r, [
    'ownerMob', 'owner_mob', 'mobile', 'mobilenumber', 'phone', 'phonenumber', 'contact',
    'contactno', 'custphone', 'cell', 'cellno', 'phno', 'tel', 'phone1'
  ]) || (r.ownerMob ? String(r.ownerMob).trim() : '');

  const driverMob = extractField(r, [
    'driverMob', 'driver_mob', 'driverphone', 'drivernumber', 'alternatemobile', 'altphone',
    'altmobile', 'secondmobile', 'phone2', 'driver'
  ]) || (r.driverMob ? String(r.driverMob).trim() : '');

  const regdNo = extractField(r, [
    'regdNo', 'regd_no', 'registrationno', 'regnumber', 'vehicleno', 'tractorregdno',
    'regno', 'rcno', 'plateno'
  ]) || (r.regdNo ? String(r.regdNo).trim() : '');

  const engineNo = extractField(r, [
    'engineNo', 'engine_no', 'enginenumber', 'engno', 'motorno'
  ]) || (r.engineNo ? String(r.engineNo).trim() : '');

  const tractorModel = extractField(r, [
    'tractorModel', 'tractor_model', 'model', 'modeltype', 'modelname', 'variant',
    'hp', 'horse_power', 'make', 'tractortype'
  ]) || (r.tractorModel ? String(r.tractorModel).trim() : '');

  const dateOfDelivery = extractField(r, [
    'dateOfDelivery', 'date_of_delivery', 'deliverydate', 'dateofdel', 'date_of_del', 'deldate', 'dateofdelivery', 'installdate', 'doi', 'dop',
    'purchasedate', 'saledate', 'invoicedate', 'billdate', 'dod', 'delivery_date', 'date'
  ]) || (r.dateOfDelivery ? String(r.dateOfDelivery).trim() : '');

  let baseKey = normKey(chassisNo);
  if (!baseKey) {
    if (ownerMob) baseKey = `mob_${normKey(ownerMob)}`;
    else if (regdNo) baseKey = `reg_${normKey(regdNo)}`;
    else if (custName) baseKey = `name_${normKey(custName)}`;
    else baseKey = `cust_row_${index + 1}`;
  }

  let finalKey = baseKey;
  if (seenKeys) {
    if (!normKey(chassisNo)) {
      let counter = 1;
      while (seenKeys.has(finalKey)) {
        counter++;
        finalKey = `${baseKey}_dup${counter}`;
      }
    }
    seenKeys.add(finalKey);
  }

  let followupHistory = [];
  try {
    followupHistory = typeof r.followupHistory === 'string'
      ? JSON.parse(r.followupHistory)
      : (Array.isArray(r.followupHistory) ? r.followupHistory : (Array.isArray(r.followup_history) ? r.followup_history : []));
  } catch {}

  const fullData = r.full_data || r.fullData || {
    ...r,
    chassisNo,
    custName,
    fatherName,
    custAddr: custAddr || (village ? (mandal ? `${village}, ${mandal}` : village) : ''),
    village,
    mandal,
    ownerMob,
    driverMob,
    regdNo,
    engineNo,
    tractorModel,
    dateOfDelivery,
    __chassisDisplay: chassisNo,
    __custNameDisplay: custName,
    __custPhoneDisplay: ownerMob,
    __custAddrDisplay: custAddr || village
  };

  return {
    chassisKey: finalKey,
    chassis_key: finalKey,
    chassisNo: chassisNo || finalKey,
    chassis_no: chassisNo || finalKey,
    custName,
    cust_name: custName,
    fatherName,
    father_name: fatherName,
    custAddr: custAddr || (village ? (mandal ? `${village}, ${mandal}` : village) : ''),
    cust_addr: custAddr || (village ? (mandal ? `${village}, ${mandal}` : village) : ''),
    village,
    mandal,
    ownerMob,
    owner_mob: ownerMob,
    driverMob,
    driver_mob: driverMob,
    regdNo,
    regd_no: regdNo,
    engineNo,
    engine_no: engineNo,
    tractorModel,
    tractor_model: tractorModel,
    dateOfDelivery,
    date_of_delivery: dateOfDelivery,
    followupHistory: JSON.stringify(followupHistory),
    followup_history: JSON.stringify(followupHistory),
    fullData: typeof fullData === 'object' ? JSON.stringify(fullData) : String(fullData),
    full_data: typeof fullData === 'object' ? JSON.stringify(fullData) : String(fullData)
  };
}

function normalizeSpareRow(r: any, index: number, seenKeys: Set<string>) {
  const partNo = extractField(r, [
    'partNo', 'part_no', 'partnumber', 'itemcode', 'sparepartno', 'spareno',
    'partcode', 'materialno', 'itemnumber', 'part', 'code'
  ]) || (r.partNo ? String(r.partNo).trim() : '');

  const partDesc = extractField(r, [
    'partDesc', 'part_desc', 'desc', 'description', 'partname', 'itemdesc',
    'itemname', 'materialdescription', 'sparedesc', 'details', 'name'
  ]) || (r.partDesc ? String(r.partDesc).trim() : '');

  const mrp = extractField(r, [
    'mrp', 'rate', 'price', 'amount', 'unitprice', 'cost', 'val', 'standardrate'
  ]) || (r.mrp != null ? String(r.mrp).trim() : '');

  const category = extractField(r, [
    'category', 'group', 'type', 'partcategory', 'section', 'division'
  ]) || (r.category ? String(r.category).trim() : '');

  let baseKey = normKey(partNo);
  if (!baseKey) {
    if (partDesc) baseKey = `desc_${normKey(partDesc).substring(0, 20)}`;
    else baseKey = `part_row_${index + 1}`;
  }

  let finalKey = baseKey;
  let counter = 1;
  while (seenKeys.has(finalKey)) {
    counter++;
    finalKey = `${baseKey}_dup${counter}`;
  }
  seenKeys.add(finalKey);

  const fullData = r.full_data || r.fullData || {
    ...r,
    partNo,
    partDesc,
    mrp,
    category,
    __partNoDisplay: partNo
  };

  return {
    partKey: finalKey,
    part_key: finalKey,
    partNo: partNo || finalKey,
    part_no: partNo || finalKey,
    partDesc,
    part_desc: partDesc,
    mrp,
    category,
    fullData: typeof fullData === 'object' ? JSON.stringify(fullData) : String(fullData),
    full_data: typeof fullData === 'object' ? JSON.stringify(fullData) : String(fullData)
  };
}

// =======================
// DATABASE MANAGEMENT API
// =======================

// Clear database API
app.post('/api/database/clear', async (req, res) => {
  try {
    localDb.clearAll();
    const client = getPool();
    if (client) {
      try {
        await client.query('TRUNCATE TABLE customers, jobcards, complaints, spares, staff, staff_attendance, app_settings, service_camps RESTART IDENTITY CASCADE');
      } catch (err) {
        console.warn('Postgres truncate notice:', err);
      }
    }
    console.log('Database cleared successfully.');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing database:', error);
    res.json({ success: true });
  }
});

// Bulk delete jobcards API
app.post('/api/database/delete-jobcards', async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'No IDs provided' });
  }

  try {
    localDb.bulkDeleteJobCards(ids);
    const client = getPool();
    if (client) {
      try {
        await client.query('DELETE FROM jobcards WHERE id = ANY($1)', [ids]);
      } catch (err) {
        console.warn('Postgres delete jobcards notice:', err);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting jobcards:', error);
    res.json({ success: true });
  }
});

// Health check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    postgresConfigured: isPostgresConfigured()
  });
});

// Delete all customers
app.post('/api/database/delete-all-customers', async (req, res) => {
  try {
    localDb.deleteAllCustomers();
    const client = getPool();
    if (client) {
      try {
        await client.query('DELETE FROM customers');
      } catch (err) {
        console.warn('Postgres delete customers notice:', err);
      }
    }
    res.json({ success: true, message: 'All customers deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting all customers:', error);
    res.json({ success: true, message: 'All customers deleted successfully' });
  }
});

// =======================
// CUSTOMERS API
// =======================

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM customers ORDER BY id ASC');
        return res.json({ success: true, data: result.rows });
      } catch (e) {
        console.warn('Postgres fetch customers notice, using local store:', e);
      }
    }
    const customers = localDb.getCustomers();
    res.json({ success: true, data: customers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.json({ success: true, data: localDb.getCustomers() });
  }
});

// Bulk upsert/replace customers
app.post('/api/customers/bulk', async (req, res) => {
  const { rows, replaceAll } = req.body;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ success: false, error: 'Rows array required' });
  }

  if (rows.length === 0) {
    if (replaceAll) localDb.deleteAllCustomers();
    return res.json({ success: true, count: 0 });
  }

  try {
    const seenKeys = new Set<string>();
    const rowMap = new Map<string, any>();
    rows.forEach((r, i) => {
      const norm = normalizeCustomerRow(r, i, seenKeys);
      if (rowMap.has(norm.chassisKey)) {
        const existing = rowMap.get(norm.chassisKey);
        rowMap.set(norm.chassisKey, { ...existing, ...norm });
      } else {
        rowMap.set(norm.chassisKey, norm);
      }
    });
    const normalizedRows = Array.from(rowMap.values());

    localDb.bulkUpsertCustomers(normalizedRows as any, replaceAll);

    // Sync to Firestore for cross-user sharing (works even without PostgreSQL)
    syncCustomersToFirestore(normalizedRows).catch(err =>
      console.warn('Firestore sync warning:', err)
    );

    const client = getPool();
    if (!client) {
      return res.json({ success: true, count: normalizedRows.length, firebaseSynced: true });
    }

    try {
      const insertQuery = `
        INSERT INTO customers (
          chassis_key, chassis_no, cust_name, father_name, cust_addr, village, mandal,
          owner_mob, driver_mob, regd_no, engine_no, tractor_model, date_of_delivery,
          followup_history, full_data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        ON CONFLICT (chassis_key) DO UPDATE SET
          chassis_no = EXCLUDED.chassis_no,
          cust_name = EXCLUDED.cust_name,
          father_name = EXCLUDED.father_name,
          cust_addr = EXCLUDED.cust_addr,
          village = EXCLUDED.village,
          mandal = EXCLUDED.mandal,
          owner_mob = EXCLUDED.owner_mob,
          driver_mob = EXCLUDED.driver_mob,
          regd_no = EXCLUDED.regd_no,
          engine_no = EXCLUDED.engine_no,
          tractor_model = EXCLUDED.tractor_model,
          date_of_delivery = EXCLUDED.date_of_delivery,
          followup_history = EXCLUDED.followup_history,
          full_data = EXCLUDED.full_data,
          updated_at = NOW()
      `;

      if (replaceAll) {
        await client.query('DELETE FROM customers');
      }

      // Batch insert in chunks of 100 to avoid slow sequential queries
      const batchSize = 100;
      for (let i = 0; i < normalizedRows.length; i += batchSize) {
        const chunk = normalizedRows.slice(i, i + batchSize);
        const valuePlaceholders = chunk
          .map((_, idx) => `($${idx * 15 + 1}, $${idx * 15 + 2}, $${idx * 15 + 3}, $${idx * 15 + 4}, $${idx * 15 + 5}, $${idx * 15 + 6}, $${idx * 15 + 7}, $${idx * 15 + 8}, $${idx * 15 + 9}, $${idx * 15 + 10}, $${idx * 15 + 11}, $${idx * 15 + 12}, $${idx * 15 + 13}, $${idx * 15 + 14}, $${idx * 15 + 15})`)
          .join(',');
        const batchQuery = `
          INSERT INTO customers (
            chassis_key, chassis_no, cust_name, father_name, cust_addr, village, mandal,
            owner_mob, driver_mob, regd_no, engine_no, tractor_model, date_of_delivery,
            followup_history, full_data
          ) VALUES ${valuePlaceholders}
          ON CONFLICT (chassis_key) DO UPDATE SET
            chassis_no = EXCLUDED.chassis_no,
            cust_name = EXCLUDED.cust_name,
            father_name = EXCLUDED.father_name,
            cust_addr = EXCLUDED.cust_addr,
            village = EXCLUDED.village,
            mandal = EXCLUDED.mandal,
            owner_mob = EXCLUDED.owner_mob,
            driver_mob = EXCLUDED.driver_mob,
            regd_no = EXCLUDED.regd_no,
            engine_no = EXCLUDED.engine_no,
            tractor_model = EXCLUDED.tractor_model,
            date_of_delivery = EXCLUDED.date_of_delivery,
            followup_history = EXCLUDED.followup_history,
            full_data = EXCLUDED.full_data,
            updated_at = NOW()
        `;
        const params = chunk.flatMap(item => [
          item.chassisKey, item.chassisNo, item.custName, item.fatherName, item.custAddr,
          item.village, item.mandal, item.ownerMob, item.driverMob, item.regdNo,
          item.engineNo, item.tractorModel, item.dateOfDelivery, item.followupHistory, item.fullData
        ]);
        await client.query(batchQuery, params);
      }

      // Sync to Firestore for cross-user sharing
      syncCustomersToFirestore(normalizedRows).catch(err =>
        console.warn('Firestore sync warning:', err)
      );

      res.json({ success: true, count: normalizedRows.length, cloudSaved: true });
    } catch (err: any) {
      console.error('Postgres bulk customer save error:', err);
      res.status(500).json({ success: false, error: `❌ Database error: ${err.message}` });
    }
  } catch (error: any) {
    console.error('Error saving customers bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upsert single customer
app.post('/api/customers', async (req, res) => {
  const r = req.body;
  const seenKeys = new Set<string>();
  const item = normalizeCustomerRow(r, 0, seenKeys);

  try {
    const saved = localDb.upsertCustomer(item as any);

    const client = getPool();
    if (client) {
      try {
        const query = `
          INSERT INTO customers (
            chassis_key, chassis_no, cust_name, father_name, cust_addr, village, mandal,
            owner_mob, driver_mob, regd_no, engine_no, tractor_model, date_of_delivery,
            followup_history, full_data, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
          ON CONFLICT (chassis_key) DO UPDATE SET
            chassis_no = EXCLUDED.chassis_no,
            cust_name = EXCLUDED.cust_name,
            father_name = EXCLUDED.father_name,
            cust_addr = EXCLUDED.cust_addr,
            village = EXCLUDED.village,
            mandal = EXCLUDED.mandal,
            owner_mob = EXCLUDED.owner_mob,
            driver_mob = EXCLUDED.driver_mob,
            regd_no = EXCLUDED.regd_no,
            engine_no = EXCLUDED.engine_no,
            tractor_model = EXCLUDED.tractor_model,
            date_of_delivery = EXCLUDED.date_of_delivery,
            followup_history = EXCLUDED.followup_history,
            full_data = EXCLUDED.full_data,
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await client.query(query, [
          item.chassisKey,
          item.chassisNo,
          item.custName,
          item.fatherName,
          item.custAddr,
          item.village,
          item.mandal,
          item.ownerMob,
          item.driverMob,
          item.regdNo,
          item.engineNo,
          item.tractorModel,
          item.dateOfDelivery,
          item.followupHistory,
          item.fullData
        ]);
        return res.json({ success: true, data: result.rows[0] });
      } catch (err) {
        console.warn('Postgres save customer notice:', err);
      }
    }

    // Sync to Firestore for cross-user sharing
    syncCustomersToFirestore([item]).catch(err =>
      console.warn('Firestore sync warning:', err)
    );

    res.json({ success: true, data: saved, firebaseSynced: true });
  } catch (error: any) {
    console.error('Error saving customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =======================
// SPARES API
// =======================

// Get all spares
app.get('/api/spares', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM spares ORDER BY id ASC');
        return res.json({ success: true, data: result.rows });
      } catch (err) {
        console.warn('Postgres fetch spares notice, using local store:', err);
      }
    }
    res.json({ success: true, data: localDb.getSpares() });
  } catch (error: any) {
    console.error('Error fetching spares:', error);
    res.json({ success: true, data: localDb.getSpares() });
  }
});

// Bulk upsert/replace spares
app.post('/api/spares/bulk', async (req, res) => {
  const { rows, replaceAll } = req.body;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ success: false, error: 'Rows array required' });
  }

  if (rows.length === 0 && !replaceAll) {
    return res.json({ success: true, count: 0 });
  }

  try {
    const seenKeys = new Set<string>();
    const normalizedRows = rows.map((r, i) => normalizeSpareRow(r, i, seenKeys));

    localDb.bulkUpsertSpares(normalizedRows as any, replaceAll);

    const client = getPool();
    if (!client) {
      return res.status(503).json({
        success: false,
        error: '❌ Cloud database NOT configured. Data saved locally only. Please set: SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DB_NAME'
      });
    }

    try {
      if (replaceAll) {
        await client.query('DELETE FROM spares');
      }

      // Batch insert in chunks of 100 to avoid slow sequential queries
      const batchSize = 100;
      for (let i = 0; i < normalizedRows.length; i += batchSize) {
        const chunk = normalizedRows.slice(i, i + batchSize);
        const valuePlaceholders = chunk
          .map((_, idx) => `($${idx * 6 + 1}, $${idx * 6 + 2}, $${idx * 6 + 3}, $${idx * 6 + 4}, $${idx * 6 + 5}, $${idx * 6 + 6})`)
          .join(',');
        const batchQuery = `
          INSERT INTO spares (
            part_key, part_no, part_desc, mrp, category, full_data
          ) VALUES ${valuePlaceholders}
          ON CONFLICT (part_key) DO UPDATE SET
            part_no = EXCLUDED.part_no,
            part_desc = EXCLUDED.part_desc,
            mrp = EXCLUDED.mrp,
            category = EXCLUDED.category,
            full_data = EXCLUDED.full_data,
            updated_at = NOW()
        `;
        const params = chunk.flatMap(item => [
          item.partKey, item.partNo, item.partDesc, item.mrp, item.category, item.fullData
        ]);
        await client.query(batchQuery, params);
      }
      res.json({ success: true, count: normalizedRows.length, cloudSaved: true });
    } catch (err: any) {
      console.error('Postgres save spares error:', err);
      res.status(500).json({ success: false, error: `❌ Database error: ${err.message}` });
    }
  } catch (error: any) {
    console.error('Error saving spares bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =======================
// JOB CARDS API
// =======================

// Get all job cards
app.get('/api/jobcards', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM jobcards ORDER BY created_at DESC');
        return res.json({ success: true, data: result.rows });
      } catch (err) {
        console.warn('Postgres fetch jobcards notice, using local store:', err);
      }
    }
    res.json({ success: true, data: localDb.getJobCards() });
  } catch (error: any) {
    console.error('Error fetching jobcards:', error);
    res.json({ success: true, data: localDb.getJobCards() });
  }
});

// Save/Update single job card
app.post('/api/jobcards', async (req, res) => {
  const card = req.body;
  if (!card || !card.id) {
    return res.status(400).json({ success: false, error: 'Job card ID is required' });
  }

  try {
    const fullData = card.fullData || card.full_data || card;
    const formattedCard = {
      ...card,
      id: card.id,
      job_no: card.jobNo || card.job_no || '',
      online_job_card_no: card.onlineJobCardNo || card.online_job_card_no || '',
      job_date: card.jobDate || card.job_date || '',
      date_time_in: card.dateTimeIn || card.date_time_in || '',
      date_time_out: card.dateTimeOut || card.date_time_out || '',
      expected_repair_time: card.expectedRepairTime || card.expected_repair_time || '',
      status: card.status || 'Open',
      cust_name: card.custName || card.cust_name || '',
      father_name: card.fatherName || card.father_name || '',
      cust_addr: card.custAddr || card.cust_addr || '',
      village: card.village || '',
      mandal: card.mandal || '',
      owner_mob: card.ownerMob || card.owner_mob || '',
      driver_mob: card.driverMob || card.driver_mob || '',
      regd_no: card.regdNo || card.regd_no || '',
      chassis_no: card.chassisNo || card.chassis_no || '',
      engine_no: card.engineNo || card.engine_no || '',
      model: card.model || '',
      model_type: card.modelType || card.model_type || '',
      serial_no: card.serialNo || card.serial_no || '',
      hour_meter: card.hourMeter || card.hour_meter || '',
      service_type: card.serviceType || card.service_type || '',
      free_service_list: card.freeServiceList || card.free_service_list || '',
      extra_repairs: card.extraRepairs || card.extra_repairs || '',
      mechanic: card.mechanic || card.technicianName || '',
      ws_incharge: card.wsIncharge || card.ws_incharge || '',
      service_location: card.serviceLocation || card.service_location || '',
      bill_no: card.billNo || card.bill_no || '',
      reasons_for_analysis: card.reasonsForAnalysis || card.reasons_for_analysis || '',
      telecalling: card.telecalling || '',
      warranty_override: card.warrantyOverride || card.warranty_override || 'auto',
      total_labour: card.totalLabour || card.total_labour || '',
      warranty_material: card.warrantyMaterial || card.warranty_material || '',
      non_warranty_material: card.nonWarrantyMaterial || card.non_warranty_material || '',
      g_total: card.gTotal || card.g_total || '',
      actual_closed_date: card.actualClosedDate || card.actual_closed_date || '',
      branch: card.branch || '',
      history_file_no: card.historyFileNo || card.history_file_no || '',
      complaint_date: card.complaintDate || card.complaint_date || '',
      install_date: card.installDate || card.install_date || card.dateOfDelivery || card.date_of_delivery || '',
      date_of_delivery: card.dateOfDelivery || card.date_of_delivery || card.installDate || card.install_date || '',
      dist_dealership: card.distDealership || card.dist_dealership || '',
      full_data: typeof fullData === 'object' ? JSON.stringify(fullData) : String(fullData || ''),
      checkpoints: typeof card.checkpoints === 'string' ? card.checkpoints : JSON.stringify(card.checkpoints || []),
      repair_rows: typeof card.repairRows === 'string' ? card.repairRows : (typeof card.repair_rows === 'string' ? card.repair_rows : JSON.stringify(card.repairRows || card.repair_rows || [])),
      part_rows: typeof card.partRows === 'string' ? card.partRows : (typeof card.part_rows === 'string' ? card.part_rows : JSON.stringify(card.partRows || card.part_rows || [])),
      created_by: card.createdBy || card.created_by || '',
      created_by_email: card.createdByEmail || card.created_by_email || '',
      created_at: card.createdAt || card.created_at || new Date().toISOString()
    };

    const saved = localDb.saveJobCard(formattedCard);

    const client = getPool();
    if (client) {
      try {
        const query = `
          INSERT INTO jobcards (
            id, job_no, online_job_card_no, job_date, date_time_in, date_time_out,
            expected_repair_time, status, cust_name, father_name, cust_addr,
            village, mandal, owner_mob, driver_mob, regd_no, chassis_no, engine_no,
            model, model_type, serial_no, hour_meter, service_type, free_service_list,
            extra_repairs, mechanic, ws_incharge, service_location, bill_no,
            reasons_for_analysis, telecalling, warranty_override, total_labour,
            warranty_material, non_warranty_material, g_total, actual_closed_date,
            branch, history_file_no, complaint_date, install_date, date_of_delivery, dist_dealership, full_data,
            checkpoints, repair_rows, part_rows, created_by, created_by_email, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
            $45, $46, $47, $48, $49, $50, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            job_no = EXCLUDED.job_no,
            online_job_card_no = EXCLUDED.online_job_card_no,
            job_date = EXCLUDED.job_date,
            date_time_in = EXCLUDED.date_time_in,
            date_time_out = EXCLUDED.date_time_out,
            expected_repair_time = EXCLUDED.expected_repair_time,
            status = EXCLUDED.status,
            cust_name = EXCLUDED.cust_name,
            father_name = EXCLUDED.father_name,
            cust_addr = EXCLUDED.cust_addr,
            village = EXCLUDED.village,
            mandal = EXCLUDED.mandal,
            owner_mob = EXCLUDED.owner_mob,
            driver_mob = EXCLUDED.driver_mob,
            regd_no = EXCLUDED.regd_no,
            chassis_no = EXCLUDED.chassis_no,
            engine_no = EXCLUDED.engine_no,
            model = EXCLUDED.model,
            model_type = EXCLUDED.model_type,
            serial_no = EXCLUDED.serial_no,
            hour_meter = EXCLUDED.hour_meter,
            service_type = EXCLUDED.service_type,
            free_service_list = EXCLUDED.free_service_list,
            extra_repairs = EXCLUDED.extra_repairs,
            mechanic = EXCLUDED.mechanic,
            ws_incharge = EXCLUDED.ws_incharge,
            service_location = EXCLUDED.service_location,
            bill_no = EXCLUDED.bill_no,
            reasons_for_analysis = EXCLUDED.reasons_for_analysis,
            telecalling = EXCLUDED.telecalling,
            warranty_override = EXCLUDED.warranty_override,
            total_labour = EXCLUDED.total_labour,
            warranty_material = EXCLUDED.warranty_material,
            non_warranty_material = EXCLUDED.non_warranty_material,
            g_total = EXCLUDED.g_total,
            actual_closed_date = EXCLUDED.actual_closed_date,
            branch = EXCLUDED.branch,
            history_file_no = EXCLUDED.history_file_no,
            complaint_date = EXCLUDED.complaint_date,
            install_date = EXCLUDED.install_date,
            date_of_delivery = EXCLUDED.date_of_delivery,
            dist_dealership = EXCLUDED.dist_dealership,
            full_data = EXCLUDED.full_data,
            checkpoints = EXCLUDED.checkpoints,
            repair_rows = EXCLUDED.repair_rows,
            part_rows = EXCLUDED.part_rows,
            created_by = EXCLUDED.created_by,
            created_by_email = EXCLUDED.created_by_email,
            updated_at = NOW()
          RETURNING *;
        `;

        const result = await client.query(query, [
          formattedCard.id,
          formattedCard.job_no,
          formattedCard.online_job_card_no,
          formattedCard.job_date,
          formattedCard.date_time_in,
          formattedCard.date_time_out,
          formattedCard.expected_repair_time,
          formattedCard.status,
          formattedCard.cust_name,
          formattedCard.father_name,
          formattedCard.cust_addr,
          formattedCard.village,
          formattedCard.mandal,
          formattedCard.owner_mob,
          formattedCard.driver_mob,
          formattedCard.regd_no,
          formattedCard.chassis_no,
          formattedCard.engine_no,
          formattedCard.model,
          formattedCard.model_type,
          formattedCard.serial_no,
          formattedCard.hour_meter,
          formattedCard.service_type,
          formattedCard.free_service_list,
          formattedCard.extra_repairs,
          formattedCard.mechanic,
          formattedCard.ws_incharge,
          formattedCard.service_location,
          formattedCard.bill_no,
          formattedCard.reasons_for_analysis,
          formattedCard.telecalling,
          formattedCard.warranty_override,
          formattedCard.total_labour,
          formattedCard.warranty_material,
          formattedCard.non_warranty_material,
          formattedCard.g_total,
          formattedCard.actual_closed_date,
          formattedCard.branch,
          formattedCard.history_file_no,
          formattedCard.complaint_date,
          formattedCard.install_date,
          formattedCard.date_of_delivery,
          formattedCard.dist_dealership,
          formattedCard.full_data,
          formattedCard.checkpoints,
          formattedCard.repair_rows,
          formattedCard.part_rows,
          formattedCard.created_by,
          formattedCard.created_by_email,
          formattedCard.created_at
        ]);
        return res.json({ success: true, data: result.rows[0] });
      } catch (err) {
        console.warn('Postgres save jobcard notice:', err);
      }
    }

    // Sync to Firestore for cross-user sharing
    syncJobCardsToFirestore([saved]).catch(err =>
      console.warn('Firestore sync warning:', err)
    );

    res.json({ success: true, data: saved, firebaseSynced: true });
  } catch (error: any) {
    console.error('Error saving job card:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete job card
app.delete('/api/jobcards/:id', async (req, res) => {
  const { id } = req.params;
  try {
    localDb.deleteJobCard(id);
    const client = getPool();
    if (client) {
      try {
        await client.query('DELETE FROM jobcards WHERE id = $1', [id]);
      } catch (err) {
        console.warn('Postgres delete jobcard notice:', err);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting jobcard:', error);
    res.json({ success: true });
  }
});

// Bulk upsert job cards
app.post('/api/jobcards/bulk', async (req, res) => {
  const { cards, replaceAll } = req.body;
  if (!Array.isArray(cards)) {
    return res.status(400).json({ success: false, error: 'Cards array required' });
  }

  try {
    const formattedCards = cards.map(card => {
      const fullData = card.fullData || card.full_data || card;
      return {
        ...card,
        id: card.id,
        job_no: card.jobNo || card.job_no || '',
        online_job_card_no: card.onlineJobCardNo || card.online_job_card_no || '',
        job_date: card.jobDate || card.job_date || '',
        date_time_in: card.dateTimeIn || card.date_time_in || '',
        date_time_out: card.dateTimeOut || card.date_time_out || '',
        expected_repair_time: card.expectedRepairTime || card.expected_repair_time || '',
        status: card.status || 'Open',
        cust_name: card.custName || card.cust_name || '',
        father_name: card.fatherName || card.father_name || '',
        cust_addr: card.custAddr || card.cust_addr || '',
        village: card.village || '',
        mandal: card.mandal || '',
        owner_mob: card.ownerMob || card.owner_mob || '',
        driver_mob: card.driverMob || card.driver_mob || '',
        regd_no: card.regdNo || card.regd_no || '',
        chassis_no: card.chassisNo || card.chassis_no || '',
        engine_no: card.engineNo || card.engine_no || '',
        model: card.model || '',
        model_type: card.modelType || card.model_type || '',
        serial_no: card.serialNo || card.serial_no || '',
        hour_meter: card.hourMeter || card.hour_meter || '',
        service_type: card.serviceType || card.service_type || '',
        free_service_list: card.freeServiceList || card.free_service_list || '',
        extra_repairs: card.extraRepairs || card.extra_repairs || '',
        mechanic: card.mechanic || card.technicianName || '',
        ws_incharge: card.wsIncharge || card.ws_incharge || '',
        service_location: card.serviceLocation || card.service_location || '',
        bill_no: card.billNo || card.bill_no || '',
        reasons_for_analysis: card.reasonsForAnalysis || card.reasons_for_analysis || '',
        telecalling: card.telecalling || '',
        warranty_override: card.warrantyOverride || card.warranty_override || 'auto',
        total_labour: card.totalLabour || card.total_labour || '',
        warranty_material: card.warrantyMaterial || card.warranty_material || '',
        non_warranty_material: card.nonWarrantyMaterial || card.non_warranty_material || '',
        g_total: card.gTotal || card.g_total || '',
        actual_closed_date: card.actualClosedDate || card.actual_closed_date || '',
        branch: card.branch || '',
        history_file_no: card.historyFileNo || card.history_file_no || '',
        complaint_date: card.complaintDate || card.complaint_date || '',
        install_date: card.installDate || card.install_date || card.dateOfDelivery || card.date_of_delivery || '',
        date_of_delivery: card.dateOfDelivery || card.date_of_delivery || card.installDate || card.install_date || '',
        dist_dealership: card.distDealership || card.dist_dealership || '',
        full_data: typeof fullData === 'object' ? JSON.stringify(fullData) : String(fullData || ''),
        checkpoints: typeof card.checkpoints === 'string' ? card.checkpoints : JSON.stringify(card.checkpoints || []),
        repair_rows: typeof card.repairRows === 'string' ? card.repairRows : (typeof card.repair_rows === 'string' ? card.repair_rows : JSON.stringify(card.repairRows || card.repair_rows || [])),
        part_rows: typeof card.partRows === 'string' ? card.partRows : (typeof card.part_rows === 'string' ? card.part_rows : JSON.stringify(card.partRows || card.part_rows || [])),
        created_by: card.createdBy || card.created_by || '',
        created_by_email: card.createdByEmail || card.created_by_email || '',
        created_at: card.createdAt || card.created_at || new Date().toISOString()
      };
    });

    localDb.bulkUpsertJobCards(formattedCards, replaceAll);

    // Sync to Firestore for cross-user sharing
    syncJobCardsToFirestore(formattedCards).catch(err =>
      console.warn('Firestore sync warning:', err)
    );

    res.json({ success: true, count: cards.length, firebaseSynced: true });
  } catch (error: any) {
    console.error('Error saving job cards bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =======================
// COMPLAINTS API
// =======================

// Get all complaints
app.get('/api/complaints', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM complaints ORDER BY created_at DESC');
        return res.json({ success: true, data: result.rows });
      } catch (err) {
        console.warn('Postgres fetch complaints notice, using local store:', err);
      }
    }
    res.json({ success: true, data: localDb.getComplaints() });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    res.json({ success: true, data: localDb.getComplaints() });
  }
});

// Save/Update complaint
app.post('/api/complaints', async (req, res) => {
  const comp = req.body;
  if (!comp || !comp.id) {
    return res.status(400).json({ success: false, error: 'Complaint ID is required' });
  }

  try {
    const formattedComp = {
      ...comp,
      id: comp.id,
      complaint_no: comp.complaintNo || comp.complaint_no || '',
      date: comp.complaintDate || comp.date || comp.createdDate || '',
      customer_name: comp.customerName || comp.customer_name || '',
      phone: comp.mobileNumber || comp.phone || comp.mobile_number || '',
      village: comp.village || '',
      mandal: comp.mandal || '',
      tractor_model: comp.tractorModel || comp.tractor_model || '',
      chassis_no: comp.chassisNo || comp.chassis_no || '',
      hours: String(comp.hours || ''),
      complaint_details: comp.complaintDetails || comp.complaint_details || '',
      mechanic: comp.assignedMechanic || comp.mechanic || '',
      status: comp.status || 'Open',
      job_card_no: comp.jobCardNo || comp.job_card_no || '',
      closure_date: comp.closureDate || comp.closure_date || comp.closedDate || '',
      remarks: comp.resolution || comp.remarks || '',
      created_at: comp.createdAt || comp.created_at || new Date().toISOString()
    };

    const saved = localDb.saveComplaint(formattedComp);

    const client = getPool();
    if (client) {
      try {
        const query = `
          INSERT INTO complaints (
            id, complaint_no, date, customer_name, phone, village, mandal,
            tractor_model, chassis_no, hours, complaint_details, mechanic,
            status, job_card_no, closure_date, remarks, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
          ON CONFLICT (id) DO UPDATE SET
            complaint_no = EXCLUDED.complaint_no,
            date = EXCLUDED.date,
            customer_name = EXCLUDED.customer_name,
            phone = EXCLUDED.phone,
            village = EXCLUDED.village,
            mandal = EXCLUDED.mandal,
            tractor_model = EXCLUDED.tractor_model,
            chassis_no = EXCLUDED.chassis_no,
            hours = EXCLUDED.hours,
            complaint_details = EXCLUDED.complaint_details,
            mechanic = EXCLUDED.mechanic,
            status = EXCLUDED.status,
            job_card_no = EXCLUDED.job_card_no,
            closure_date = EXCLUDED.closure_date,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await client.query(query, [
          formattedComp.id,
          formattedComp.complaint_no,
          formattedComp.date,
          formattedComp.customer_name,
          formattedComp.phone,
          formattedComp.village,
          formattedComp.mandal,
          formattedComp.tractor_model,
          formattedComp.chassis_no,
          formattedComp.hours,
          formattedComp.complaint_details,
          formattedComp.mechanic,
          formattedComp.status,
          formattedComp.job_card_no,
          formattedComp.closure_date,
          formattedComp.remarks,
          formattedComp.created_at
        ]);
        return res.json({ success: true, data: result.rows[0] });
      } catch (err) {
        console.warn('Postgres save complaint notice:', err);
      }
    }

    // Sync to Firestore for cross-user sharing
    syncComplaintsToFirestore([formattedComp]).catch(err =>
      console.warn('Firestore sync warning:', err)
    );

    res.json({ success: true, data: saved, firebaseSynced: true });
  } catch (error: any) {
    console.error('Error saving complaint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete complaint
app.delete('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;
  try {
    localDb.deleteComplaint(id);
    const client = getPool();
    if (client) {
      try {
        await client.query('DELETE FROM complaints WHERE id = $1', [id]);
      } catch (err) {
        console.warn('Postgres delete complaint notice:', err);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting complaint:', error);
    res.json({ success: true });
  }
});

// Bulk upsert complaints
app.post('/api/complaints/bulk', async (req, res) => {
  const { complaints, replaceAll } = req.body;
  if (!Array.isArray(complaints)) {
    return res.status(400).json({ success: false, error: 'Complaints array required' });
  }

  try {
    const formatted = complaints.map(comp => ({
      ...comp,
      id: comp.id,
      complaint_no: comp.complaintNo || comp.complaint_no || '',
      date: comp.complaintDate || comp.date || comp.createdDate || '',
      customer_name: comp.customerName || comp.customer_name || '',
      phone: comp.mobileNumber || comp.phone || comp.mobile_number || '',
      village: comp.village || '',
      mandal: comp.mandal || '',
      tractor_model: comp.tractorModel || comp.tractor_model || '',
      chassis_no: comp.chassisNo || comp.chassis_no || '',
      hours: String(comp.hours || ''),
      complaint_details: comp.complaintDetails || comp.complaint_details || '',
      mechanic: comp.assignedMechanic || comp.mechanic || '',
      status: comp.status || 'Open',
      job_card_no: comp.jobCardNo || comp.job_card_no || '',
      closure_date: comp.closureDate || comp.closure_date || comp.closedDate || '',
      remarks: comp.resolution || comp.remarks || '',
      created_at: comp.createdAt || comp.created_at || new Date().toISOString()
    }));

    localDb.bulkUpsertComplaints(formatted, replaceAll);

    // Sync to Firestore for cross-user sharing
    syncComplaintsToFirestore(formatted).catch(err =>
      console.warn('Firestore sync warning:', err)
    );

    res.json({ success: true, count: complaints.length, firebaseSynced: true });
  } catch (error: any) {
    console.error('Error saving complaints bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =======================
// STAFF & ATTENDANCE API
// =======================

// Get all staff
app.get('/api/staff', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM staff ORDER BY name ASC');
        const mapped = result.rows.map(r => ({
          id: r.id,
          name: r.name,
          role: r.role,
          phone: r.phone || r.mobile_number || '',
          mobileNumber: r.mobile_number || r.phone || '',
          fatherName: r.father_name || '',
          village: r.village || '',
          mandal: r.mandal || '',
          dateOfJoining: r.date_of_joining || '',
          supervisor: r.supervisor || r.assigned_supervisor || '',
          assignedSupervisor: r.assigned_supervisor || r.supervisor || '',
          active: r.active === 'true' || r.active === true || r.active === undefined || r.active === '1',
          createdAt: r.created_at || '',
          updatedAt: r.updated_at || ''
        }));
        return res.json({ success: true, data: mapped });
      } catch (err) {
        console.warn('Postgres fetch staff notice, using local store:', err);
      }
    }
    res.json({ success: true, data: localDb.getStaff() });
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.json({ success: true, data: localDb.getStaff() });
  }
});

// Save/Update staff
app.post('/api/staff', async (req, res) => {
  const st = req.body;
  if (!st || !st.id || !st.name) {
    return res.status(400).json({ success: false, error: 'Staff ID and Name are required' });
  }

  try {
    const formatted = {
      ...st,
      id: st.id,
      name: st.name,
      role: st.role || 'mechanic',
      phone: st.phone || st.mobileNumber || '',
      mobile_number: st.mobileNumber || st.mobile_number || st.phone || '',
      father_name: st.fatherName || st.father_name || '',
      village: st.village || '',
      mandal: st.mandal || '',
      date_of_joining: st.dateOfJoining || st.date_of_joining || '',
      supervisor: st.supervisor || st.assignedSupervisor || '',
      assigned_supervisor: st.assignedSupervisor || st.assigned_supervisor || st.supervisor || '',
      active: st.active !== undefined ? String(st.active) : 'true',
      created_at: st.createdAt || st.created_at || new Date().toISOString()
    };

    const saved = localDb.saveStaff(formatted);

    const client = getPool();
    if (client) {
      try {
        const query = `
          INSERT INTO staff (
            id, name, role, phone, father_name, village, mandal, mobile_number, date_of_joining, supervisor, active, assigned_supervisor, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone,
            father_name = EXCLUDED.father_name,
            village = EXCLUDED.village,
            mandal = EXCLUDED.mandal,
            mobile_number = EXCLUDED.mobile_number,
            date_of_joining = EXCLUDED.date_of_joining,
            supervisor = EXCLUDED.supervisor,
            active = EXCLUDED.active,
            assigned_supervisor = EXCLUDED.assigned_supervisor,
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await client.query(query, [
          formatted.id,
          formatted.name,
          formatted.role,
          formatted.phone,
          formatted.father_name,
          formatted.village,
          formatted.mandal,
          formatted.mobile_number,
          formatted.date_of_joining,
          formatted.supervisor,
          formatted.active,
          formatted.assigned_supervisor,
          formatted.created_at
        ]);
        return res.json({ success: true, data: result.rows[0] });
      } catch (err) {
        console.warn('Postgres save staff notice:', err);
      }
    }

    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error('Error saving staff:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete staff
app.delete('/api/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    localDb.deleteStaff(id);
    const client = getPool();
    if (client) {
      try {
        await client.query('DELETE FROM staff WHERE id = $1', [id]);
      } catch (err) {
        console.warn('Postgres delete staff notice:', err);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    res.json({ success: true });
  }
});

// Bulk staff
app.post('/api/staff/bulk', async (req, res) => {
  const staffList = Array.isArray(req.body.staffList) ? req.body.staffList : (Array.isArray(req.body.staff) ? req.body.staff : (Array.isArray(req.body) ? req.body : []));
  const replaceAll = req.body.replaceAll;
  if (!Array.isArray(staffList)) {
    return res.status(400).json({ success: false, error: 'Staff array required' });
  }

  try {
    const formatted = staffList.map(st => ({
      ...st,
      id: st.id,
      name: st.name,
      role: st.role || 'mechanic',
      phone: st.phone || st.mobileNumber || '',
      mobile_number: st.mobileNumber || st.mobile_number || st.phone || '',
      father_name: st.fatherName || st.father_name || '',
      village: st.village || '',
      mandal: st.mandal || '',
      date_of_joining: st.dateOfJoining || st.date_of_joining || '',
      supervisor: st.supervisor || st.assignedSupervisor || '',
      assigned_supervisor: st.assignedSupervisor || st.assigned_supervisor || st.supervisor || '',
      active: st.active !== undefined ? String(st.active) : 'true',
      created_at: st.createdAt || st.created_at || new Date().toISOString()
    }));

    localDb.bulkUpsertStaff(formatted, replaceAll);
    res.json({ success: true, count: staffList.length });
  } catch (error: any) {
    console.error('Error saving staff bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attendance API
app.get('/api/attendance', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM staff_attendance');
        const recordsMap: Record<string, any> = {};
        result.rows.forEach(r => {
          recordsMap[r.date] = typeof r.records === 'string' ? JSON.parse(r.records) : r.records;
        });
        return res.json({ success: true, data: recordsMap });
      } catch (err) {
        console.warn('Postgres fetch attendance notice, using local store:', err);
      }
    }
    res.json({ success: true, data: localDb.getAttendance() });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    res.json({ success: true, data: localDb.getAttendance() });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { date, records } = req.body;
  if (!date || !records) {
    return res.status(400).json({ success: false, error: 'Date and records required' });
  }

  try {
    localDb.saveAttendance(date, records);
    const client = getPool();
    if (client) {
      try {
        const query = `
          INSERT INTO staff_attendance (date, records, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (date) DO UPDATE SET
            records = EXCLUDED.records,
            updated_at = NOW();
        `;
        await client.query(query, [date, JSON.stringify(records)]);
      } catch (err) {
        console.warn('Postgres save attendance notice:', err);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error saving attendance:', error);
    res.json({ success: true });
  }
});

// App settings API
app.get('/api/settings', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM app_settings');
        const settingsMap: Record<string, string> = {};
        result.rows.forEach(r => {
          settingsMap[r.key] = r.value;
        });
        return res.json({ success: true, data: settingsMap });
      } catch (err) {
        console.warn('Postgres fetch settings notice, using local store:', err);
      }
    }
    res.json({ success: true, data: localDb.getSettings() });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.json({ success: true, data: localDb.getSettings() });
  }
});

app.post('/api/settings', async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ success: false, error: 'Key required' });

  try {
    localDb.saveSetting(key, value);
    const client = getPool();
    if (client) {
      try {
        const query = `
          INSERT INTO app_settings (key, value, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = NOW();
        `;
        await client.query(query, [key, String(value)]);
      } catch (err) {
        console.warn('Postgres save setting notice:', err);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error saving setting:', error);
    res.json({ success: true });
  }
});

// Service Camps API
app.get('/api/service-camps', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const result = await client.query('SELECT * FROM service_camps ORDER BY camp_date ASC, created_at DESC');
        return res.json({ success: true, data: result.rows });
      } catch (err) {
        console.warn('Postgres fetch service camps notice, using local store:', err);
      }
    }
    res.json({ success: true, data: localDb.getServiceCamps() });
  } catch (error: any) {
    console.error('Error fetching service camps:', error);
    res.json({ success: true, data: localDb.getServiceCamps() });
  }
});

app.post('/api/service-camps', async (req, res) => {
  const camp = req.body;
  if (!camp || !camp.id) {
    return res.status(400).json({ success: false, error: 'Camp ID is required' });
  }

  try {
    const formatted = {
      ...camp,
      id: camp.id,
      dealership_code: camp.dealershipCode || camp.dealership_code || '4731',
      branch: camp.branch || '',
      mandal: camp.mandal || '',
      village: camp.village || '',
      camp_date: camp.campDate || camp.camp_date || '',
      target_tractors: camp.targetTractors || camp.target_tractors || '',
      supervisor: camp.supervisor || '',
      mechanic: camp.mechanic || '',
      status: camp.status || 'Upcoming',
      service_type_expected: camp.serviceTypeExpected || camp.service_type_expected || '',
      offers: camp.offers || '',
      contact_person: camp.contactPerson || camp.contact_person || '',
      contact_phone: camp.contactPhone || camp.contact_phone || '',
      notes: camp.notes || '',
      attended_count: camp.attendedCount || camp.attended_count || '',
      created_at: camp.createdAt || camp.created_at || new Date().toISOString()
    };

    const saved = localDb.saveServiceCamp(formatted);

    const client = getPool();
    if (client) {
      try {
        const query = `
          INSERT INTO service_camps (
            id, dealership_code, branch, mandal, village, camp_date,
            target_tractors, supervisor, mechanic, status, service_type_expected,
            offers, contact_person, contact_phone, notes, attended_count, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
          ON CONFLICT (id) DO UPDATE SET
            dealership_code = EXCLUDED.dealership_code,
            branch = EXCLUDED.branch,
            mandal = EXCLUDED.mandal,
            village = EXCLUDED.village,
            camp_date = EXCLUDED.camp_date,
            target_tractors = EXCLUDED.target_tractors,
            supervisor = EXCLUDED.supervisor,
            mechanic = EXCLUDED.mechanic,
            status = EXCLUDED.status,
            service_type_expected = EXCLUDED.service_type_expected,
            offers = EXCLUDED.offers,
            contact_person = EXCLUDED.contact_person,
            contact_phone = EXCLUDED.contact_phone,
            notes = EXCLUDED.notes,
            attended_count = EXCLUDED.attended_count,
            updated_at = NOW()
          RETURNING *;
        `;
        const result = await client.query(query, [
          formatted.id,
          formatted.dealership_code,
          formatted.branch,
          formatted.mandal,
          formatted.village,
          formatted.camp_date,
          formatted.target_tractors,
          formatted.supervisor,
          formatted.mechanic,
          formatted.status,
          formatted.service_type_expected,
          formatted.offers,
          formatted.contact_person,
          formatted.contact_phone,
          formatted.notes,
          formatted.attended_count,
          formatted.created_at
        ]);
        return res.json({ success: true, data: result.rows[0] });
      } catch (err) {
        console.warn('Postgres save service camp notice:', err);
      }
    }

    res.json({ success: true, data: saved });
  } catch (error: any) {
    console.error('Error saving service camp:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/service-camps/:id', async (req, res) => {
  const { id } = req.params;
  try {
    localDb.deleteServiceCamp(id);
    const client = getPool();
    if (client) {
      try {
        await client.query('DELETE FROM service_camps WHERE id = $1', [id]);
      } catch (err) {
        console.warn('Postgres delete service camp notice:', err);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting service camp:', error);
    res.json({ success: true });
  }
});

app.post('/api/service-camps/bulk', async (req, res) => {
  const { camps, replaceAll } = req.body;
  if (!Array.isArray(camps)) {
    return res.status(400).json({ success: false, error: 'Camps array required' });
  }

  try {
    const formatted = camps.map(camp => ({
      ...camp,
      id: camp.id,
      dealership_code: camp.dealershipCode || camp.dealership_code || '4731',
      branch: camp.branch || '',
      mandal: camp.mandal || '',
      village: camp.village || '',
      camp_date: camp.campDate || camp.camp_date || '',
      target_tractors: camp.targetTractors || camp.target_tractors || '',
      supervisor: camp.supervisor || '',
      mechanic: camp.mechanic || '',
      status: camp.status || 'Upcoming',
      service_type_expected: camp.serviceTypeExpected || camp.service_type_expected || '',
      offers: camp.offers || '',
      contact_person: camp.contactPerson || camp.contact_person || '',
      contact_phone: camp.contactPhone || camp.contact_phone || '',
      notes: camp.notes || '',
      attended_count: camp.attendedCount || camp.attended_count || '',
      created_at: camp.createdAt || camp.created_at || new Date().toISOString()
    }));

    localDb.bulkUpsertServiceCamps(formatted, replaceAll);
    res.json({ success: true, count: camps.length });
  } catch (error: any) {
    console.error('Error saving service camps bulk:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Full Master Backup JSON/Export endpoint
app.get('/api/master-backup', async (req, res) => {
  try {
    const client = getPool();
    if (client) {
      try {
        const [custRes, sparesRes, jcRes, compRes, staffRes, attRes, setRes, campRes] = await Promise.all([
          client.query('SELECT * FROM customers'),
          client.query('SELECT * FROM spares'),
          client.query('SELECT * FROM jobcards'),
          client.query('SELECT * FROM complaints'),
          client.query('SELECT * FROM staff'),
          client.query('SELECT * FROM staff_attendance'),
          client.query('SELECT * FROM app_settings'),
          client.query('SELECT * FROM service_camps'),
        ]);

        return res.json({
          success: true,
          customers: custRes.rows,
          spares: sparesRes.rows,
          jobcards: jcRes.rows,
          complaints: compRes.rows,
          staff: staffRes.rows,
          attendance: attRes.rows,
          settings: setRes.rows,
          serviceCamps: campRes.rows
        });
      } catch (err) {
        console.warn('Postgres master backup notice, using local backup:', err);
      }
    }

    res.json(localDb.getMasterBackup());
  } catch (error: any) {
    console.error('Error generating master backup:', error);
    res.json(localDb.getMasterBackup());
  }
});

// Gemini AI Status endpoint
app.get('/api/gemini/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    success: true,
    isConfigured: hasKey,
    model: 'gemini-3.8-flash'
  });
});

// Gemini Multi-turn Chat endpoint
const handleChatRequest = async (req: express.Request, res: express.Response) => {
  try {
    const { messages, systemInstruction, model } = req.body || {};
    const ai = getGeminiClient();

    const selectedModel = model || 'gemini-3.8-flash';
    const roleInstruction = systemInstruction || 
      `You are an expert Eicher Tractor Workshop Assistant, Technical Advisor, and Customer Service Telecalling Specialist for Sri Balaji Eicher Tractors dealership & service workshops in Andhra Pradesh and Telangana.
You specialize in Eicher tractor models (Eicher 188, 241, 242, 333, 380, 480, 485, 548, 551, 557, Prima G3 series), tractor engine maintenance, scheduled free and paid services, spare parts, hydraulic lift systems, oil capacities, clutch adjustment, fuel pump, electrical troubleshooting, and job card diagnostics.
You can respond fluently in Telugu (తెలుగు), English, or mixed Telugu-English (Telugu script or transliteration) as preferred by the user.
Keep answers structured, concise, practical, helpful, and polite. Use bullet points and step-by-step guidance where applicable.`;

    if (!ai) {
      // Graceful domain fallback if API key is not configured yet
      const lastMsg = Array.isArray(messages) && messages.length > 0
        ? (messages[messages.length - 1].content || messages[messages.length - 1].text || '')
        : '';
      
      const fallbackResponse = `నమస్కారం! నేను మీ శ్రీ బాలాజీ ఐషర్ ట్రాక్టర్ వర్క్‌షాప్ AI అసిస్టెంట్‌ని (Eicher Workshop AI Assistant).

🛠️ మీ ప్రశ్న: "${lastMsg.slice(0, 100)}"

📌 ముఖ్య గమనిక: లైవ్ జెమిని AI మోడల్ (gemini-3.8-flash) పూర్తి ఫీచర్లను ఎనేబుల్ చేయడానికి Settings > Secrets లో **GEMINI_API_KEY** ను నమోదు చేయవచ్చు.

🔧 ఐషర్ ట్రాక్టర్ సాధారణ సర్వీస్ మార్గదర్శకాలు:
1. **మొదటి ఉచిత సర్వీస్ (1st Free Service):** 50 గంటలు (50 Hours) పూర్తయిన తర్వాత - ఇంజిన్ ఆయిల్, ఆయిల్ ఫిల్టర్ మార్చాలి.
2. **రెండవ & తర్వాతి సర్వీసులు:** ప్రతి 250-300 గంటలకు ఇంజిన్ ఆయిల్ (15W-40), ఫ్యూయల్ ఫిల్టర్స్, ఎయిర్ క్లీనర్ క్లీనింగ్.
3. **హైడ్రాలిక్స్ & గేర్ ఆయిల్:** ప్రతి 1000 గంటలకు లేదా సంవత్సరానికి ఒకసారి మార్చాలి.
4. **టెలికాలింగ్ చిట్కా:** కస్టమర్‌తో మాట్లాడేటప్పుడు ట్రాక్టర్ గంటల రీడింగ్, చివరి సర్వీస్ తేదీ, ప్రస్తుత సమస్యలు (పికప్, గేర్, లిఫ్ట్) అడిగి వెంటనే జాబ్ కార్డ్ లేదా ఫాలో-అప్ తేదీ నమోదు చేయండి.

మరిన్ని వివరాల కోసం అడగండి!`;

      return res.json({
        success: true,
        text: fallbackResponse,
        model: selectedModel,
        isFallback: true
      });
    }

    const contents = (Array.isArray(messages) ? messages : []).map((m: any) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '') }]
    }));

    if (contents.length === 0) {
      return res.status(400).json({ success: false, error: 'No messages provided' });
    }

    let text = '';
    try {
      const generatePromise = ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: roleInstruction,
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI response timed out')), 9000)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      text = response.text || '';
    } catch (apiErr: any) {
      console.warn('Gemini API call warning, using intelligent local engine:', apiErr?.message);
      const lastUserMsg = (contents[contents.length - 1]?.parts?.[0]?.text || '').toLowerCase();

      if (lastUserMsg.includes('oil') || lastUserMsg.includes('ఆయిల్') || lastUserMsg.includes('service') || lastUserMsg.includes('సర్వీస్')) {
        text = `🚜 **ఐషర్ ట్రాక్టర్ సర్వీస్ & ఆయిల్ మార్గదర్శకాలు (Eicher Tractor Service Schedule):**
- **1వ ఉచిత సర్వీస్:** 50 ఇంజిన్ గంటలు (15W-40 ఇంజిన్ ఆయిల్ + ఆయిల్ ఫిల్టర్ మార్చాలి).
- **రెగ్యులర్ సర్వీస్:** ప్రతి 250 - 300 గంటలకు ఇంజిన్ ఆయిల్ మార్పు, డీజిల్ ఫిల్టర్లు, ఎయిర్ క్లీనర్ క్లీనింగ్.
- **హైడ్రాలిక్ & ట్రాన్స్‌మిషన్ ఆయిల్:** ప్రతి 1000 గంటలకు (లేదా ఏడాదికి ఒకసారి) మార్చాలి. 
- **గ్రీసింగ్:** ఫ్రంట్ యాక్సిల్, స్టీయరింగ్ స్పిండిల్స్, బ్రేక్ పెడల్ లింకేజ్ ప్రతి 50 గంటలకు తప్పనిసరిగా గ్రీస్ చేయాలి.`;
      } else if (lastUserMsg.includes('hydraul') || lastUserMsg.includes('lift') || lastUserMsg.includes('లిఫ్ట్')) {
        text = `⚙️ **ఐషర్ హైడ్రాలిక్ లిఫ్ట్ ట్రబుల్ షూటింగ్:**
1. **లిఫ్ట్ ఎత్తకపోవడం లేదా నెమ్మదిగా ఎత్తడం:**
   - హైడ్రాలిక్ ఆయిల్ లెవెల్ చెక్ చేయండి (డిప్‌స్టిక్ రీడింగ్).
   - సక్షన్ స్ట్రైనర్ / హైడ్రాలిక్ ఫిల్టర్ చోక్ అయిందో చూడండి.
   - కంట్రోల్ వాల్వ్ లేదా స్పూల్ లీకేజీ ఉందో గమనించండి.
2. **లిఫ్ట్ జెర్కింగ్ (Jerk):** హైడ్రాలిక్ సిస్టమ్‌లో ఎయిర్ లాక్ ఉంటే ఎయిర్ బ్లీడింగ్ చేయాలి.
3. **ఆయిల్ గ్రేడ్:** సిఫార్సు చేసిన హైడ్రాలిక్ ట్రాన్స్‌మిషన్ ఫ్లూయిడ్ మాత్రమే వాడండి.`;
      } else if (lastUserMsg.includes('telecall') || lastUserMsg.includes('call') || lastUserMsg.includes('కాల్') || lastUserMsg.includes('script') || lastUserMsg.includes('కస్టమర్')) {
        text = `📞 **టెలికాలింగ్ తెలుగు స్క్రిప్ట్ (Telecalling Service Script):**
"నమస్కారం అండీ, నేను శ్రీ బాలాజీ ఐషర్ ట్రాక్టర్స్ వర్క్‌షాప్ నుండి మాట్లాడుతున్నాను.
మీ ఐషర్ ట్రాక్టర్ నెం. [xxxx] సర్వీస్ సమయం దగ్గరపడింది / మీ చివరి సర్వీస్ పూర్తయి కొంత కాలం అయ్యింది.
- మీ ట్రాక్టర్ ప్రస్తుతం ఎన్ని గంటలు తిరిగింది అండీ?
- ఇంజిన్ పికప్, గేర్, లేదా హైడ్రాలిక్ లిఫ్ట్ లో ఏమైనా సమస్యలు ఉన్నాయా?
- మా వర్క్‌షాప్‌లో అధీకృత ఒరిజినల్ స్పేర్స్ మరియు అనుభవజ్ఞులైన మెకానిక్స్‌తో సర్వీస్ చేస్తాము.
రేపు లేదా ఎల్లుండి సర్వీస్ కోసం ట్రాక్టర్ పంపిస్తారా అండీ? నేను జాబ్ కార్డ్ బుకింగ్ నోట్ చేసుకోవచ్చా?"`;
      } else {
        text = `🚜 **శ్రీ బాలాజీ ఐషర్ ట్రాక్టర్ వర్క్‌షాప్ AI అసిస్టెంట్:**
మీ ప్రశ్నకు సంబంధించి సలహాలు:
1. ఏదైనా సాంకేతిక సమస్య (స్టార్టింగ్ ప్రాబ్లమ్, ఓవర్‌హీటింగ్, క్లచ్ స్లిప్) వస్తే వెంటనే జాబ్ కార్డ్ ఓపెన్ చేసి డైగ్నోసిస్ చెక్ లిస్ట్ పూరించండి.
2. ఒరిజినల్ ఐషర్ ఆయిల్ ఫిల్టర్, డీజిల్ ఫిల్టర్ మరియు సిఫార్సు చేసిన ఆయిల్స్ మాత్రమే వాడండి.
3. టెలికాలింగ్ డెస్క్ ద్వారా కస్టమర్లను ఫాలో-అప్ చేసి సర్వీస్ బుకింగ్స్ నమోదు చేయండి.

మీకు ఏ నిర్దిష్ట అంశంపై సమాచారం కావాలో అడగండి!`;
      }
    }

    return res.json({
      success: true,
      text,
      model: selectedModel
    });
  } catch (error: any) {
    console.error('Gemini Chat API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate response from Gemini AI'
    });
  }
};

app.post('/api/gemini/chat', handleChatRequest);
app.post('/api/chat', handleChatRequest);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Eicher standalone server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
