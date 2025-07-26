import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../config/api';
import { useAuth } from './AuthContext';

export interface UserSettings {
  firstName: string;
  lastName: string;
  description: string;
  location: string;
  visibleMaps: string[];
}

export interface MapConfig {
  id: string;
  name: string;
  route: string;
  category: 'neighborhood' | 'other';
}

interface SettingsContextType {
  settings: UserSettings;
  availableMaps: MapConfig[];
  updateSettings: (newSettings: UserSettings) => void;
  toggleMapVisibility: (mapId: string) => void;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
  firstName: '',
  lastName: '',
  description: '',
  location: '',
  visibleMaps: ['nyc', 'boston', 'countries']
};

const availableMaps: MapConfig[] = [
  { id: 'nyc', name: 'NYC Neighborhoods', route: '/neighborhoods', category: 'neighborhood' },
  { id: 'boston', name: 'Boston Neighborhoods', route: '/boston', category: 'neighborhood' },
  { id: 'countries', name: 'Countries', route: '/countries', category: 'other' }
];

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      // If no user, load from localStorage as fallback
      loadLocalSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First try to get from user object (from auth context)
      if (user.mapPreferences) {
        setSettings({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          description: user.description || '',
          location: user.location || '',
          visibleMaps: user.mapPreferences.visibleMaps || defaultSettings.visibleMaps
        });
        setLoading(false);
        return;
      }

      // If not in user object, fetch from API
      const response = await api.get('/api/auth/preferences');
      const { mapPreferences } = response.data;
      
      setSettings({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        description: user.description || '',
        location: user.location || '',
        visibleMaps: mapPreferences.visibleMaps || defaultSettings.visibleMaps
      });
    } catch (error) {
      console.error('Failed to load settings from server:', error);
      // Fallback to localStorage
      loadLocalSettings();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalSettings = () => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load local settings:', error);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    if (user) {
      try {
        await api.put('/api/auth/preferences', {
          mapPreferences: {
            visibleMaps: newSettings.visibleMaps
          }
        });
      } catch (error) {
        console.error('Failed to save settings to server:', error);
        // Fallback to localStorage
        try {
          localStorage.setItem('userSettings', JSON.stringify(newSettings));
        } catch (localError) {
          console.error('Failed to save settings locally:', localError);
        }
      }
    } else {
      // Save to localStorage if no user
      try {
        localStorage.setItem('userSettings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save settings locally:', error);
      }
    }
  };

  const updateSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const toggleMapVisibility = async (mapId: string) => {
    const newVisibleMaps = settings.visibleMaps.includes(mapId)
      ? settings.visibleMaps.filter(id => id !== mapId)
      : [...settings.visibleMaps, mapId];
    
    const newSettings = { ...settings, visibleMaps: newVisibleMaps };
    await updateSettings(newSettings);
  };

  const value: SettingsContextType = {
    settings,
    availableMaps,
    updateSettings,
    toggleMapVisibility,
    loading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};