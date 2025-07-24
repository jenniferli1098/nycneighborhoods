import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Avatar,
  Paper,
  Fade
} from '@mui/material';
import {
  LocationOn,
  Save,
  Delete,
  Close
} from '@mui/icons-material';

interface BaseVisitDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  loading: boolean;
  error: string;
  onSave: () => void;
  onDelete?: () => void;
  saveButtonText?: string;
  deleteButtonText?: string;
  showDeleteButton?: boolean;
  showRankingButton?: boolean;
  onRankingClick?: () => void;
  ratingButtonText?: string;
  children: React.ReactNode;
}

const BaseVisitDialog: React.FC<BaseVisitDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  loading,
  error,
  onSave,
  onDelete,
  saveButtonText = "Save",
  deleteButtonText = "Delete",
  showDeleteButton = false,
  showRankingButton = false,
  onRankingClick,
  ratingButtonText = "Rate",
  children
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #400B8B 0%, #B07FF6 100%)',
        color: 'white',
        borderRadius: '16px 16px 0 0',
        position: 'relative'
      }}>
        <Box className="flex items-center justify-between">
          <Box className="flex items-center">
            <Avatar sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <LocationOn />
            </Avatar>
            <Box>
              <Typography variant="h6" className="font-bold">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            onClick={onClose}
            sx={{ 
              color: 'white',
              minWidth: 'auto',
              borderRadius: '50%',
              width: 40,
              height: 40
            }}
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ 
        background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
        pt: 3
      }}>
        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'center'
                }
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}
        
        <Paper 
          elevation={1}
          sx={{ 
            p: 3,
            borderRadius: 3,
            background: 'white',
            border: '1px solid #e0e0e0'
          }}
        >
          {children}
        </Paper>
      </DialogContent>
      
      <DialogActions sx={{ 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '0 0 16px 16px',
        p: 3,
        gap: 2
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            borderColor: '#9e9e9e',
            color: '#666',
            '&:hover': {
              borderColor: '#757575',
              background: 'rgba(158, 158, 158, 0.1)'
            }
          }}
        >
          Cancel
        </Button>
        
        {showDeleteButton && onDelete && (
          <Button 
            onClick={onDelete} 
            variant="outlined"
            disabled={loading}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 'bold',
              borderColor: '#f44336',
              color: '#f44336',
              '&:hover': {
                borderColor: '#d32f2f',
                background: 'rgba(244, 67, 54, 0.1)'
              }
            }}
          >
            <Delete sx={{ mr: 1 }} />
            {deleteButtonText}
          </Button>
        )}
        
        {showRankingButton && onRankingClick && (
          <Button 
            onClick={onRankingClick}
            variant="outlined"
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 'bold',
              borderColor: '#ff9800',
              color: '#ff9800',
              '&:hover': {
                borderColor: '#f57c00',
                background: 'rgba(255, 152, 0, 0.1)'
              }
            }}
          >
            {ratingButtonText}
          </Button>
        )}
        
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={loading}
          sx={{
            background: 'linear-gradient(45deg, #400B8B 30%, #B07FF6 90%)',
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 'bold',
            px: 4,
            py: 1.5,
            boxShadow: '0 4px 12px rgba(64, 11, 139, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #350973 30%, #9c6fd6 90%)',
              boxShadow: '0 6px 16px rgba(64, 11, 139, 0.4)'
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)'
            }
          }}
        >
          <Save sx={{ mr: 1 }} />
          {loading ? 'Saving...' : saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BaseVisitDialog;