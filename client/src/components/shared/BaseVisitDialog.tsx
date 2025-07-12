import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert
} from '@mui/material';

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
  children
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {children}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        {showDeleteButton && onDelete && (
          <Button onClick={onDelete} color="error" disabled={loading}>
            {deleteButtonText}
          </Button>
        )}
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={onSave} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Saving...' : saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BaseVisitDialog;