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
  IconButton,
  Divider
} from '@mui/material';
import {
  LocationOn,
  Save,
  Delete,
  Close,
  Star
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
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)'
        }
      }}
    >
      {/* Clean Header */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 3,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocationOn sx={{ color: '#6366f1', fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: '#111827',
                lineHeight: 1.2
              }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ 
                  color: '#6b7280',
                  mt: 0.5
                }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ 
              color: '#9ca3af',
              '&:hover': { 
                backgroundColor: '#f3f4f6',
                color: '#6b7280'
              }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: '#e5e7eb' }} />
      </DialogTitle>
      
      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2'
            }}
          >
            {error}
          </Alert>
        )}
        
        {children}
      </DialogContent>
      
      {/* Actions */}
      <DialogActions sx={{ 
        p: 3, 
        pt: 2, 
        gap: 2,
        borderTop: '1px solid #e5e7eb'
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            color: '#6b7280',
            borderColor: '#d1d5db',
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          Cancel
        </Button>
        
        {showRankingButton && onRankingClick && (
          <Button 
            onClick={onRankingClick}
            variant="outlined"
            startIcon={<Star />}
            sx={{
              color: '#f59e0b',
              borderColor: '#f59e0b',
              '&:hover': {
                borderColor: '#d97706',
                backgroundColor: '#fffbeb'
              }
            }}
          >
            {ratingButtonText}
          </Button>
        )}
        
        {showDeleteButton && onDelete && (
          <Button 
            onClick={onDelete} 
            variant="outlined"
            disabled={loading}
            startIcon={<Delete />}
            sx={{
              color: '#ef4444',
              borderColor: '#ef4444',
              '&:hover': {
                borderColor: '#dc2626',
                backgroundColor: '#fef2f2'
              }
            }}
          >
            {deleteButtonText}
          </Button>
        )}
        
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={loading}
          startIcon={<Save />}
          sx={{
            backgroundColor: '#6366f1',
            '&:hover': {
              backgroundColor: '#4f46e5'
            },
            '&:disabled': {
              backgroundColor: '#d1d5db'
            }
          }}
        >
          {loading ? 'Saving...' : saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BaseVisitDialog;