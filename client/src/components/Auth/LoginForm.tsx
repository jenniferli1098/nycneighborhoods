import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Alert 
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} className="p-6 max-w-md mx-auto">
      <Typography variant="h4" className="text-center mb-6">
        Sign In
      </Typography>
      
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          className="mt-4"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
        
        <Button
          fullWidth
          variant="text"
          onClick={onSwitchToRegister}
          className="mt-2"
        >
          Don't have an account? Sign Up
        </Button>
      </Box>
    </Paper>
  );
};

export default LoginForm;