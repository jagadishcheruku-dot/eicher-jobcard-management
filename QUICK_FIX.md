# ⚡ QUICK FIX FOR DATA SHARING

## Problem
Upload data → Others can't see it when you share the link

## Solution (3 steps)

### 1️⃣ Go to Firebase Console
https://console.firebase.google.com → Click `eicher-jobcard-management`

### 2️⃣ Go to Firestore Rules
Left sidebar → **Build** → **Firestore Database** → Click **Rules** tab

### 3️⃣ Click PUBLISH Button
Top right → Blue **PUBLISH** button → Wait for green "Published successfully"

---

## ✅ Test It Works

**Computer 1**: Upload Excel → See "✅ Synced" in console (F12)

**Computer 2**: Open same link → See "✅ Loaded" in console + data appears

---

## 🎯 Done! Data sharing now works 🎉

See full guide: `FIRESTORE_RULES_SETUP.md`
