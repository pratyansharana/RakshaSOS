# 🛡️ RakshaSOS — Personal Safety & Emergency Response System

<div align="center">

![RakshaSOS Banner](https://img.shields.io/badge/RakshaSOS-Emergency%20Response%20Platform-ac2b2e?style=for-the-badge&logo=shield&logoColor=white)

[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

**A full-stack emergency response platform for India — mobile app for citizens + web dashboards for Police & Hospitals.**

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Architecture Overview](#-architecture-overview)
- [Features](#-features)
  - [📱 Mobile App (Android/iOS)](#-mobile-app-androidios)
  - [🌐 Web Dashboard](#-web-dashboard)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [Mobile App Setup](#mobile-app-setup)
  - [Web Dashboard Setup](#web-dashboard-setup)
- [Environment Variables & API Keys](#-environment-variables--api-keys)
  - [Mobile App `.env.local`](#mobile-app-envlocal)
  - [Web Dashboard `.env`](#web-dashboard-env)
  - [Firebase Configuration](#firebase-configuration)
- [Running the Apps](#-running-the-apps)
  - [Run Mobile App](#run-mobile-app)
  - [Run Web Dashboard](#run-web-dashboard)
- [API Key Acquisition Guide](#-api-key-acquisition-guide)
- [Screen-by-Screen Breakdown](#-screen-by-screen-breakdown)
- [Firebase Firestore Schema](#-firebase-firestore-schema)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 About the Project

**RakshaSOS** is a comprehensive personal safety and emergency response ecosystem designed for India. It connects citizens, hospitals, and police into a single real-time network. When a user triggers an SOS, the relevant authorities are instantly notified with the victim's GPS location, medical profile, and evidence — enabling the fastest possible response.

> **"When seconds matter, RakshaSOS responds."**

---

## 🏗️ Architecture Overview

```
RakshaSOS/
├── Apps/
│   ├── Android/RakshaSOS/   ← Expo React Native Mobile App (Citizen-facing)
│   ├── Web/                 ← Vite + React Web Dashboard (Police & Hospital)
│   └── backend/             ← Backend services (optional cloud functions)
└── README.md
```

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CITIZEN MOBILE APP                           │
│   SOS Trigger ──► Firebase Firestore ──► Web Dashboard (Police/     │
│   AI Guide    ──► Groq API                           Hospitals)     │
│   Live Map    ──► Google Maps Places API                            │
│   Voice Chat  ──► expo-speech + Camera                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 📱 Mobile App (Android/iOS)

#### 🆘 SOS Alert System
- **One-tap SOS trigger** with 4 response types: Police, Hospital, Guardians, Fire
- Automatically captures **live GPS coordinates** (lat, lng, accuracy, altitude, speed, heading)
- Bundles the victim's full **medical profile snapshot** (blood group, allergies, chronic conditions, emergency doctor info, insurance details)
- Uploads **incident evidence** (photo + audio recording) to Firebase Storage before alert dispatch
- **Real-time SOS status tracking** — users see when their alert is `triggered → accepted → en_route → arrived`
- Slide-to-cancel mechanism to prevent accidental triggers
- Notifies all registered **emergency contacts** automatically on SOS dispatch

#### 🗺️ Raksha Safe Map
- Live **Google Maps** integration centered on the user's real GPS location (no hardcoded defaults)
- Displays nearby **hospitals and police stations** fetched from Google Places API, sorted by distance
- **Graceful offline fallback** — if the Google API fails, auto-generated nearby markers are displayed
- Interactive **Community Incident Pins** — users can drop reports for unsafe zones (poor lighting, checkpoints)
- Report modal with incident type selection and description
- Filter bar for **All / Hospitals / Police** views
- Tap any marker to view name, address, and distance; navigate via Google Maps

#### 🏥 Nearby Hospitals Screen
- Fetches real trauma centers from **Google Places API** using live device coordinates
- Sorted in **ascending order** by actual calculated distance using the Haversine formula
- Shows ETA estimate, hospital type (Trauma/ICU/General), operational status (Open/Busy/Emergency Only)
- **"Call Hospital"** button opens the native phone dialpad directly via `Linking.openURL('tel:...')`
- **"Get Route"** button launches Google Maps turn-by-turn navigation
- Quick Dispatch button to call for nearest ambulance
- **Search and filter** hospitals by name, address, or type

#### 🤖 AI Guide (Emergency First Aid)
- **5 pre-loaded emergency categories** rendered in a live scrollable list:
  - 🩸 Bleeding Control
  - 🦴 Fracture Stabilization
  - 😵 Unconscious Positioning
  - 🔥 Burns Treatment
  - ❤️ CPR Protocol
- Selecting a category opens the **Voice Guidance Player** with:
  - **Text-to-Speech (TTS)** — automatically reads instructions aloud via `expo-speech`
  - Interactive Play/Pause/Stop controls
  - Step-by-step instruction cards (Step X of Y with category label)
  - Visual audio waveform indicator

#### 💬 AI Medical Chatbot
- Powered by **Groq API** (Llama 3.3-70b-versatile model)
- Contextual safety guidance from a trained system prompt
- Conversation history with 8-message sliding context window
- Suggestion chips for common emergency questions
- `KeyboardAvoidingView` — input bar sticks above the system keyboard on all platforms

#### 📸 Live Camera Analysis (Gemini Live Mode)
- Tap the **camera icon** in the chat to start a live first-aid session
- Full-screen `CameraView` modal with real-time frame capture
- Sends contextual prompts to Groq AI every 7 seconds describing the emergency
- Responses are displayed on screen **and spoken aloud** via TTS simultaneously
- **Offline fallback** — if connectivity drops, local pre-treatment text plays via TTS without crashing

#### 📞 Emergency Calls
- Pre-loaded directory of national emergency numbers (Police — 100, Ambulance — 108, Fire — 101, Women Helpline — 1091, etc.)
- Tapping **"Call"** on any contact directly opens the native phone dialpad with the number pre-filled

#### 👩 Women Safety Module
- Dedicated safety screen with specific resources for women in distress
- Quick-access to women-specific helpline numbers

#### 🎙️ Voice SOS
- Hands-free SOS trigger via voice detection

#### 👤 User Profile & Onboarding
- Language selection screen supporting multiple regional languages
- Tutorial walkthrough for first-time users
- Essential Details form (name, phone, address, gender, blood group, emergency contacts)
- Medical profile entry (allergies, chronic conditions, insurance, emergency doctor)
- Firebase Authentication (Email/Password) with persistent login sessions
- First-time users are routed to Sign Up; returning users skip directly to the Home Screen

---

### 🌐 Web Dashboard

#### 🚔 Police Dashboard
- Real-time SOS alert feed from Firebase Firestore
- View incoming alerts with victim name, GPS coordinates, incident type, and status
- Interactive map showing alert locations (Leaflet + React-Leaflet)
- Update alert status (Acknowledge, Dispatch, Resolve)
- View full victim profile and emergency contact details

#### 🏥 Hospital Dashboard
- Live feed of hospital-directed SOS alerts (type: `hospital`)
- Accept/reject incoming alerts and dispatch ambulances
- Set and update ambulance ETA and live tracking coordinates
- View victim's medical profile snapshot including blood group, allergies, and chronic conditions

#### 🚑 Ambulance Logistics
- Track and manage active ambulance dispatch records
- Update ambulance lat/lng in real-time for victim-side tracking

#### 📋 Incident Logs
- Full historical log of all SOS alerts with timestamps and resolution status
- Searchable and filterable by date, type, and status

#### 👮 Police Profile & Hospital Profile
- Manage station/hospital registration details
- View assigned officer/staff information

#### 🔐 Authentication
- Separate login/signup flows for Police and Hospitals
- Firebase Authentication integrated with role-based access

---

## 🛠️ Tech Stack

| Layer | Mobile App | Web Dashboard |
|---|---|---|
| **Framework** | React Native 0.81 + Expo SDK 54 | React 19 + Vite 8 |
| **Language** | TypeScript 5.9 | TypeScript 6 |
| **Navigation** | React Navigation 7 (Stack + Bottom Tabs) | React Router DOM 7 |
| **Auth** | Firebase Auth 12 | Firebase Auth 12 |
| **Database** | Firebase Firestore | Firebase Firestore |
| **Storage** | Firebase Storage | — |
| **Maps** | react-native-maps + Google Places API | Leaflet / React-Leaflet |
| **AI / LLM** | Groq API (Llama 3.3-70b-versatile) | — |
| **TTS** | expo-speech | — |
| **Camera** | expo-camera | — |
| **Location** | expo-location | — |
| **Icons** | lucide-react-native | lucide-react + react-icons |
| **Notifications** | — | react-hot-toast |
| **Styling** | StyleSheet (React Native) | Vanilla CSS |

---

## 📁 Project Structure

```
RakshaSOS/
├── Apps/
│   ├── Android/RakshaSOS/              # 📱 Mobile App
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── firebaseconfig.ts   # Firebase initialization
│   │   │   ├── context/                # React context providers
│   │   │   ├── navigation/
│   │   │   │   ├── AppNavigator.tsx    # Stack navigator
│   │   │   │   └── MainTabs.tsx        # Bottom tab navigator
│   │   │   ├── screens/
│   │   │   │   ├── SplashScreen.tsx    # Auth check + routing
│   │   │   │   ├── SignupScreen.tsx    # User registration
│   │   │   │   ├── LoginScreen.tsx     # User login
│   │   │   │   ├── HomeScreen.tsx      # Main SOS dashboard
│   │   │   │   ├── MapScreen.tsx       # Live GPS map
│   │   │   │   ├── AssistantScreen.tsx # AI Guide + Chatbot
│   │   │   │   ├── NearbyHospitalsScreen.tsx
│   │   │   │   ├── EmergencyCallScreen.tsx
│   │   │   │   ├── WomenSafetyScreen.tsx
│   │   │   │   ├── VoiceSosScreen.tsx
│   │   │   │   ├── EssentialDetailsScreen.tsx
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   ├── TutorialScreen.tsx
│   │   │   │   ├── LanguageSelectionScreen.tsx
│   │   │   │   └── HelpScreen.tsx
│   │   │   ├── services/
│   │   │   │   ├── sosAlerts.ts        # SOS create/subscribe/cancel
│   │   │   │   ├── groqAssistant.ts    # Groq LLM API client
│   │   │   │   ├── firestoreProfile.ts # User profile CRUD
│   │   │   │   └── onboardingFlow.ts   # First-run routing logic
│   │   │   ├── theme/                  # Color tokens, typography
│   │   │   └── types/                  # Shared TypeScript types
│   │   ├── app.config.ts               # Expo config (env injection)
│   │   ├── .env.local                  # 🔑 API keys (gitignored)
│   │   ├── package.json
│   │   └── App.tsx                     # Root component
│   │
│   └── Web/                            # 🌐 Web Dashboard
│       ├── src/
│       │   ├── firebase/               # Firebase initialization
│       │   ├── pages/
│       │   │   ├── LandingPage.tsx
│       │   │   ├── PoliceDashboard.tsx
│       │   │   ├── PoliceLogin.tsx
│       │   │   ├── PoliceSignup.tsx
│       │   │   ├── PoliceProfile.tsx
│       │   │   ├── PoliceIncidentLogs.tsx
│       │   │   ├── HospitalDashboard.tsx
│       │   │   ├── HospitalLogin.tsx
│       │   │   ├── HospitalSignup.tsx
│       │   │   ├── HospitalProfile.tsx
│       │   │   ├── AmbulanceLogistics.tsx
│       │   │   └── IncidentLogs.tsx
│       │   ├── layouts/                # Shared layouts/nav
│       │   ├── styles/                 # Global CSS
│       │   └── main.tsx
│       ├── .env                        # 🔑 Web API keys (gitignored)
│       ├── vite.config.ts
│       └── package.json
│
└── README.md
```

---

## ✅ Prerequisites

Make sure the following are installed on your system:

| Tool | Version | Install |
|---|---|---|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org/) |
| **npm** | ≥ 9.x | Bundled with Node.js |
| **Expo CLI** | Latest | `npm install -g expo-cli` |
| **Git** | Any | [git-scm.com](https://git-scm.com/) |
| **Android Studio** | Latest | [developer.android.com](https://developer.android.com/studio) (for Android emulator) |
| **Xcode** | ≥ 14 (macOS only) | Mac App Store (for iOS simulator) |

Or install **Expo Go** on your physical device from the [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) / [App Store](https://apps.apple.com/app/expo-go/id982107779).

---

## 🚀 Installation

### Mobile App Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/RakshaSOS.git
cd RakshaSOS

# 2. Navigate to the mobile app directory
cd Apps/Android/RakshaSOS

# 3. Install all dependencies
npm install

# 4. Create your local environment file
# (See "Environment Variables" section below)
copy .env.local.example .env.local
# Then fill in your actual API keys
```

### Web Dashboard Setup

```bash
# 1. From the project root, navigate to the web app
cd Apps/Web

# 2. Install all dependencies
npm install

# 3. Create your environment file
# (See "Environment Variables" section below)
copy .env.example .env
# Then fill in your actual API keys
```

---

## 🔑 Environment Variables & API Keys

### Mobile App `.env.local`

Create the file at `Apps/Android/RakshaSOS/.env.local`:

```env
# ─── Groq AI (LLM for chatbot & live session) ───────────────────────
EXPO_PUBLIC_GROQ_API_KEY=gsk_your_groq_api_key_here
EXPO_PUBLIC_GROQ_MODEL=llama-3.3-70b-versatile

# ─── Google Maps (Map view + Places API for hospitals/police) ────────
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy_your_google_maps_api_key_here
```

> **⚠️ Important:** Do NOT put spaces inside API key values. Paste them exactly as provided by the API provider.

### Web Dashboard `.env`

Create the file at `Apps/Web/.env`:

```env
# ─── Google Maps (for map in web dashboard) ──────────────────────────
VITE_GOOGLE_MAPS_API=AIzaSy_your_google_maps_api_key_here
```

### Firebase Configuration

Firebase credentials are set directly in the source code. Update both locations with your Firebase project values:

**Mobile App** — `Apps/Android/RakshaSOS/src/config/firebaseconfig.ts`:
```ts
const firebaseConfig = {
  apiKey:            "YOUR_FIREBASE_API_KEY",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  storageBucket:     "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "G-XXXXXXXXXX"  // optional
};
```

**Web App** — `Apps/Web/src/firebase/` (your Firebase init file):
```ts
const firebaseConfig = {
  apiKey:            "YOUR_FIREBASE_API_KEY",
  authDomain:        "your-project.firebaseapp.com",
  projectId:         "your-project-id",
  // ...same values as above
};
```

---

## ▶️ Running the Apps

### Run Mobile App

```bash
cd Apps/Android/RakshaSOS

# Start Expo development server (scan QR with Expo Go app)
npm start

# Run specifically on Android emulator
npm run android

# Run specifically on iOS simulator (macOS only)
npm run ios

# ⚠️ After changing .env.local, always clear cache:
npx expo start -c
```

### Run Web Dashboard

```bash
cd Apps/Web

# Start development server (opens at http://localhost:5173)
npm run dev

# Build for production
npm run build


---

## 🔐 API Key Acquisition Guide

### 1. Groq API Key (AI Chatbot + Voice Guidance)

1. Go to [console.groq.com](https://console.groq.com/)
2. Create a free account
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`)
5. Paste into `EXPO_PUBLIC_GROQ_API_KEY` in `.env.local`

> **Free tier:** 14,400 requests/day on `llama-3.3-70b-versatile`. More than sufficient for development.

---

### 2. Google Maps API Key (Maps + Places)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create or select a project
3. Enable these APIs in **APIs & Services → Library**:
   - ✅ **Maps SDK for Android**
   - ✅ **Maps SDK for iOS**
   - ✅ **Places API (New)**
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**
5. (Recommended) Restrict the key to the APIs above
6. Paste the key into:
   - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in mobile `.env.local`
   - `VITE_GOOGLE_MAPS_API` in web `.env`

> **Note:** Google Maps requires a billing account but offers a $200/month free credit — more than enough for development and moderate usage.

---

### 3. Firebase Project Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. **Create a new project** (or use existing)
3. Enable these Firebase services:
   - **Authentication** → Sign-in method: **Email/Password**
   - **Firestore Database** → Start in production mode
   - **Storage** → Default storage bucket
4. Go to **Project Settings → Your apps → Add app**
   - Add a **Web app** (used for both mobile and web via the same Firebase SDK)
5. Copy the `firebaseConfig` object
6. Paste into both config files (see above)

#### Firestore Security Rules (Recommended for Development)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Storage Security Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📱 Screen-by-Screen Breakdown

| Screen | Route Name | Description |
|---|---|---|
| Splash Screen | `Splash` | Checks Firebase auth state; routes to Home or Signup |
| Language Selection | `Language` | Choose preferred app language |
| Tutorial | `Tutorial` | Onboarding walkthrough for new users |
| Sign Up | `Signup` | Email/password registration |
| Login | `Login` | Email/password authentication |
| Essential Details | `EssentialDetails` | Name, phone, blood group, emergency contacts |
| Home | `MainTabs → Home` | Central SOS trigger hub |
| Map | `Map` | Live GPS map with hospital/police markers |
| AI Guide | `MainTabs → Assistant` | Emergency categories + voice guidance + chatbot |
| Nearby Hospitals | `NearbyHospitals` | Live sorted hospital list with call/route actions |
| Emergency Calls | `EmergencyCall` | National emergency contacts with dialpad integration |
| Women Safety | `WomenSafety` | Women-specific safety resources |
| Voice SOS | `VoiceSos` | Hands-free SOS trigger |
| Profile | `MainTabs → Profile` | User profile and medical info |
| Help | `Help` | FAQ and support |

---

## 🗄️ Firebase Firestore Schema

### `sos_alerts` Collection
```
sos_alerts/{alertId}
├── user_id               : string
├── type                  : 'police' | 'hospital' | 'guardian' | 'fire' | 'general'
├── status                : 'triggered' | 'broadcasted' | 'accepted' | 'en_route' | 'resolved' | 'cancelled'
├── victim_name           : string
├── victim_phone          : string
├── victim_email          : string
├── blood_group           : string
├── known_allergies       : string[]
├── chronic_conditions    : string
├── last_known_lat        : number
├── last_known_lng        : number
├── location_accuracy_m   : number
├── incident_note         : string | null
├── incident_photo_url    : string | null
├── incident_audio_url    : string | null
├── emergency_contacts    : EmergencyContact[]
├── primary_emergency_contact : EmergencyContact | null
├── medical_profile_snapshot : MedicalProfile
├── accepted_by_hospital  : string | null
├── accepted_by_name      : string | null
├── ambulance_eta         : timestamp | null
├── ambulance_lat         : number | null
├── ambulance_lng         : number | null
├── police_station_id     : string | null
├── start_time            : timestamp
├── end_time              : timestamp | null
└── broadcasted_at        : timestamp
```

### `users/{uid}` Collection
```
users/{uid}
├── full_name             : string
├── phone_number          : string
├── email                 : string
├── gender                : string
├── dob                   : string
├── address               : string
├── city                  : string
├── pincode               : string
│
├── emergency_contacts/   (subcollection)
│   └── {contactId}
│       ├── name          : string
│       ├── relationship  : string
│       ├── phone_number  : string
│       ├── priority      : 'primary' | 'secondary'
│       └── is_notified_on_sos : boolean
│
└── medical_profiles/profile
    ├── blood_group       : string
    ├── known_allergies   : string[]
    ├── chronic_conditions: string
    ├── emergency_doctor_name  : string
    ├── emergency_doctor_phone : string
    ├── insurance_provider     : string
    ├── insurance_policy_number: string
    └── medical_notes     : string
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Commit Convention
This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `refactor:` — code refactoring without feature changes
- `chore:` — build, dependencies, or config changes

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Expo](https://expo.dev/) — for making React Native development seamless
- [Groq](https://groq.com/) — for lightning-fast LLM inference
- [Firebase](https://firebase.google.com/) — for real-time backend infrastructure
- [Google Maps Platform](https://mapsplatform.google.com/) — for geospatial services
- [Lucide Icons](https://lucide.dev/) — for the clean icon set

---

<div align="center">

**Built with ❤️ for safer communities in India**

⭐ If this project helped you, please give it a star!

</div>
