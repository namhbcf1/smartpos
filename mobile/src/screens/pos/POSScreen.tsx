/**
 * POS (Point of Sale) Screen
 * Main screen for processing sales transactions on mobile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  FAB,
  useTheme,
  Surface,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from 'react-query';

import { posService } from '../../services/posService';
import { productService } from '../../services/productService';
import ProductSearchBar from '../../components/pos/ProductSearchBar';
import CartItem from '../../components/pos/CartItem';
import PaymentModal from '../../components/pos/PaymentModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  image?: string;
}

export default function POSScreen() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notes, setNotes] = useState('');

  const navigation = useNavigation();
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Fetch recent products for quick access
  const { data: recentProducts, isLoading: loadingProducts } = useQuery(
    'recent-products',
    () => productService.getRecentProducts(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Process sale mutation
  const processSaleMutation = useMutation(
    (saleData: any) => posService.processSale(saleData),
    {
      onSuccess: (data) => {
        Alert.alert(
          'Sale Complete',
          `Sale processed successfully! Total: ${formatCurrency(data.total)}`,
          [
            {
              text: 'New Sale',
              onPress: () => {
                setCart([]);
                setSelectedCustomer(null);
                setNotes('');
                setShowPaymentModal(false);
              },
            },
            {
              text: 'View Receipt',
              onPress: () => {
                navigation.navigate('SaleDetail', { saleId: data.id });
              },
            },
          ]
        );
        queryClient.invalidateQueries('sales');
        queryClient.invalidateQueries('dashboard-stats');
      },
      onError: (error: any) => {
        Alert.alert(
          'Sale Failed',
          error.message || 'Failed to process sale. Please try again.'
        );
      },
    }
  );

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        sku: product.sku,
        image: product.image,
      }]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setCart([]),
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to the cart first.');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePayment = async (paymentData: any) => {
    const saleData = {
      customer_id: selectedCustomer?.id,
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      })),
      payment_method: paymentData.method,
      payment_amount: paymentData.amount,
      notes,
    };

    await processSaleMutation.mutateAsync(saleData);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const openBarcodeScanner = () => {
    navigation.navigate('BarcodeScanner', {
      onScan: (barcode: string) => {
        // Find product by barcode and add to cart
        productService.getProductByBarcode(barcode)
          .then(product => {
            if (product) {
              addToCart(product);
            } else {
              Alert.alert('Product Not Found', 'No product found with this barcode.');
            }
          })
          .catch(error => {
            Alert.alert('Error', 'Failed to find product by barcode.');
          });
      },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    searchContainer: {
      marginBottom: 16,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 8,
    },
    quickActionButton: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.onSurface,
    },
    productGrid: {
      marginBottom: 16,
    },
    productCard: {
      margin: 4,
      padding: 12,
      width: '48%',
    },
    productName: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 12,
      color: theme.colors.primary,
    },
    cartContainer: {
      maxHeight: 200,
      marginBottom: 16,
    },
    cartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    cartEmpty: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      padding: 20,
    },
    customerSection: {
      marginBottom: 16,
    },
    selectedCustomer: {
      backgroundColor: theme.colors.primaryContainer,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    totalContainer: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    totalLabel: {
      fontSize: 16,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    grandTotal: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    notesInput: {
      marginBottom: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    clearButton: {
      flex: 1,
    },
    checkoutButton: {
      flex: 2,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
    },
  });

  if (loadingProducts) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <ProductSearchBar onProductSelect={addToCart} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Button
            mode="outlined"
            icon="barcode-scan"
            style={styles.quickActionButton}
            onPress={openBarcodeScanner}
          >
            Scan
          </Button>
          <Button
            mode="outlined"
            icon="account-plus"
            style={styles.quickActionButton}
            onPress={() => {/* TODO: Quick customer creation */}}
          >
            Customer
          </Button>
        </View>

        {/* Recent Products */}
        <Text style={styles.sectionTitle}>Recent Products</Text>
        <FlatList
          data={recentProducts?.slice(0, 6)}
          numColumns={2}
          style={styles.productGrid}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card
              style={styles.productCard}
              onPress={() => addToCart(item)}
            >
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productPrice}>
                {formatCurrency(item.price)}
              </Text>
            </Card>
          )}
        />

        {/* Cart */}
        <View style={styles.cartContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.sectionTitle}>
              Cart ({getTotalItems()} items)
            </Text>
            {cart.length > 0 && (
              <Button
                mode="text"
                icon="delete"
                onPress={clearCart}
                textColor={theme.colors.error}
              >
                Clear
              </Button>
            )}
          </View>

          {cart.length === 0 ? (
            <Text style={styles.cartEmpty}>Cart is empty</Text>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <CartItem
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              )}
            />
          )}
        </View>

        {/* Customer Selection */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <TextInput
            label="Search Customer"
            value={customerSearch}
            onChangeText={setCustomerSearch}
            mode="outlined"
            right={<TextInput.Icon icon="magnify" />}
            placeholder="Enter name or phone"
          />
          {selectedCustomer && (
            <Surface style={styles.selectedCustomer}>
              <Text style={{ fontWeight: 'bold' }}>
                {selectedCustomer.name}
              </Text>
              <Text>{selectedCustomer.phone}</Text>
            </Surface>
          )}
        </View>

        {/* Total */}
        {cart.length > 0 && (
          <Surface style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(getTotal())}
              </Text>
            </View>
            <Divider />
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.grandTotal]}>
                Total:
              </Text>
              <Text style={[styles.totalValue, styles.grandTotal]}>
                {formatCurrency(getTotal())}
              </Text>
            </View>
          </Surface>
        )}

        {/* Notes */}
        <TextInput
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          style={styles.notesInput}
          placeholder="Add notes for this sale..."
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            style={styles.clearButton}
            onPress={clearCart}
            disabled={cart.length === 0}
          >
            Clear Cart
          </Button>
          <Button
            mode="contained"
            style={styles.checkoutButton}
            onPress={handleCheckout}
            disabled={cart.length === 0}
            loading={processSaleMutation.isLoading}
          >
            Checkout
          </Button>
        </View>
      </ScrollView>

      {/* Floating Action Button for Barcode Scanner */}
      <FAB
        style={styles.fab}
        icon="barcode-scan"
        onPress={openBarcodeScanner}
        label="Scan"
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        total={getTotal()}
        onDismiss={() => setShowPaymentModal(false)}
        onPayment={handlePayment}
        loading={processSaleMutation.isLoading}
      />
    </View>
  );
}