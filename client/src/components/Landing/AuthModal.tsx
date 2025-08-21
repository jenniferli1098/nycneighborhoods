import React from 'react';
import { Dialog, DialogContent, IconButton, Box } from '@mui/material';
import { Close } from '@mui/icons-material';
import LoginForm from '../Auth/LoginForm';
import RegisterForm from '../Auth/RegisterForm';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onSwitchMode: (mode: 'login' | 'register') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, mode, onSwitchMode }) => {
  const handleSwitchToLogin = () => {
    onSwitchMode('login');
  };

  const handleSwitchToRegister = () => {
    onSwitchMode('register');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'transparent',
          boxShadow: 'none',
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1200,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          }}
        >
          <Close />
        </IconButton>

        {/* Auth Forms */}
        <Box>
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={handleSwitchToRegister} />
          ) : (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;