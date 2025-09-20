import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  Search,
  ShoppingCart,
  Payment,
} from '@mui/icons-material';
import { fetchAPI } from '@shared/services/api';
import { Product, CartItem } from '@shared/types';

const POSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchAPI('/products?in_stock_only=true&sort_by=name&sort_order=asc&limit=50');
      
      if (response.success && response.data) {
        const mappedProducts = response.data.map((product: any) => ({
          ...product,
          category_id: product.category_id ?? product.categoryId,
          stock: product.stock ?? product.stockQuantity,
          created_at: product.created_at ?? product.createdAt,
          updated_at: product.updated_at ?? product.updatedAt,
          min_stock: product.min_stock ?? product.minStockLevel || 0
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add product to cart
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: product.id,
        product,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
      };
      setCart([...cart, newItem]);
    }
  };

  // Update cart item quantity
  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
        : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Grid container spacing={3}>
        {/* Products Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                  Sản phẩm ({filteredProducts.length})
                </Typography>
                <Button variant="outlined" onClick={fetchProducts}>
                  Làm mới
                </Button>
              </Box>

              {/* Search */}
              <TextField
                fullWidth
                placeholder="Tìm kiếm sản phẩm, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {/* Products Grid */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <Typography>Đang tải sản phẩm...</Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 4 },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onClick={() => addToCart(product)}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" noWrap>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            SKU: {product.sku}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Tồn: {product.stock}
                          </Typography>
                          <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                            {product.price.toLocaleString('vi-VN')} ₫
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<Add />}
                            fullWidth
                            sx={{ mt: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product);
                            }}
                          >
                            Thêm
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                  <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Giỏ hàng ({cart.length})
                </Typography>
                {cart.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={clearCart}
                  >
                    Xóa tất cả
                  </Button>
                )}
              </Box>

              {cart.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Giỏ hàng trống
                </Typography>
              ) : (
                <>
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {cart.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={item.product.name}
                          secondary={`${item.unit_price.toLocaleString('vi-VN')} ₫ x ${item.quantity}`}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Remove />
                          </IconButton>
                          <Typography>{item.quantity}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Add />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  {/* Totals */}
                  <Box sx={{ space: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Tạm tính:</Typography>
                      <Typography>{subtotal.toLocaleString('vi-VN')} ₫</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Thuế (10%):</Typography>
                      <Typography>{tax.toLocaleString('vi-VN')} ₫</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Tổng cộng:</Typography>
                      <Typography variant="h6" color="primary">
                        {total.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Payment />}
                    sx={{ mt: 2 }}
                    onClick={() => alert('Chức năng thanh toán sẽ được phát triển')}
                  >
                    Thanh toán ({total.toLocaleString('vi-VN')} ₫)
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default POSPage;
