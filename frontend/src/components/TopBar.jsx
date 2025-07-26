import { useState } from 'react';
import { Sun, Moon, Settings, User, ChevronDown, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopBar = () => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [currentTime] = useState(new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }));

  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }));

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="bg-card border-b border-border border-neutral-200 px-6 py-1 flex items-center justify-between"> {/* Increased py to py-4 for more height */}
      {/* Left: Logo/Title */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-full" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">GuardianSense</h1>
      </div>

      {/* Center: Date & Time */}
      <div className="flex items-center space-x-4 text-sm"> {/* Reduced space-x to space-x-4 for better grouping */}
        {/* Current Time */}
        <div className="flex items-center gap-1.5"> {/* Added flex and gap for icon and text */}
          <Clock className="w-4 h-4 text-[#8e8e8e]" /> {/* Clock icon */}
          <div className="font-medium">{currentTime}</div>
        </div>

        {/* Current Date */}
        <div className="flex items-center gap-1.5"> {/* Added flex and gap for icon and text */}
          <Calendar className="w-4 h-4 text-[#8e8e8e]" /> {/* Calendar icon */}
          <div className="text-muted-foreground">{currentDate}</div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center space-x-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer hover:bg-neutral-100"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer hover:bg-neutral-100">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Profile Dropdown */}
        <div className="flex items-center space-x-2 px-3 py-1 hover:bg-muted border border-neutral-200 rounded-lg cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-foreground">{user.name}</div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;