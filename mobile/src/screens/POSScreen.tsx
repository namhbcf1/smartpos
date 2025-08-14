/**
 * Main POS Screen for SmartPOS Mobile
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addItem,
  removeItem,
  updateItemQuantity,
  setCustomer,
  setPaymentMethod,
  clearCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectCartCustomer,
} from '../store/slices/cartSlice';
import { selectOfflineData, selectIsOnline } from '../store/slices/offlineSlice';
import { offlineService } from '../services/OfflineService';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: number;
  image?: string;
  barcode?: string;
}

interface Category {
  id: number;
  name: string;
  color?: string;
}

const POSScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const cartCustomer = useAppSelector(selectCartCustomer);
  const offlineData = useAppSelector(selectOfflineData);
  const isOnline = useAppSelector(selectIsOnline);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Filter products based on category and search
  const filteredProducts = offlineData.products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = useCallback((product: Product) => {
    if (product.stock_quantity <= 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    dispatch(addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      discount: 0,
      discountType: 'percentage',
      taxRate: 0.1,
    }));
  }, [dispatch]);

  const handleRemoveFromCart = useCallback((itemId: number) => {
    dispatch(removeItem(itemId));
  }, [dispatch]);

  const handleQuantityChange = useCallback((itemId: number, quantity: number) => {
    dispatch(updateItemQuantity({ id: itemId, quantity }));
  }, [dispatch]);

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout.');
      return;
    }

    setShowPaymentModal(true);
  }, [cartItems]);

  const handlePayment = useCallback(async (method: 'cash' | 'card' | 'bank_transfer') => {
    try {
      dispatch(setPaymentMethod(method));
      
      // Create sale data
      const saleData = {
        customer_id: cartCustomer?.id || null,
        items: cartItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: item.discount,
          subtotal: item.subtotal,
        })),
        subtotal: cartTotal,
        tax_amount: cartTotal * 0.1,
        final_amount: cartTotal * 1.1,
        payment_method: method,
        payment_status: 'completed',
        sale_status: 'completed',
      };

      if (isOnline) {
        // Process online
        // await ApiService.createSale(saleData);
        Alert.alert('Success', 'Sale completed successfully!');
      } else {
        // Queue for offline processing
        await offlineService.queueAction(
          'CREATE_SALE',
          '/api/v1/sales',
          'POST',
          saleData,
          'high'
        );
        Alert.alert('Success', 'Sale saved offline. Will sync when online.');
      }

      // Clear cart and close modal
      dispatch(clearCart());
      setShowPaymentModal(false);
      setPaymentAmount('');
      
    } catch (error) {
      console.error('Payment failed:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    }
  }, [cartCustomer, cartItems, cartTotal, isOnline, dispatch]);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleAddToCart(item)}
      disabled={item.stock_quantity <= 0}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productSku}>{item.sku}</Text>
        <Text style={styles.productPrice}>₫{item.price.toLocaleString()}</Text>
        <Text style={[
          styles.productStock,
          item.stock_quantity <= 0 && styles.outOfStock
        ]}>
          Stock: {item.stock_quantity}
        </Text>
      </View>
      {item.stock_quantity <= 0 && (
        <View style={styles.outOfStockOverlay}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemPrice}>₫{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
        >
          <Icon name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
        >
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFromCart(item.id)}
        >
          <Icon name="delete" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.selectedCategory
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SmartPOS</Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]}>
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <TouchableOpacity style={styles.customerButton} onPress={() => setShowCustomerModal(true)}>
            <Icon name="person" size={24} color="#007AFF" />
            <Text style={styles.customerText}>
              {cartCustomer ? cartCustomer.name : 'Customer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Left Panel - Products */}
        <View style={styles.leftPanel}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categories */}
          <FlatList
            data={offlineData.categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
          />

          {/* Products Grid */}
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id.toString()}
            numColumns={isTablet ? 4 : 2}
            style={styles.productsList}
            contentContainerStyle={styles.productsContainer}
          />
        </View>

        {/* Right Panel - Cart */}
        <View style={styles.rightPanel}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Cart ({cartItemCount})</Text>
            {cartItems.length > 0 && (
              <TouchableOpacity onPress={() => dispatch(clearCart())}>
                <Text style={styles.clearCart}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Icon name="shopping-cart" size={48} color="#ccc" />
              <Text style={styles.emptyCartText}>Cart is empty</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cartItems}
                renderItem={renderCartItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.cartList}
              />

              <View style={styles.cartFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>₫{cartTotal.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                  <Text style={styles.checkoutButtonText}>Checkout</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <Text style={styles.modalTitle}>Payment</Text>
            <Text style={styles.paymentTotal}>Total: ₫{cartTotal.toLocaleString()}</Text>
            
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={styles.paymentMethod}
                onPress={() => handlePayment('cash')}
              >
                <Icon name="money" size={32} color="#4CAF50" />
                <Text style={styles.paymentMethodText}>Cash</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.paymentMethod}
                onPress={() => handlePayment('card')}
              >
                <Icon name="credit-card" size={32} color="#2196F3" />
                <Text style={styles.paymentMethodText}>Card</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.paymentMethod}
                onPress={() => handlePayment('bank_transfer')}
              >
                <Icon name="account-balance" size={32} color="#FF9800" />
                <Text style={styles.paymentMethodText}>Transfer</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  offline: {
    backgroundColor: '#FF5722',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  customerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 2,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    padding: 16,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  categoriesList: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  productsList: {
    flex: 1,
  },
  productsContainer: {
    paddingBottom: 16,
  },
  productCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 120,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#4CAF50',
  },
  outOfStock: {
    color: '#FF5722',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  outOfStockText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearCart: {
    color: '#FF5722',
    fontWeight: '500',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  paymentTotal: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#007AFF',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  paymentMethod: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    minWidth: 80,
  },
  paymentMethodText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default POSScreen;