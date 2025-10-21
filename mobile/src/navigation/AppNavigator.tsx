/**
 * Main App Navigator
 * Handles navigation between authenticated and unauthenticated states
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'react-native-paper';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import POSScreen from '../screens/pos/POSScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import CustomersScreen from '../screens/customers/CustomersScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Detail Screens
import ProductDetailScreen from '../screens/inventory/ProductDetailScreen';
import CustomerDetailScreen from '../screens/customers/CustomerDetailScreen';
import SaleDetailScreen from '../screens/pos/SaleDetailScreen';
import BarcodeScanner from '../screens/common/BarcodeScanner';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator for authenticated users
function MainTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'POS') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Smart POS Dashboard',
        }}
      />
      <Tab.Screen
        name="POS"
        component={POSScreen}
        options={{
          title: 'POS',
          headerTitle: 'Point of Sale',
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: 'Inventory',
          headerTitle: 'Inventory Management',
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          title: 'Customers',
          headerTitle: 'Customer Management',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Reports',
          headerTitle: 'Sales Reports',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerTitle: 'App Settings',
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack for unauthenticated users
function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {user ? (
        <>
          {/* Main authenticated flow */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />

          {/* Modal screens */}
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Product Details',
            }}
          />
          <Stack.Screen
            name="CustomerDetail"
            component={CustomerDetailScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Customer Details',
            }}
          />
          <Stack.Screen
            name="SaleDetail"
            component={SaleDetailScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Sale Details',
            }}
          />
          <Stack.Screen
            name="BarcodeScanner"
            component={BarcodeScanner}
            options={{
              presentation: 'fullScreenModal',
              headerShown: true,
              title: 'Scan Barcode',
            }}
          />
        </>
      ) : (
        /* Unauthenticated flow */
        <Stack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </Stack.Navigator>
  );
}