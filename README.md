# 👁️‍🗨️ GuardianSense

**GuardianSense** is an advanced real-time child safety tracker leveraging sensor-fusion, machine learning, and WebSocket-based communication to provide parents with precise location tracking, behavioral insights, and safety alerts. Built with a modern full-stack architecture using Node.js, Express, React, and Tailwind CSS, it ensures robust security, scalability, and real-time performance.

---

## 🧠 Features

- 🔐 **Secure Authentication**: Robust signup/login system with rate-limited auth routes, secure cookies (HTTPS, SameSite=Lax), and Helmet for security headers.
- 🗺️ **Real-Time Location Tracking**: WebSocket-based updates (via Socket.IO) for live child location tracking on maps, replacing 10s polling.
- 🚨 **AI-Powered Safety Alerts**: Real-time alerts broadcasted to parent-specific WebSocket rooms (e.g., `parent_<id>`), with dynamic risk detection using novelty detection (Mahalanobis distance model).
- 🧪 **Advanced Sensor-Fusion**: Extended Kalman Filter (EKF) fuses GPS, WiFi RTT, BLE, and IMU data for enhanced location accuracy; stores raw and fused tracks.
- 🧠 **Safety Narration Microservice**: ML/LLM-backed narration with structured JSON output (including `risk_level`, `recommended_action`, `nearest_exit`, `priority`) using Gemini function-calling, with preloaded POI/crime/crowd data.
- ⚙️ **Customizable Settings**: React-based `/settings` page with sliders for "risk sensitivity" and "alert frequency," persisted in a `parent_settings` table.
- 🔒 **Security Compliance**: Adheres to GDPR, COPPA, and data-retention policies, documented in `security_checklist.md`.
- 🧪 **Testing & Validation**: Backend APIs tested with Jest and Supertest; React frontend tested with Cypress; `validate.js` script simulates indoor/outdoor traces to compute MAE and alert precision/recall.

---

## 🏗️ Tech Stack

### Backend
- **Node.js** (pinned version)
- **Express.js** with Helmet for security headers and rate-limiting
- **PostgreSQL** (pinned version) with `parent_settings` table
- **Socket.IO** for real-time WebSocket communication
- **RESTful APIs** with input validation for sensor data
- **zod** to validate the data that is being inputted to the LLM and to check the data being recieved from the LLM.
- **.env** configuration for secure environment variables

### Frontend
- **React.js** with `/settings` page for user preferences
- **React Router** for navigation
- **Tailwind CSS** for modern, responsive UI
- **Context API** for authentication state management
- **Socket.IO Client** for real-time updates
- **Cypress** for UI testing
- **Map Services** (e.g., Google Maps or LocationIQ integration)

---

## 📁 Folder Structure

### 📦 Backend
backend/
│
├── middleware/
│ └── authMiddleware.js
├── routes/
│ ├── authRoutes.js
│ ├── codeRoutes.js
│ ├── locationRoutes.js
│ ├── parentDataRoutes.js
│ └── safetyAlertRoutes.js
│ └── parentDataRoutes.js
├── utils/
│ └── analyzeChildSafety.js
├── schemas/
│ └── safetyPromptSchema.js
├── db.js
├── server.js
├── .env
├── package.json
└── package-lock.json


### 🖥️ Frontend
frontend/
│
├── src/
│ ├── components/
│ │ └── ui/
│ │ ├── ChildrenSidebar.jsx
│ │ ├── DeviceSidebar.jsx
│ │ ├── LiveMap.jsx
│ │ ├── MapView.jsx
│ │ ├── ProtectedRoute.jsx
│ │ ├── SafetyAlerts.jsx
│ │ ├── Settings.jsx
│ │ └── TopBar.jsx
│ ├── context/
│ │ └── AuthContext.jsx
│ ├── pages/
│ │ ├── LocationTracker.jsx
│ │ ├── Login.jsx
│ │ ├── ParentDashboard.jsx
│ │ └── Signup.jsx
│ │ └── HomePage.jsx
│ ├── utils/
│ │ └── generateMockChildData.js
│ │ └── geoUtils.js
│ ├── App.jsx
│ ├── App.css
│ ├── index.css
│ ├── main.jsx
├── .env
├── index.html
├── components.json
├── tailwind.config.js
├── eslint.config.js
└── package.json

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (pinned version, e.g., v18.x)
- **PostgreSQL** (pinned version, e.g., v15.x)
- **LocationIQ API Access Token** (or equivalent map service)

### Backend Setup

```bash
cd backend
npm install
# Create .env file with variables (e.g., DB credentials, LocationIQ token)
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with variables (e.g., API_URL, Socket.IO endpoint)
npm run dev
```

### Running Tests
```bash
# Backend API tests
cd backend
nodemon server.js

# Frontend UI tests
cd frontend
npm run dev
```

---

## 🔐 Security Features
- Secure Cookies: cookie.secure = true, SameSite=Lax, enforced HTTPS (TLS).
- Rate-Limiting: Applied to authentication routes to prevent brute-force attacks.
- Helmet: Configured for secure HTTP headers.
- Compliance: security_checklist.md details GDPR, COPPA, encryption, and data-retention policies.

---

## 📈 Future Enhancements
- 🆘 SOS Alerts with Wearables: Integrate wearable devices for emergency alerts.
- 📢 Real-Time Push Notifications: Implement in-app push notifications for critical alerts.
- 💬 In-App Chat System: Enable direct parent-child communication.
- 📍 React Native Integration: Support native mobile sensors (WiFi RTT, BLE, IMU) for enhanced data collection.
- ⚙️ Dynamic Geofencing: Fully replace hardcoded rules with model-based logic.

