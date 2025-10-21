/**
 * Login Screen
 * Handles user authentication for the mobile app
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { isConnected } = useNetwork();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.'
      );
      return;
    }

    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });
    } catch (error) {
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    card: {
      padding: 20,
      marginHorizontal: 10,
    },
    logo: {
      alignSelf: 'center',
      marginBottom: 30,
    },
    title: {
      textAlign: 'center',
      marginBottom: 10,
      color: theme.colors.primary,
    },
    subtitle: {
      textAlign: 'center',
      marginBottom: 30,
      color: theme.colors.onSurfaceVariant,
    },
    input: {
      marginBottom: 15,
    },
    passwordContainer: {
      position: 'relative',
    },
    passwordToggle: {
      position: 'absolute',
      right: 10,
      top: 15,
      zIndex: 1,
    },
    loginButton: {
      marginTop: 20,
      paddingVertical: 8,
    },
    offlineIndicator: {
      backgroundColor: theme.colors.error,
      padding: 10,
      alignItems: 'center',
    },
    offlineText: {
      color: theme.colors.onError,
      fontWeight: 'bold',
    },
    footer: {
      marginTop: 30,
      alignItems: 'center',
    },
    footerText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {!isConnected && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            No Internet Connection
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <View style={styles.logo}>
            <Ionicons
              name="storefront"
              size={80}
              color={theme.colors.primary}
            />
          </View>

          <Title style={styles.title}>Smart POS Mobile</Title>
          <Paragraph style={styles.subtitle}>
            Sign in to access your POS system
          </Paragraph>

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            returnKeyType="next"
            disabled={isLoading}
            left={<TextInput.Icon icon="account" />}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showPassword}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              disabled={isLoading}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            disabled={isLoading || !isConnected}
            loading={isLoading}
            icon="login"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          {isLoading && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" />
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Smart POS Mobile v1.0.0
            </Text>
            <Text style={styles.footerText}>
              © 2024 Smart POS Team
            </Text>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}