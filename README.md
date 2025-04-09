# JUNO 🌿

**JUNO** is a cross-platform fitness tracking app designed for users who want to live healthier without obsessing over details. Built with modern tools, JUNO lets you log meals, track workouts, and monitor hydration on both web and mobile—all synced through Firebase.

---

## 📱 Mobile & Web Versions

JUNO is built with **two platforms**, sharing the same backend:

| Platform | Folder   | Stack Used                  |
|----------|----------|-----------------------------|
| Web      | `web/`   | React, TypeScript, Vite     |
| Mobile   | `mobile/`| React Native, Expo          |

Both versions connect to a shared Firebase backend for real-time sync and data consistency.

---

## ✨ Features

- 🍽️ **Log Meals** – Manually or via API (Spoonacular)
- 🏋️ **Track Exercises** – Duration, intensity, progress photos
- 💧 **Hydration Tracker** – Simple water logging
- 🔄 **Sync Across Devices** – Data tied to your account in Firebase
- ⚡ **Sleek UI** – Optimized layouts for both mobile & web

---

## 🛠️ Tech Stack

- **Frontend (Web):** React + TypeScript + Vite
- **Frontend (Mobile):** React Native + Expo
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **APIs:** Spoonacular (for nutrition estimates)

---

## 📁 Folder Structure

```
juno-master/
├── mobile/               # Expo mobile version
├── web/                  # Vite web version
├── .expo/                # Expo dev settings
└── README.md             # You're reading it!
```

---

## 🧪 Running the App

### Web Version

```bash
cd web
npm install
npm run dev
```

Access at: `http://localhost:5173`

### Mobile Version (Expo)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code in the terminal with Expo Go.

---

## 🚀 Firebase Deployment (Web)

```bash
cd web
npm run build
firebase deploy
```

---

## 🙌 Credits

Built by [Your Name] using modern tech to make healthy living more accessible.

---

## 📄 License

[MIT License](LICENSE)