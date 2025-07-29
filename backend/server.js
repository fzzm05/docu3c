// server.js
import express from "express";
import env from "dotenv";
import pool from "./db.js";
import cors from "cors";
import pgSessionPkg from "connect-pg-simple";
import session from "express-session";
const pgSession = pgSessionPkg(session);
import http from "http";
import { Server } from "socket.io";
import axios from "axios";

// Import routes as functions that accept `io`
import authRoutes from "./routes/authRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import myDataRoutes from "./routes/parentDataRoutes.js";
import safetyAlertRoutes from "./routes/safetyAlertRoutes.js";
import configRoutes from "./routes/configRoutes.js";

const app = express();
const port = process.env.PORT || 5000;
env.config();

const isProduction = process.env.NODE_ENV === 'production';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Define the session middleware once and store it in a variable
const sessionMiddleware = session({
    store: new pgSession({
      pool,
      tableName: "session"
    }),
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day session
      domain: isProduction ? process.env.PRODUCTION_DOMAIN : 'localhost',
      sameSite: 'Lax' // 'Lax' for CSRF protection, 'None' if cross-site cookies are needed
    },
    name: 'sessionId',
    rolling: true,
    unset: 'destroy'
});

// Apply session middleware to Express app FIRST
app.use(sessionMiddleware);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Socket.IO connection handling - HANDLE ALL SOCKET LOGIC HERE
io.on('connection', (socket) => {
  console.log(`Socket.IO Client Connected: ${socket.id}`);
  
  // Check if this is a child device connection
  const childId = socket.handshake.query.childId;
  
  if (childId) {
    // This is a child device connection
    console.log(`Child device connected: ${childId} (Socket: ${socket.id})`);
    socket.join(`child-${childId}`);
    
    // Handle location updates from child devices - MOVED HERE FROM locationRoutes.js
    socket.on('locationUpdate', async (data, callback) => {
      console.log('Received location update from child:', childId, data);
      
      try {
        const { childId: dataChildId, latitude, longitude, accuracy, nearest_poi, poi_type, crowd_density, crime_score, is_familiar, parent_sensitivity } = data;
        
        // Validate required data
        if (!dataChildId || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
          const error = { status: 'error', message: 'childId, latitude, and longitude are required.' };
          console.error('Validation error:', error);
          if (callback) callback(error);
          return;
        }

        let currentZone = 'Unknown Zone';
        let nearbyPlace = "City Mall";

        // Fetch region from LocationIQ API
        try {
          const locationIqUrl = `https://us1.locationiq.com/v1/reverse.php?key=${process.env.LOCATION_IQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json`;
          
          console.log('Calling LocationIQ API:', locationIqUrl);
          const response = await axios.get(locationIqUrl);
          const locationData = response.data;

          if (locationData && locationData.address) {
            console.log('LocationIQ response:', locationData);
            currentZone = 
              locationData.address.hostel ||
              locationData.address.town || 
              locationData.address.city || 
              locationData.address.county || 
              locationData.address.state || 
              locationData.address.country ||
              locationData.display_name ||
              'Unknown Zone';
            
            nearbyPlace = locationData.address.city || 
                         locationData.address.town || 
                         locationData.address.road || 
                         'City Mall';
          } else if (locationData && locationData.display_name) {
            currentZone = locationData.display_name;
          }
        } catch (locationIqError) {
          console.error("Error fetching location from LocationIQ:", locationIqError.message);
          currentZone = 'Unknown Zone (API Error)';
        }

        // Check if the childId exists in the children table
        const childExists = await pool.query('SELECT parent_id, name, status FROM children WHERE id = $1', [dataChildId]);
        if (childExists.rows.length === 0) {
          const error = { status: 'error', message: 'Child not found.' };
          console.error('Child not found:', dataChildId);
          if (callback) callback(error);
          return;
        }

        const { parent_id: parentId, name: childName, status: currentStatus } = childExists.rows[0];

        // Update the child's location and zone in the children table
        await pool.query(
          'UPDATE children SET last_latitude = $1, last_longitude = $2, current_zone = $3, last_seen = NOW(), accuracy = $4 WHERE id = $5',
          [latitude, longitude, currentZone, accuracy, dataChildId]
        );

        console.log(`Updated database for child ${childName} (${dataChildId})`);

        // Emit Socket.IO Event for Child Update to parent
        const updatedChildData = {
          id: dataChildId,
          name: childName,
          status: currentStatus,
          location: currentZone,
          lastupdated: new Date().toISOString(),
          coordinates: { lat: latitude, lng: longitude },
          accuracy: accuracy || 9999,
        };
        
        // Emit to parent room
        io.to(parentId).emit('childUpdated', updatedChildData);
        console.log(`Emitted childUpdated to parent ${parentId} for child: ${childName}`);

        // Send acknowledgment back to child device
        const successResponse = { 
          status: 'success', 
          message: 'Location updated successfully.',
          currentZone: currentZone,
          nearbyPlace: nearbyPlace
        };
        
        console.log('Sending success response:', successResponse);
        if (callback) callback(successResponse);

      } catch (error) {
        console.error("Error updating child location:", error);
        const errorResponse = { status: 'error', message: 'Failed to update child location.' };
        if (callback) callback(errorResponse);
      }
    });

    // Handle child disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Child device disconnected: ${childId} (${reason})`);
    });
    
  } else {
    // This might be a parent connection, check session
    sessionMiddleware(socket.request, {}, () => {
      if (socket.request.session && socket.request.session.userId) {
        const parentId = socket.request.session.userId;
        socket.join(parentId); // Add the socket to a room named after the parentId
        console.log(`Parent socket ${socket.id} joined room: ${parentId}`);
      } else {
        console.log(`Socket ${socket.id} connected but not authenticated as parent.`);
        // Optionally, disconnect unauthenticated sockets
        // socket.disconnect(true);
      }
    });
  }

  socket.on('disconnect', (reason) => {
      console.log(`Socket.IO Client Disconnected: ${socket.id} (Reason: ${reason})`);
  });

  socket.on('error', (err) => {
      console.error(`Socket.IO Error on ${socket.id}:`, err);
  });
});

// Use the routes with the Socket.IO instance
app.use('/auth', authRoutes(io));
app.use('/code', codeRoutes(io));
app.use('/location', locationRoutes(io));
app.use('/data', myDataRoutes(io));
app.use('/alerts', safetyAlertRoutes(io));
app.use('/config', configRoutes(io));

// Listen on the HTTP server, not the Express app directly
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Socket.IO server also running on ws://localhost:${port}`);
});