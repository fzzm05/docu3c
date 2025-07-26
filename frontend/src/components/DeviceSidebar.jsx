import { useState } from 'react';
import { Smartphone, Headphones, Watch, Plus, MapPin, Clock } from 'lucide-react';

const mockDevices = [
  {
    id: 'vijay-phone',
    name: "Vijay's iPhone",
    type: 'phone',
    status: 'found',
    location: 'VIT Boys Hostel Block 4',
    lastSeen: 'Now'
  },
  {
    id: 'sarah-airpods',
    name: "Sarah's AirPods Pro",
    type: 'airpods',
    status: 'found',
    location: 'Library Study Hall',
    lastSeen: '2 mins ago'
  },
  {
    id: 'mike-watch',
    name: "Mike's Apple Watch",
    type: 'watch',
    status: 'lost',
    lastSeen: '1 hour ago'
  },
  {
    id: 'anna-phone',
    name: "Anna's iPhone",
    type: 'phone',
    status: 'found',
    location: 'Hostel Block 1',
    lastSeen: 'Now'
  }
];

const DeviceIcon = ({ type }) => {
  const iconClass = "w-6 h-6";
  
  switch (type) {
    case 'phone':
      return <Smartphone className={iconClass} />;
    case 'airpods':
      return <Headphones className={iconClass} />;
    case 'watch':
      return <Watch className={iconClass} />;
    default:
      return <Smartphone className={iconClass} />;
  }
};

const DeviceSidebar = ({ activeDevice, onDeviceSelect }) => {
  const [activeTab, setActiveTab] = useState('devices');

  const getStatusText = (device) => {
    if (device.status === 'found') {
      return device.location || 'Location Found';
    }
    return 'No location found';
  };

  const getStatusIcon = (device) => {
    if (device.status === 'found') {
      return <MapPin className="w-3 h-3 text-primary mr-1" />;
    }
    return <Clock className="w-3 h-3 text-muted-foreground mr-1" />;
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col" style={{ width: 'var(--sidebar-width, 280px)' }}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground mb-4">Farooque's Devices</h1>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {['people', 'devices', 'items'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              // Adjusted tab button styles
              className={`
                flex-1 text-sm capitalize py-1.5 rounded-md transition-colors duration-200
                ${activeTab === tab 
                  ? 'bg-background text-foreground shadow' 
                  : 'text-muted-foreground hover:bg-muted-foreground/10'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Device List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {mockDevices.map((device) => (
          <div
            key={device.id}
            onClick={() => onDeviceSelect(device.id)}
            // Adjusted device item styles
            className={`
              p-3 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
              ${activeDevice === device.id 
                ? 'bg-blue-100 text-blue-800' // Similar active state as ChildrenSidebar
                : 'hover:bg-muted-foreground/10' // Subtle hover for inactive
              }
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Device Icon */}
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                device.status === 'found' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <DeviceIcon type={device.type} />
              </div>
              
              {/* Device Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground truncate">{device.name}</h3>
                  {device.lastSeen && (
                    <span className="text-xs text-muted-foreground">{device.lastSeen}</span>
                  )}
                </div>
                
                <div className="flex items-center mt-1">
                  {getStatusIcon(device)}
                  <span className={`text-sm ${
                    device.status === 'found' ? 'text-primary' : 'text-muted-foreground' // Adjusted text color
                  }`}>
                    {getStatusText(device)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Device Button */}
      <div className="p-4 border-t border-border">
        <button 
          // Adjusted add device button styles
          className="w-full flex items-center justify-center space-x-2 
                     bg-primary text-primary-foreground py-2.5 px-4 rounded-lg 
                     font-medium text-sm hover:bg-primary/90 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Device</span>
        </button>
      </div>
    </div>
  );
};

export default DeviceSidebar;