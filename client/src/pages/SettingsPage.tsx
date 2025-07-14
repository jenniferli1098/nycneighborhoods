import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSettings, type UserSettings } from '../contexts/SettingsContext';


const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { settings, availableMaps, updateSettings, toggleMapVisibility, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);



  const handleInputChange = (field: keyof UserSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleMapToggle = (mapId: string) => {
    toggleMapVisibility(mapId);
    setLocalSettings(prev => ({
      ...prev,
      visibleMaps: prev.visibleMaps.includes(mapId)
        ? prev.visibleMaps.filter(id => id !== mapId)
        : [...prev.visibleMaps, mapId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      updateSettings(localSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="max-w-4xl mx-auto p-6">
      <Typography variant="h4" className="mb-6">
        Settings
      </Typography>

      {message && (
        <Alert severity={message.type} className="mb-4" onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Personal Information */}
      <Card className="mb-6">
        <CardContent>
          <Typography variant="h6" className="mb-4">
            Personal Information
          </Typography>
          
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TextField
              fullWidth
              label="First Name"
              value={localSettings.firstName}
              onChange={handleInputChange('firstName')}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Last Name"
              value={localSettings.lastName}
              onChange={handleInputChange('lastName')}
              variant="outlined"
            />
          </Box>


          <Typography variant="body2" color="text.secondary">
            Account: {user?.username} ({user?.email})
          </Typography>
        </CardContent>
      </Card>

      {/* Map Visibility Configuration */}
      <Card className="mb-6">
        <CardContent>
          <Typography variant="h6" className="mb-2">
            Visible Maps
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            Select which maps you want to see in the navigation menu.
          </Typography>

          <FormControl component="fieldset" className="mb-4">
            <FormLabel component="legend">Neighborhood Maps</FormLabel>
            <FormGroup>
              {availableMaps
                .filter(map => map.category === 'neighborhood')
                .map((map) => (
                  <FormControlLabel
                    key={map.id}
                    control={
                      <Checkbox
                        checked={localSettings.visibleMaps.includes(map.id)}
                        onChange={() => handleMapToggle(map.id)}
                        name={map.name}
                      />
                    }
                    label={map.name}
                  />
                ))}
            </FormGroup>
          </FormControl>

          <FormControl component="fieldset">
            <FormLabel component="legend">Other Maps</FormLabel>
            <FormGroup>
              {availableMaps
                .filter(map => map.category === 'other')
                .map((map) => (
                  <FormControlLabel
                    key={map.id}
                    control={
                      <Checkbox
                        checked={localSettings.visibleMaps.includes(map.id)}
                        onChange={() => handleMapToggle(map.id)}
                        name={map.name}
                      />
                    }
                    label={map.name}
                  />
                ))}
            </FormGroup>
          </FormControl>
        </CardContent>
      </Card>

      <Divider className="my-6" />

      {/* Save Button */}
      <Box className="flex justify-end">
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsPage;