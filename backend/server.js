import express from "express";
import env from "dotenv";
import pool from "./db.js";
import cors from "cors";
import pgSessionPkg from "connect-pg-simple";
import session from "express-session";
const pgSession = pgSessionPkg(session);

import authRoutes from "./routes/authRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import myDataRoutes from "./routes/parentDataRoutes.js";
import safetyAlertRoutes from "./routes/safetyAlertRoutes.js";

const app = express();
const port = process.env.PORT || 5000;
env.config();

const isProduction = process.env.NODE_ENV === 'production';

// ✅ Allow requests from your frontend
app.use(cors({ 
    origin: process.env.FRONTEND_URL, 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(session({
    store: new pgSession({
      pool, // Use the imported pool
      tableName: "session" // Make sure this table exists in your DB
    }),
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,  // Set to true if using HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day session
      domain: isProduction ? process.env.PRODUCTION_DOMAIN : 'localhost'
    },
    name: 'sessionId', // Custom name for the session cookie
    rolling: true, // Reset the cookie maxAge on every response
    unset: 'destroy' // Remove the session when it's unset
}));

app.use('/auth', authRoutes);
app.use('/code', codeRoutes);
app.use('/location', locationRoutes);
app.use('/data', myDataRoutes);
app.use('/alerts', safetyAlertRoutes);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});