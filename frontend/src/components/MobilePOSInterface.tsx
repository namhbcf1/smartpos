import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Fab,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Slide,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  ShoppingCart,
  QrCodeScanner,
  Mic,
  Search,
  Inventory,
  Receipt,
  Analytics,
  Settings,
  Notifications,
  Add,
  Remove,
  Payment,
  SmartToy,
  TouchApp,
  Vibration,
} from '@mui/icons-material';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

interface CartItem extends Product {
  quantity: number;
  serial_numbers?: string[];
}

interface MobilePOSProps {
  onSaleComplete?: (saleData: any) => void;
}

const MobilePOSInterface: React.FC<MobilePOSProps> = ({ onSaleComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  // State Management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Voice Recognition
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'vi-VN';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
      };

      recognitionInstance.onend = () => {
        setIsVoiceActive(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products', {
        params: { limit: 50, search: searchQuery }
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Voice command handler
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('thêm') || lowerCommand.includes('add')) {
      // Extract product name and add to cart
      const productName = lowerCommand.replace(/thêm|add/g, '').trim();
      const product = products.find(p => 
        p.name.toLowerCase().includes(productName) || 
        p.sku.toLowerCase().includes(productName)
      );
      
      if (product) {
        addToCart(product);
        speakResponse(`Đã thêm ${product.name} vào giỏ hàng`);
      } else {
        speakResponse('Không tìm thấy sản phẩm');
      }
    } else if (lowerCommand.includes('thanh toán') || lowerCommand.includes('checkout')) {
      handleCheckout();
      speakResponse('Đang xử lý thanh toán');
    } else if (lowerCommand.includes('xóa giỏ hàng') || lowerCommand.includes('clear cart')) {
      setCart([]);
      speakResponse('Đã xóa giỏ hàng');
    }
  };

  // Text-to-speech response
  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      speechSynthesis.speak(utterance);
    }
  };

  // Start voice recognition
  const startVoiceRecognition = () => {
    if (recognition) {
      setIsVoiceActive(true);
      recognition.start();
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // Remove from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter(item => item.id !== productId);
      }
    });
  };

  // Calculate total
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          serial_numbers: item.serial_numbers || []
        })),
        payment_method: 'cash',
        payment_status: 'paid',
        auto_create_warranty: true
      };

      const response = await api.post('/sales/enhanced', saleData);
      
      if (response.success) {
        setCart([]);
        setIsCartOpen(false);
        speakResponse('Thanh toán thành công');
        
        if (onSaleComplete) {
          onSaleComplete(response.data);
        }

        // Success haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      speakResponse('Lỗi thanh toán, vui lòng thử lại');
    } finally {
      setIsProcessing(false);
    }
  };

  // Barcode scanner - Real camera integration
  const handleBarcodeScanner = async () => {
    try {
      // Real barcode scanning with camera API
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector();
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Create video element for scanning
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        // Detect barcode from video stream
        const barcodes = await barcodeDetector.detect(video);
        
        if (barcodes.length > 0) {
          const scannedCode = barcodes[0].rawValue;
          const product = products.find(p => p.sku === scannedCode);
          
          if (product) {
            addToCart(product);
            speakResponse(`Đã quét ${product.name}`);
          } else {
            speakResponse('Không tìm thấy sản phẩm');
          }
        }
        
        // Stop camera
        stream.getTracks().forEach(track => track.stop());
      } else {
        // Fallback: Manual input
        const scannedCode = prompt('Nhập mã vạch sản phẩm:');
        if (scannedCode) {
          const product = products.find(p => p.sku === scannedCode);
          if (product) {
            addToCart(product);
            speakResponse(`Đã thêm ${product.name}`);
          } else {
            speakResponse('Không tìm thấy sản phẩm');
          }
        }
      }
    } catch (error) {
      console.error('Barcode scanning error:', error);
      speakResponse('Lỗi quét mã vạch');
    }
  };

  // Speed dial actions
  const speedDialActions = [
    {
      icon: <QrCodeScanner />,
      name: 'Quét mã',
      onClick: handleBarcodeScanner,
    },
    {
      icon: <Mic color={isVoiceActive ? 'error' : 'inherit'} />,
      name: 'Voice Command',
      onClick: startVoiceRecognition,
    },
    {
      icon: <Analytics />,
      name: 'AI Insights',
      onClick: () => window.location.href = '/intelligent-dashboard',
    },
    {
      icon: <Receipt />,
      name: 'Lịch sử',
      onClick: () => window.location.href = '/sales',
    },
  ];

  // Product Card Component
  const ProductCard: React.FC<{ product: Product; index: number }> = ({ product, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <Paper
        sx={{
          p: 2,
          mb: 2,
          cursor: 'pointer',
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            boxShadow: theme.shadows[4],
            borderColor: theme.palette.primary.main,
          },
        }}
        onClick={() => addToCart(product)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={product.image_url}
            sx={{ 
              width: 60, 
              height: 60, 
              mr: 2,
              bgcolor: theme.palette.primary.light 
            }}
          >
            {product.name.charAt(0)}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SKU: {product.sku}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="h6" color="primary" sx={{ mr: 2 }}>
                {product.price.toLocaleString('vi-VN')} ₫
              </Typography>
              <Chip
                label={`Còn ${product.stock_quantity}`}
                size="small"
                color={product.stock_quantity > 10 ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
          </Box>

          <IconButton
            color="primary"
            sx={{
              bgcolor: theme.palette.primary.light,
              '&:hover': { bgcolor: theme.palette.primary.main, color: 'white' },
            }}
          >
            <Add />
          </IconButton>
        </Box>
      </Paper>
    </motion.div>
  );

  // Cart Item Component
  const CartItemComponent: React.FC<{ item: CartItem }> = ({ item }) => (
    <ListItem
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        mb: 1,
      }}
    >
      <ListItemIcon>
        <Avatar src={item.image_url} sx={{ width: 40, height: 40 }}>
          {item.name.charAt(0)}
        </Avatar>
      </ListItemIcon>
      
      <ListItemText
        primary={item.name}
        secondary={`${item.price.toLocaleString('vi-VN')} ₫`}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          size="small"
          onClick={() => removeFromCart(item.id)}
          color="error"
        >
          <Remove />
        </IconButton>
        
        <Typography variant="h6" sx={{ mx: 2, minWidth: 30, textAlign: 'center' }}>
          {item.quantity}
        </Typography>
        
        <IconButton
          size="small"
          onClick={() => addToCart(item)}
          color="primary"
        >
          <Add />
        </IconButton>
      </Box>
    </ListItem>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SmartToy sx={{ mr: 2, color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight="bold">
            SmartPOS Mobile
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="primary">
            <Badge badgeContent={notifications.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <IconButton
            color="primary"
            onClick={() => setIsCartOpen(true)}
          >
            <Badge badgeContent={cart.length} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Box>
      </Paper>

      {/* Products List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <AnimatePresence>
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </AnimatePresence>
        
        {products.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Không có sản phẩm nào
            </Typography>
          </Box>
        )}
      </Box>

      {/* Speed Dial */}
      <SpeedDial
        ariaLabel="POS Actions"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      {/* Cart Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpen={() => setIsCartOpen(true)}
        PaperProps={{
          sx: {
            height: '70vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
            Giỏ hàng ({cart.length} sản phẩm)
          </Typography>
          
          <List sx={{ maxHeight: '40vh', overflow: 'auto' }}>
            {cart.map((item) => (
              <CartItemComponent key={item.id} item={item} />
            ))}
          </List>
          
          {cart.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              Giỏ hàng trống
            </Typography>
          )}
          
          {cart.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography variant="h6" color="primary">
                  {calculateTotal().toLocaleString('vi-VN')} ₫
                </Typography>
              </Box>
              
              <motion.div whileTap={{ scale: 0.98 }}>
                <Fab
                  variant="extended"
                  color="primary"
                  fullWidth
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  sx={{ height: 56 }}
                >
                  <Payment sx={{ mr: 1 }} />
                  {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
                </Fab>
              </motion.div>
            </Box>
          )}
        </Box>
      </SwipeableDrawer>

      {/* Voice Recognition Indicator */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
            }}
          >
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderRadius: 3,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Mic sx={{ fontSize: 48, mb: 1 }} />
              </motion.div>
              <Typography variant="body1">
                Đang nghe...
              </Typography>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default MobilePOSInterface;
