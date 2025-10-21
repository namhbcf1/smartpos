# Smart POS Mobile Application

A comprehensive React Native mobile application for the Smart POS system, providing full point-of-sale functionality on mobile devices.

## Features

### 🏪 Point of Sale
- **Mobile POS Interface**: Complete sales processing on mobile devices
- **Barcode Scanning**: Built-in barcode scanner for quick product lookup
- **Product Search**: Fast product search and selection
- **Customer Management**: Add and manage customers on the go
- **Payment Processing**: Multiple payment methods including cash, card, and digital payments
- **Receipt Generation**: Print or email receipts directly from the app

### 📦 Inventory Management
- **Stock Levels**: Real-time inventory tracking
- **Low Stock Alerts**: Notifications for products running low
- **Stock Movements**: Track stock in/out movements
- **Product Information**: Detailed product views with images

### 👥 Customer Management
- **Customer Database**: Complete customer information
- **Purchase History**: View customer purchase history
- **Quick Customer Creation**: Add new customers during sales

### 📊 Reports & Analytics
- **Sales Reports**: Daily, weekly, and monthly sales reports
- **Inventory Reports**: Stock levels and movement reports
- **Dashboard Analytics**: Key performance indicators and metrics

### 🔄 Offline Capability
- **Offline Mode**: Continue working without internet connection
- **Data Sync**: Automatic synchronization when connection is restored
- **Offline Queue**: Queue actions to be processed when online

### 🔐 Security & Authentication
- **Secure Login**: JWT-based authentication
- **Role-based Access**: Different access levels for different user roles
- **Data Encryption**: Secure data storage and transmission

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **React Navigation**: Navigation library
- **React Native Paper**: Material Design components
- **Redux Toolkit**: State management
- **React Query**: Data fetching and caching
- **AsyncStorage**: Local data persistence
- **Expo Camera**: Camera and barcode scanning
- **Expo Print**: Receipt printing
- **NetInfo**: Network connectivity monitoring

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Expo Go app on your mobile device (for testing)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart/mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://namhbcf-api.bangachieu2.workers.dev
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - For iOS: `npm run ios`
   - For Android: `npm run android`
   - For web: `npm run web`
   - Or scan the QR code with Expo Go app

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Common components
│   ├── pos/             # POS-specific components
│   └── ui/              # Basic UI components
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication context
│   ├── NetworkContext.tsx # Network connectivity
│   └── NotificationContext.tsx # Push notifications
├── navigation/          # Navigation configuration
│   └── AppNavigator.tsx # Main navigation setup
├── screens/             # Screen components
│   ├── auth/           # Authentication screens
│   ├── dashboard/      # Dashboard screens
│   ├── pos/            # POS screens
│   ├── inventory/      # Inventory screens
│   ├── customers/      # Customer screens
│   ├── reports/        # Reports screens
│   └── settings/       # Settings screens
├── services/            # API and business logic
│   ├── apiClient.ts    # API client configuration
│   ├── posService.ts   # POS-related services
│   └── ...             # Other services
├── store/              # Redux store configuration
├── theme/              # Theme and styling
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Features Implementation

### Barcode Scanning
```typescript
import { BarCodeScanner } from 'expo-barcode-scanner';

// Request camera permissions
const { status } = await BarCodeScanner.requestPermissionsAsync();

// Handle barcode scan
const handleBarCodeScanned = ({ type, data }) => {
  // Look up product by barcode
  productService.getProductByBarcode(data);
};
```

### Offline Capability
```typescript
// Add action to offline queue when offline
const { addToOfflineQueue, isConnected } = useNetwork();

if (!isConnected) {
  addToOfflineQueue({
    type: 'CREATE_SALE',
    data: saleData,
  });
} else {
  await salesApi.createSale(saleData);
}
```

### Push Notifications
```typescript
import * as Notifications from 'expo-notifications';

// Register for push notifications
const token = await Notifications.getExpoPushTokenAsync();

// Handle notification received
Notifications.addNotificationReceivedListener(notification => {
  // Handle notification
});
```

## Building for Production

### Android APK
```bash
eas build --platform android
```

### iOS IPA
```bash
eas build --platform ios
```

### Configuration
Create `eas.json` for build configuration:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- POSScreen.test.tsx
```

## Deployment

### Expo Application Services (EAS)
1. **Configure EAS**
   ```bash
   eas login
   eas build:configure
   ```

2. **Build for stores**
   ```bash
   eas build --platform all
   ```

3. **Submit to stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

### Over-the-Air Updates
```bash
# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

## Performance Optimization

### Bundle Size Optimization
- Use Flipper for performance monitoring
- Implement code splitting with dynamic imports
- Optimize images and assets
- Remove unused dependencies

### Memory Management
- Use FlatList for large lists
- Implement proper cleanup in useEffect
- Avoid memory leaks in async operations

### Network Optimization
- Implement request caching
- Use compression for API responses
- Implement request deduplication

## Security Considerations

### Data Protection
- Store sensitive data in SecureStore
- Implement certificate pinning for API calls
- Use encrypted storage for offline data

### Authentication
- Implement biometric authentication
- Use secure token storage
- Implement session timeout

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **Make your changes**
4. **Add tests for new functionality**
5. **Run tests and linting**
   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```
6. **Commit your changes**
   ```bash
   git commit -m "Add new feature"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/new-feature
   ```
8. **Create a Pull Request**

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **iOS simulator not working**
   ```bash
   npx expo run:ios --device
   ```

3. **Android build errors**
   ```bash
   cd android && ./gradlew clean
   ```

4. **Network connectivity issues**
   - Check API endpoint configuration
   - Verify network permissions
   - Test on different networks

### Debug Mode
```bash
# Enable remote debugging
npm start -- --dev-client

# View logs
npx expo logs
```

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**Smart POS Mobile** - Empowering businesses with mobile point-of-sale solutions.