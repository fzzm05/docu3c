import { useState } from 'react';
import { ZoomIn, ZoomOut, Navigation, Settings, Clock, MapPin as MapPinIcon } from 'lucide-react'; // Renamed MapPin to MapPinIcon to avoid conflict

const deviceLocations = {
  'vijay-phone': {
    name: "Vijay's iPhone",
    location: 'VIT Boys Hostel Block 4',
    coordinates: { x: 65, y: 45 }, // percentage positions
    status: 'found'
  },
  'sarah-airpods': {
    name: "Sarah's AirPods Pro",
    location: 'Library Study Hall',
    coordinates: { x: 35, y: 60 },
    status: 'found'
  },
  'mike-watch': {
    name: "Mike's Apple Watch",
    location: 'Last seen: Academic Block',
    coordinates: { x: 50, y: 30 },
    status: 'lost'
  },
  'anna-phone': {
    name: "Anna's iPhone",
    location: 'Hostel Block 1',
    coordinates: { x: 75, y: 25 },
    status: 'found'
  }
};

const LocationPin = ({ device, isActive }) => {
  return (
    <div 
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
        isActive ? 'scale-110 z-10' : 'scale-100 z-0'
      }`}
      style={{ 
        left: `${device.coordinates.x}%`, 
        top: `${device.coordinates.y}%` 
      }}
    >
      {/* Pulsing ring for active device - Adjusted opacity for subtlety */}
      {isActive && device.status === 'found' && (
        <div className="absolute inset-0 w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping" /> // Explicit blue for active
      )}
      
      {/* Pin - Changed from circle-with-dot to MapPinIcon, adjusted sizing and colors */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white
        ${device.status === 'found' 
          ? 'bg-blue-600 text-white' // Distinct blue for found devices
          : 'bg-muted text-muted-foreground'
        }
      `}>
        <MapPinIcon className="w-4 h-4" /> {/* Lucide MapPinIcon */}
      </div>
      
      {/* Location label - Adjusted top position for closer proximity and shadow */}
      <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap ${
        isActive ? 'opacity-100' : 'opacity-75 hover:opacity-100'
      } transition-opacity`}>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md"> {/* Changed shadow to md */}
          <div className="text-sm font-medium text-foreground">{device.name}</div>
          <div className={`text-xs ${
            device.status === 'found' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {device.location}
          </div>
        </div>
      </div>
    </div>
  );
};

const MapView = ({ activeDevice }) => {
  const [currentTime] = useState(new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }));
  
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }));

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">Find My Devices</h2>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">{currentTime}</div>
            <div className="text-xs text-muted-foreground">{currentDate}</div>
          </div>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      {/* Changed background to white for cleaner look */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {/* Mock Map Background */}
        <div className="absolute inset-0">
          {/* Grid overlay for map effect - adjusted opacity */}
          <div 
            className="absolute inset-0 opacity-5" // Further reduced opacity
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Area labels - Removed backdrop-blur, used consistent white background and shadow */}
          <div className="absolute top-1/4 left-1/4 text-sm text-muted-foreground bg-white rounded-lg px-3 py-2 shadow-md border border-gray-100">
            Academic Block
          </div>
          <div className="absolute top-1/3 right-1/4 text-sm text-muted-foreground bg-white rounded-lg px-3 py-2 shadow-md border border-gray-100">
            Hostel Block 1
          </div>
          <div className="absolute bottom-1/3 left-1/3 text-sm text-muted-foreground bg-white rounded-lg px-3 py-2 shadow-md border border-gray-100">
            Library
          </div>
          <div className="absolute bottom-1/4 right-1/3 text-sm text-muted-foreground bg-white rounded-lg px-3 py-2 shadow-md border border-gray-100">
            Hostel Block 4
          </div>
        </div>

        {/* Device Pins */}
        {Object.entries(deviceLocations).map(([deviceId, device]) => (
          <LocationPin 
            key={deviceId}
            device={device}
            isActive={activeDevice === deviceId}
          />
        ))}

        {/* Map Controls - Changed bg-card to bg-white and shadow-lg to shadow-md */}
        <div className="absolute top-6 right-6 flex flex-col space-y-2">
          <button className="p-3 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <ZoomIn className="w-5 h-5 text-foreground" />
          </button>
          <button className="p-3 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <ZoomOut className="w-5 h-5 text-foreground" />
          </button>
          <button className="p-3 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <Navigation className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Active Device Info Panel - Changed bg-card to bg-white and shadow-lg to shadow-md */}
        {activeDevice && deviceLocations[activeDevice] && (
          <div className="absolute bottom-6 left-6 bg-white border border-gray-200 rounded-xl p-4 shadow-md max-w-sm">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                deviceLocations[activeDevice].status === 'found' 
                  ? 'bg-primary' // Primary color for found status
                  : 'bg-muted-foreground'
              }`} />
              <div>
                <div className="font-medium text-foreground">
                  {deviceLocations[activeDevice].name}
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {deviceLocations[activeDevice].location}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;