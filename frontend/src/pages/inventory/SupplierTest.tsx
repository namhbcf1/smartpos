import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import api from '../../services/api';

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  is_active: boolean;
}

const SupplierTest: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading suppliers...');
      const response = await api.get<{
        success: boolean;
        data: {
          data: Supplier[];
          pagination: any;
        };
      }>('/suppliers?is_active=true&limit=100');
      
      console.log('Suppliers response:', response);
      
      if (response.success && response.data?.data) {
        setSuppliers(response.data.data);
        console.log('Suppliers loaded:', response.data.data);
      } else {
        setSuppliers([]);
        setError('Không có dữ liệu nhà cung cấp');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setError('Lỗi khi tải danh sách nhà cung cấp: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadDebugInfo = async () => {
    try {
      console.log('Loading debug info...');
      const response = await api.get('/suppliers/debug');
      console.log('Debug response:', response);
      setDebugInfo(response);
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  const createSampleSuppliers = async () => {
    try {
      console.log('Creating sample suppliers...');
      const response = await api.post('/suppliers/create-samples', {});
      console.log('Create samples response:', response);
      if (response.success) {
        await loadSuppliers();
        await loadDebugInfo();
      }
    } catch (error) {
      console.error('Error creating sample suppliers:', error);
    }
  };

  useEffect(() => {
    loadSuppliers();
    loadDebugInfo();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Test Nhà Cung Cấp
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={loadSuppliers} disabled={loading}>
          Tải lại danh sách
        </Button>
        <Button variant="outlined" onClick={loadDebugInfo}>
          Xem debug info
        </Button>
        <Button variant="outlined" onClick={createSampleSuppliers}>
          Tạo dữ liệu mẫu
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Danh sách nhà cung cấp ({suppliers.length})
          </Typography>
          
          {suppliers.length === 0 ? (
            <Typography color="text.secondary">
              Không có nhà cung cấp nào
            </Typography>
          ) : (
            <List>
              {suppliers.map((supplier) => (
                <ListItem key={supplier.id} divider>
                  <ListItemText
                    primary={supplier.name}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          ID: {supplier.id} | Liên hệ: {supplier.contact_person || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Phone: {supplier.phone || 'N/A'} | Email: {supplier.email || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Trạng thái: {supplier.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {debugInfo && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SupplierTest;
