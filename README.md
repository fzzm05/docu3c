# 👁️‍🗨️ GuardianSense

**GuardianSense** is a real-time sensor-fusion based child safety tracker designed to provide parents with crucial insights and alerts related to their child's safety, location, and behavior. Built with a full-stack architecture using Node.js, Express, React, and Tailwind CSS.

---

## 🧠 Features

- 🔐 Authentication system (Signup/Login)
- 🗺️ Real-time child location tracking via maps
- AI-powered behavioral analysis
- 🚨 Safety alert system with location-based triggers
- 👪 Parent dashboard with analytics
- 🧪 Child safety analysis logic based on multiple data points
- Styled with Tailwind CSS for modern UI

---

## 🏗️ Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- RESTful APIs
- `.env` configuration for secure environment variables

### Frontend
- React.js
- React Router
- Tailwind CSS
- Context API for Auth
- Map services (e.g., Google Maps or LocationIQ integration)

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
├── utils/
│ └── analyzeChildSafety.js
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
│ │ └── TopBar.jsx
│ ├── context/
│ │ └── AuthContext.jsx
│ ├── pages/
│ │ ├── LocationTracker.jsx
│ │ ├── Login.jsx
│ │ ├── ParentDashboard.jsx
│ │ └── Signup.jsx
│ ├── utils/
│ ├── App.jsx
│ ├── App.css
│ ├── index.css
│ ├── main.jsx
│ └── index.html
├── .env
├── components.json
├── eslint.config.js
└── package.json


---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL
- LocationIQ API Access Token

### Backend Setup

```bash
cd backend
npm install
# Create a .env file and add your environment variables
npm run dev

### Future Enhancements
- SOS alerts with wearables
- Real-time push notifications
- In-app chat system between parent and child
