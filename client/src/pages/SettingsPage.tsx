import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Avatar,
  Switch,
  Chip
} from '@mui/material';
import {
  Person,
  Map,
  Visibility,
  Save,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSettings, type UserSettings } from '../contexts/SettingsContext';
import axios from 'axios';


const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { settings, availableMaps, updateSettings, toggleMapVisibility, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Initialize with user data from AuthContext if available
    const initialSettings = {
      ...settings,
      firstName: user?.firstName || settings.firstName || '',
      lastName: user?.lastName || settings.lastName || ''
    };
    setLocalSettings(initialSettings);
  }, [settings, user]);



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

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      await axios.put('/api/auth/profile', {
        firstName: localSettings.firstName,
        lastName: localSettings.lastName
      });
      
      // Refresh user data in AuthContext
      await refreshUser();
      
      // Also update local settings to keep them in sync
      updateSettings(localSettings);
      
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Failed to save profile:', error);
      setProfileMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Update local settings (map preferences)
      updateSettings(localSettings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
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
    <Box 
      sx={{ 
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        p: 4,
        overflow: 'auto'
      }}
    >
      <Box className="max-w-5xl mx-auto">
        {/* Header Section */}
        <Box 
          sx={{
            mb: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            p: 4,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative background element */}
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 150,
              height: 150,
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2, position: 'relative' }}>
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <SettingsIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Settings
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9, position: 'relative' }}>
            Customize your exploration experience
          </Typography>
        </Box>

        {message && (
          <Alert 
            severity={message.type} 
            onClose={() => setMessage(null)}
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {message.text}
          </Alert>
        )}

        {profileMessage && (
          <Alert 
            severity={profileMessage.type} 
            onClose={() => setProfileMessage(null)}
            sx={{ 
              mb: 4, 
              borderRadius: 3,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {profileMessage.text}
          </Alert>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4, mb: 4 }}>
          {/* User Profile Card */}
          <Card 
            sx={{ 
              borderRadius: 4, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#e0f2fe',
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Person sx={{ fontSize: 24, color: '#0277bd' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151' }}>
                  Profile Information
                </Typography>
              </Box>
              
              {/* User Avatar and Basic Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}
                >
                  {(localSettings.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                    {localSettings.firstName || localSettings.lastName 
                      ? `${localSettings.firstName} ${localSettings.lastName}`.trim() 
                      : user?.username || 'User'
                    }
                  </Typography>
                  <Chip 
                    label={user?.email || 'No email'}
                    size="small"
                    sx={{ 
                      backgroundColor: '#f0f9ff',
                      color: '#0369a1',
                      fontWeight: 500
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
                    Username: {user?.username}
                  </Typography>
                </Box>
              </Box>
              
              {/* Name Fields */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={localSettings.firstName}
                  onChange={handleInputChange('firstName')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& > fieldset': {
                          borderColor: '#667eea'
                        }
                      },
                      '&.Mui-focused': {
                        '& > fieldset': {
                          borderColor: '#667eea',
                          borderWidth: 2
                        }
                      }
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={localSettings.lastName}
                  onChange={handleInputChange('lastName')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        '& > fieldset': {
                          borderColor: '#667eea'
                        }
                      },
                      '&.Mui-focused': {
                        '& > fieldset': {
                          borderColor: '#667eea',
                          borderWidth: 2
                        }
                      }
                    }
                  }}
                />
              </Box>
              
              {/* Profile Save Button */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  startIcon={savingProfile ? <CircularProgress size={20} /> : <Save />}
                  sx={{
                    background: 'linear-gradient(135deg, #0277bd 0%, #0288d1 100%)',
                    borderRadius: 2,
                    px: 3,
                    py: 1.2,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    boxShadow: '0 3px 12px rgba(2, 119, 189, 0.3)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #01579b 0%, #0277bd 100%)',
                      boxShadow: '0 4px 16px rgba(2, 119, 189, 0.4)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: '#9ca3af',
                      boxShadow: 'none',
                      transform: 'none'
                    }
                  }}
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Map Preferences Card */}
          <Card 
            sx={{ 
              borderRadius: 4, 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#f3e8ff',
                    borderRadius: '50%',
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Map sx={{ fontSize: 24, color: '#7c3aed' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151' }}>
                  Map Preferences
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 4 }}>
                Customize which maps appear in your navigation menu for a personalized experience.
              </Typography>

              {/* Neighborhood Maps Section */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Visibility sx={{ fontSize: 20, color: '#059669' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                    Neighborhood Maps
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {availableMaps
                    .filter(map => map.category === 'neighborhood')
                    .map((map) => (
                      <Box 
                        key={map.id}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          p: 2.5,
                          borderRadius: 2,
                          backgroundColor: localSettings.visibleMaps.includes(map.id) ? '#f0fdf4' : '#f9fafb',
                          border: `1px solid ${localSettings.visibleMaps.includes(map.id) ? '#bbf7d0' : '#e5e7eb'}`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: localSettings.visibleMaps.includes(map.id) ? '#ecfdf5' : '#f3f4f6'
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#374151' }}>
                            {map.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Neighborhood exploration map
                          </Typography>
                        </Box>
                        <Switch
                          checked={localSettings.visibleMaps.includes(map.id)}
                          onChange={() => handleMapToggle(map.id)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#059669',
                              '&:hover': {
                                backgroundColor: 'rgba(5, 150, 105, 0.04)'
                              }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#059669'
                            }
                          }}
                        />
                      </Box>
                    ))}
                </Box>
              </Box>

              {/* Other Maps Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Map sx={{ fontSize: 20, color: '#dc2626' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                    Other Maps
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {availableMaps
                    .filter(map => map.category === 'other')
                    .map((map) => (
                      <Box 
                        key={map.id}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          p: 2.5,
                          borderRadius: 2,
                          backgroundColor: localSettings.visibleMaps.includes(map.id) ? '#fef2f2' : '#f9fafb',
                          border: `1px solid ${localSettings.visibleMaps.includes(map.id) ? '#fecaca' : '#e5e7eb'}`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: localSettings.visibleMaps.includes(map.id) ? '#fee2e2' : '#f3f4f6'
                          }
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: '#374151' }}>
                            {map.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Global exploration map
                          </Typography>
                        </Box>
                        <Switch
                          checked={localSettings.visibleMaps.includes(map.id)}
                          onChange={() => handleMapToggle(map.id)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#dc2626',
                              '&:hover': {
                                backgroundColor: 'rgba(220, 38, 38, 0.04)'
                              }
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#dc2626'
                            }
                          }}
                        />
                      </Box>
                    ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Save Settings Section */}
        <Card 
          sx={{ 
            borderRadius: 4, 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 0.5 }}>
                  Save Map Preferences
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Your map visibility preferences will be saved locally in your browser
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                size="large"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    background: '#9ca3af',
                    boxShadow: 'none',
                    transform: 'none'
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save Map Preferences'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SettingsPage;