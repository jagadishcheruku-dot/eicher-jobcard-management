const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, writeBatch, collection, getDocs } = require('firebase/firestore');
const cfg = require(path.join(__dirname, '..', 'firebase-applet-config.json'));

const app = initializeApp({
  apiKey: cfg.apiKey,
  authDomain: cfg.authDomain,
  projectId: cfg.projectId,
});

const db = getFirestore(app, cfg.firestoreDatabaseId);

async function runSync() {
  console.log('Starting full database synchronization to Firestore...');
  const dbFilePath = path.join(__dirname, '..', 'data', 'eicher_db.json');
  if (!fs.existsSync(dbFilePath)) {
    console.error('Database file not found:', dbFilePath);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  const jobcards = rawData.jobcards || [];
  const customers = rawData.customers || [];
  const spares = rawData.spares || [];

  console.log(`Found: ${jobcards.length} jobcards, ${customers.length} customers, ${spares.length} spares.`);

  // 1. Upload Jobcards in batches of 400
  console.log('Syncing Jobcards to Firestore collection "jobcards"...');
  const BATCH_SIZE = 400;
  for (let i = 0; i < jobcards.length; i += BATCH_SIZE) {
    const chunk = jobcards.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const jc of chunk) {
      const docId = String(jc.id || jc.job_no || jc.jobNo || `jc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      // Sanitize undefined fields
      const cleanData = {};
      for (const [k, v] of Object.entries(jc)) {
        if (v !== undefined) cleanData[k] = v;
      }
      cleanData.id = docId;
      const ref = doc(db, 'jobcards', docId);
      batch.set(ref, cleanData, { merge: true });
    }
    await batch.commit();
    console.log(`Synced jobcards ${i + 1} to ${Math.min(i + BATCH_SIZE, jobcards.length)}`);
  }

  // 2. Upload Customers in chunked documents to "customers_master"
  console.log('Syncing Customers to Firestore collection "customers_master"...');
  const CHUNK_SIZE = 250;
  const numChunks = Math.ceil(customers.length / CHUNK_SIZE);
  for (let i = 0; i < numChunks; i++) {
    const chunkRows = customers.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const ref = doc(db, 'customers_master', `chunk_${i}`);
    await setDoc(ref, {
      chunkIndex: i,
      totalChunks: numChunks,
      rows: chunkRows,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Synced customer chunk ${i + 1}/${numChunks} (${chunkRows.length} records)`);
  }

  // 3. Upload Spares to "spares_master"
  if (spares.length > 0) {
    console.log('Syncing Spares to Firestore collection "spares_master"...');
    const ref = doc(db, 'spares_master', 'chunk_0');
    await setDoc(ref, {
      chunkIndex: 0,
      totalChunks: 1,
      rows: spares,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  // 4. Check results
  const snapJc = await getDocs(collection(db, 'jobcards'));
  console.log(`VERIFICATION: Firestore now has ${snapJc.size} jobcard documents!`);
  console.log('Synchronization complete!');
  process.exit(0);
}

runSync().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
