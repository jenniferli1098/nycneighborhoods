import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface UserSettings {
  firstName: string;
  lastName: string;
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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = (newSettings: UserSettings) => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const toggleMapVisibility = (mapId: string) => {
    const newVisibleMaps = settings.visibleMaps.includes(mapId)
      ? settings.visibleMaps.filter(id => id !== mapId)
      : [...settings.visibleMaps, mapId];
    
    const newSettings = { ...settings, visibleMaps: newVisibleMaps };
    updateSettings(newSettings);
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