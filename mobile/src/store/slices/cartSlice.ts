/**
 * Shopping cart slice for SmartPOS Mobile
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  subtotal: number;
  image?: string;
  category?: string;
  notes?: string;
}

export interface CartDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

export interface CartCustomer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints?: number;
  discountRate?: number;
}

export interface CartState {
  items: CartItem[];
  customer: CartCustomer | null;
  discount: CartDiscount | null;
  taxRate: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment' | null;
  notes: string;
  isProcessing: boolean;
  lastModified: number;
}

const initialState: CartState = {
  items: [],
  customer: null,
  discount: null,
  taxRate: 0.1, // 10% default tax
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  total: 0,
  paymentMethod: null,
  notes: '',
  isProcessing: false,
  lastModified: Date.now(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'id' | 'quantity' | 'subtotal'>>) => {
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      
      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.subtotal = calculateItemSubtotal(existingItem);
      } else {
        const newItem: CartItem = {
          ...action.payload,
          id: Date.now() + Math.random(),
          quantity: 1,
          subtotal: 0,
        };
        newItem.subtotal = calculateItemSubtotal(newItem);
        state.items.push(newItem);
      }
      
      updateCartTotals(state);
    },

    removeItem: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      updateCartTotals(state);
    },

    updateItemQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = Math.max(0, action.payload.quantity);
        if (item.quantity === 0) {
          state.items = state.items.filter(i => i.id !== action.payload.id);
        } else {
          item.subtotal = calculateItemSubtotal(item);
        }
        updateCartTotals(state);
      }
    },

    updateItemDiscount: (state, action: PayloadAction<{ id: number; discount: number; discountType: 'percentage' | 'fixed' }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.discount = action.payload.discount;
        item.discountType = action.payload.discountType;
        item.subtotal = calculateItemSubtotal(item);
        updateCartTotals(state);
      }
    },

    updateItemNotes: (state, action: PayloadAction<{ id: number; notes: string }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.notes = action.payload.notes;
        state.lastModified = Date.now();
      }
    },

    setCustomer: (state, action: PayloadAction<CartCustomer | null>) => {
      state.customer = action.payload;
      updateCartTotals(state);
    },

    setCartDiscount: (state, action: PayloadAction<CartDiscount | null>) => {
      state.discount = action.payload;
      updateCartTotals(state);
    },

    setTaxRate: (state, action: PayloadAction<number>) => {
      state.taxRate = action.payload;
      updateCartTotals(state);
    },

    setPaymentMethod: (state, action: PayloadAction<CartState['paymentMethod']>) => {
      state.paymentMethod = action.payload;
      state.lastModified = Date.now();
    },

    setNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
      state.lastModified = Date.now();
    },

    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },

    clearCart: (state) => {
      state.items = [];
      state.customer = null;
      state.discount = null;
      state.paymentMethod = null;
      state.notes = '';
      state.subtotal = 0;
      state.discountAmount = 0;
      state.taxAmount = 0;
      state.total = 0;
      state.isProcessing = false;
      state.lastModified = Date.now();
    },

    // Bulk operations
    addMultipleItems: (state, action: PayloadAction<Omit<CartItem, 'id' | 'subtotal'>[]>) => {
      action.payload.forEach(itemData => {
        const existingItem = state.items.find(item => item.productId === itemData.productId);
        
        if (existingItem) {
          existingItem.quantity += itemData.quantity;
          existingItem.subtotal = calculateItemSubtotal(existingItem);
        } else {
          const newItem: CartItem = {
            ...itemData,
            id: Date.now() + Math.random(),
            subtotal: 0,
          };
          newItem.subtotal = calculateItemSubtotal(newItem);
          state.items.push(newItem);
        }
      });
      
      updateCartTotals(state);
    },

    // Quick actions
    incrementItem: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.quantity += 1;
        item.subtotal = calculateItemSubtotal(item);
        updateCartTotals(state);
      }
    },

    decrementItem: (state, action: PayloadAction<number>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.quantity = Math.max(0, item.quantity - 1);
        if (item.quantity === 0) {
          state.items = state.items.filter(i => i.id !== action.payload);
        } else {
          item.subtotal = calculateItemSubtotal(item);
        }
        updateCartTotals(state);
      }
    },

    // Apply loyalty discount
    applyLoyaltyDiscount: (state) => {
      if (state.customer?.discountRate) {
        state.discount = {
          type: 'percentage',
          value: state.customer.discountRate,
          reason: 'Loyalty discount',
        };
        updateCartTotals(state);
      }
    },

    // Restore cart from saved state (for offline recovery)
    restoreCart: (state, action: PayloadAction<Partial<CartState>>) => {
      Object.assign(state, action.payload);
      updateCartTotals(state);
    },
  },
});

// Helper functions
function calculateItemSubtotal(item: CartItem): number {
  const baseAmount = item.price * item.quantity;
  let discountAmount = 0;
  
  if (item.discount > 0) {
    if (item.discountType === 'percentage') {
      discountAmount = baseAmount * (item.discount / 100);
    } else {
      discountAmount = item.discount;
    }
  }
  
  return Math.max(0, baseAmount - discountAmount);
}

function updateCartTotals(state: CartState): void {
  // Calculate subtotal
  state.subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Apply customer discount
  let customerDiscountAmount = 0;
  if (state.customer?.discountRate) {
    customerDiscountAmount = state.subtotal * (state.customer.discountRate / 100);
  }
  
  // Apply cart discount
  let cartDiscountAmount = 0;
  if (state.discount) {
    if (state.discount.type === 'percentage') {
      cartDiscountAmount = state.subtotal * (state.discount.value / 100);
    } else {
      cartDiscountAmount = state.discount.value;
    }
  }
  
  state.discountAmount = customerDiscountAmount + cartDiscountAmount;
  
  // Calculate tax on discounted amount
  const taxableAmount = Math.max(0, state.subtotal - state.discountAmount);
  state.taxAmount = taxableAmount * state.taxRate;
  
  // Calculate total
  state.total = taxableAmount + state.taxAmount;
  
  state.lastModified = Date.now();
}

export const {
  addItem,
  removeItem,
  updateItemQuantity,
  updateItemDiscount,
  updateItemNotes,
  setCustomer,
  setCartDiscount,
  setTaxRate,
  setPaymentMethod,
  setNotes,
  setProcessing,
  clearCart,
  addMultipleItems,
  incrementItem,
  decrementItem,
  applyLoyaltyDiscount,
  restoreCart,
} = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartSubtotal = (state: { cart: CartState }) => state.cart.subtotal;
export const selectCartCustomer = (state: { cart: CartState }) => state.cart.customer;
export const selectCartItemCount = (state: { cart: CartState }) => 
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartIsEmpty = (state: { cart: CartState }) => state.cart.items.length === 0;
export const selectCartIsProcessing = (state: { cart: CartState }) => state.cart.isProcessing;