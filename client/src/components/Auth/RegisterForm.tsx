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

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(username, email, password, '', '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} className="p-6 max-w-md mx-auto">
      <Typography variant="h4" className="text-center mb-6">
        Sign Up
      </Typography>
      
      {error && (
        <Alert severity="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} className="space-y-4">
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        
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
          helperText="Minimum 6 characters"
        />
        
        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          className="mt-4"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
        
        <Button
          fullWidth
          variant="text"
          onClick={onSwitchToLogin}
          className="mt-2"
        >
          Already have an account? Sign In
        </Button>
      </Box>
    </Paper>
  );
};

export default RegisterForm;