import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Rating,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { comprehensiveAPI } from '../services/business/comprehensiveApi';

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  rating?: number;
  total_orders?: number;
  last_order_date?: string;
  performance_score?: number;
}

interface SupplierSelectorProps {
  selectedSupplierId?: number;
  onSupplierChange: (supplierId: number | null) => void;
  showPerformanceMetrics?: boolean;
  allowCreateNew?: boolean;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  selectedSupplierId,
  onSupplierChange,
  showPerformanceMetrics = false,
  allowCreateNew = true
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await comprehensiveAPI.suppliers.getSuppliers();
      const suppliersData = response.data || [];
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    try {
      const response = await comprehensiveAPI.post('/suppliers', newSupplier);
      const createdSupplier = response.data;
      setSuppliers(prev => [...prev, createdSupplier]);
      onSupplierChange(createdSupplier.id);
      setDialogOpen(false);
      setNewSupplier({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel>Select Supplier</InputLabel>
        <Select
          value={selectedSupplierId || ''}
          onChange={(e) => onSupplierChange(e.target.value ? Number(e.target.value) : null)}
          label="Select Supplier"
        >
          <MenuItem value="">
            <em>No Supplier</em>
          </MenuItem>
          {suppliers.map((supplier) => (
            <MenuItem key={supplier.id} value={supplier.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">{supplier.name}</Typography>
                  {supplier.contact_person && (
                    <Typography variant="caption" color="text.secondary">
                      Contact: {supplier.contact_person}
                    </Typography>
                  )}
                </Box>
                {supplier.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="caption">{supplier.rating.toFixed(1)}</Typography>
                  </Box>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {allowCreateNew && (
        <Button
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ mt: 1 }}
          variant="outlined"
          size="small"
        >
          Add New Supplier
        </Button>
      )}

      {showPerformanceMetrics && selectedSupplier && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Supplier Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} component="div">
                <Typography variant="body2" color="text.secondary">
                  Contact Person
                </Typography>
                <Typography variant="body1">
                  {selectedSupplier.contact_person || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} component="div">
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body1">
                    {selectedSupplier.phone || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} component="div">
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body1">
                    {selectedSupplier.email || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} component="div">
                <Typography variant="body2" color="text.secondary">
                  Performance Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Rating
                    value={selectedSupplier.rating || 0}
                    readOnly
                    size="small"
                    precision={0.1}
                  />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({selectedSupplier.rating?.toFixed(1) || 'N/A'})
                  </Typography>
                </Box>
              </Grid>
              {selectedSupplier.total_orders && (
                <Grid item xs={12} sm={6} component="div">
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                  <Chip
                    label={selectedSupplier.total_orders}
                    color="primary"
                    size="small"
                  />
                </Grid>
              )}
              {selectedSupplier.last_order_date && (
                <Grid item xs={12} sm={6} component="div">
                  <Typography variant="body2" color="text.secondary">
                    Last Order
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedSupplier.last_order_date).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Supplier Name"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Contact Person"
              value={newSupplier.contact_person}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, contact_person: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Phone"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newSupplier.email}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Address"
              value={newSupplier.address}
              onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSupplier}
            variant="contained"
            disabled={!newSupplier.name.trim()}
          >
            Create Supplier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierSelector;
