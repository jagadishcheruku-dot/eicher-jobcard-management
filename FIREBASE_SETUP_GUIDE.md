# Firebase Firestore Setup Guide

## Overview
The Eicher Job Card Management app uses Firebase Firestore to share data across all users without requiring logins.

## Status
✅ Database ID fixed to use the correct Firestore database
✅ Firebase SDK integrated on frontend
⏳ Security Rules need to be configured (this is what you need to do)

## Steps to Enable Live Data Sharing

### 1. Set Up Firestore Security Rules
The data won't sync until you allow unauthenticated access in Firestore.

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `eicher-jobcard-management`
3. Go to **Firestore Database** → **Rules** tab
4. Replace the existing rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read/write all data
    // WARNING: This opens the database to public read/write
    // For production, implement proper access controls
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

### 2. Verify Firebase Configuration
The app is configured to use:
- **Project ID**: eicher-jobcard-management
- **Database**: Default Firestore database
- **API Key**: AIzaSyBcMIcHLwydy-Nyzt3RA-zUyUhdkzfSRo

### 3. Test Data Sync
1. Open the app at: https://eicher-jobcard-management-git-claude-eicher-j-e0e1bf-jagadeesh8.vercel.app
2. Add a new customer or job card
3. Open the app in another browser/device
4. You should see the same data

### How It Works
- **Frontend**: React app automatically syncs data to Firestore when you save
- **Backend**: Express server uses local storage as fallback
- **Firestore**: Cloud database stores all data persistently
- **Share**: Anyone with the app link sees the same live data

## Important Notes
⚠️ **Security Warning**: The rules above allow PUBLIC read/write to all data. This is suitable for internal use but NOT for production with sensitive data.

For production:
- Implement proper authentication
- Use more restrictive security rules
- Consider data encryption
- Add audit logging

## Troubleshooting

### Data not syncing?
1. Check browser console for errors (F12 → Console tab)
2. Verify Firestore Security Rules are published
3. Check Firebase project name matches configuration

### App shows old data?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try a hard refresh (Ctrl+F5)
3. Check if Firestore has the new data in Firebase Console

### Multiple devices seeing different data?
1. Wait a few seconds for Firestore to sync
2. Refresh the page
3. Check Firestore console to verify data is being saved

## API Endpoints
- GET `/api/customers` - Fetch all customers
- POST `/api/customers` - Add/update customer
- GET `/api/jobcards` - Fetch all job cards
- POST `/api/jobcards` - Add/update job card
- GET `/api/complaints` - Fetch all complaints
- POST `/api/complaints` - Add/update complaint
