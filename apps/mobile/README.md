# Hymnal Mobile App MVP

A React Native mobile application built with Expo for browsing and playing hymns with offline capabilities.

## Features Implemented

### 🧭 Navigation Structure
- **Drawer Navigator**: Main navigation menu with sections for Songs, Favorites, Recent, Search, Downloads, Settings, and About
- **Bottom Tab Navigator**: Quick access to Home, Search, Favorites, and Downloads
- **Stack Navigators**: Separate navigation stacks for different app sections
- **Authentication Flow**: Protected routes with login, register, forgot password, and reset password screens
- **Deep Linking**: Configured for navigation to specific songs and sections
- **Loading & Error Screens**: Proper loading states and error handling

### 📱 Song List Screen
- **Efficient Rendering**: Uses FlashList for optimal performance with large datasets
- **Search Functionality**: Real-time search with debounce for performance
- **Filtering Options**: Filter by categories, recently viewed, favorites, and downloaded status
- **Sorting Options**: Sort by song number, title, or recently played
- **Pull-to-Refresh**: Refresh song list with pull gesture
- **Infinite Scrolling**: Pagination support for large song collections
- **Visual Indicators**: Icons for downloaded songs and favorites
- **Skeleton Loading**: Smooth loading states for better UX

### 📖 Song View Screen with Lyrics Mode
- **Scrollable Lyrics**: Properly formatted lyrics display with smooth scrolling
- **Font Size Control**: Adjustable font size with +/- buttons
- **Auto-Scrolling**: Automatic scrolling with adjustable speed control
- **Song Information**: Header with title, number, and author details
- **Swipe Navigation**: Navigate between songs with left/right swipe gestures
- **Favorite Toggle**: Mark/unmark songs as favorites
- **Night Mode**: Dark theme support for better reading in low light
- **Responsive Design**: Adapts to different screen sizes and orientations

### 🎵 Basic Audio Playback
- **Audio Service**: Centralized audio management using react-native-track-player
- **Playback Controls**: Play, pause, stop, skip forward/backward, and seek
- **Progress Display**: Real-time progress bar with elapsed and remaining time
- **Volume Control**: Adjustable volume with slider
- **Background Playback**: Continue playing when app is in background
- **Notification Controls**: Media controls in notification panel
- **Error Handling**: Robust error handling for audio loading and playback
- **Audio Caching**: Intelligent caching for frequently played tracks

### 🔐 Authentication Flow
- **Login/Register**: Secure authentication with form validation
- **Token Management**: Secure storage of authentication tokens using AsyncStorage and SecureStore
- **Password Reset**: Complete forgot password and reset password flow
- **Session Management**: Automatic token refresh and session handling
- **Biometric Authentication**: Fingerprint/Face ID support for supported devices
- **Loading States**: Proper loading indicators during authentication
- **Error Handling**: Comprehensive error handling with user feedback
- **Social Login Ready**: Architecture prepared for social login integration

### 📱 Offline Access for Downloaded Songs
- **Download Manager**: Comprehensive system for downloading songs, lyrics, notation, and audio
- **Storage Management**: Size limitations, usage tracking, and cleanup options
- **Download Progress**: Visual indicators for download status and progress
- **Background Downloads**: Continue downloads when app is in background
- **Offline Detection**: Automatic detection and switching to offline mode
- **Sync Mechanism**: Synchronize offline changes when back online
- **Cache Management**: Intelligent caching with automatic cleanup

### ⚙️ Settings Screen
- **Account Management**: Profile editing, password change, and logout functionality
- **Theme Selection**: Light, dark, and system theme options with live preview
- **Font Size Adjustment**: Customizable font size for lyrics with live preview
- **Storage Management**: Usage statistics, cleanup options, and storage limits
- **Download Preferences**: Auto-download settings, default content types
- **Notification Settings**: Control download notifications and other alerts
- **Biometric Settings**: Enable/disable biometric authentication
- **About Section**: App information, version, credits, and legal links
- **Support Options**: Contact support, privacy policy, and terms of service

## Technical Architecture

### Navigation
- **React Navigation 6**: Latest navigation library with type safety
- **Nested Navigators**: Drawer → Tab → Stack navigation hierarchy
- **Navigation Service**: Centralized navigation management
- **Deep Linking**: URL-based navigation support

### State Management
- **React Context**: Authentication state management
- **AsyncStorage**: Local data persistence
- **SecureStore**: Secure token storage

### Audio
- **react-native-track-player**: Professional audio playback
- **Background Audio**: Continues playing when app is backgrounded
- **Media Session**: Integration with system media controls

### UI/UX
- **Expo Vector Icons**: Consistent iconography
- **React Native Gesture Handler**: Smooth gesture interactions
- **React Native Reanimated**: High-performance animations
- **FlashList**: Optimized list rendering
- **Safe Area Context**: Proper safe area handling

### Security
- **Expo Local Authentication**: Biometric authentication
- **Expo Secure Store**: Encrypted storage for sensitive data
- **Token-based Auth**: JWT token management

## Getting Started

### Prerequisites
- Node.js 16 or later
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/simulator**:
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal

### Development Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start --clear

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Type checking
npx tsc --noEmit
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── AudioPlayer.tsx  # Audio playback component
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx # Main navigation setup
│   ├── NavigationService.ts # Navigation utilities
│   └── types.ts        # Navigation type definitions
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ForgotPasswordScreen.tsx
│   │   └── ResetPasswordScreen.tsx
│   ├── songs/         # Song-related screens
│   │   ├── SongListScreen.tsx
│   │   └── SongViewScreen.tsx
│   ├── settings/      # Settings screens
│   │   └── SettingsScreen.tsx
│   └── LoadingScreen.tsx
└── services/          # Business logic services
    ├── AudioService.ts    # Audio playback management
    └── DownloadManager.ts # Download and offline management
```

## Key Dependencies

- **@react-navigation/native**: Navigation framework
- **@react-navigation/drawer**: Drawer navigation
- **@react-navigation/bottom-tabs**: Tab navigation
- **@react-navigation/stack**: Stack navigation
- **react-native-track-player**: Audio playback
- **@shopify/flash-list**: High-performance lists
- **react-native-gesture-handler**: Gesture recognition
- **react-native-reanimated**: Animations
- **@react-native-async-storage/async-storage**: Local storage
- **expo-secure-store**: Secure storage
- **expo-local-authentication**: Biometric authentication
- **expo-file-system**: File system access
- **expo-network**: Network status

## Features Ready for Extension

### Backend Integration
- Authentication service integration
- Song data API integration
- User preferences sync
- Download progress tracking

### Enhanced Features
- Social sharing
- Playlist creation
- Song annotations
- Multi-language support
- Advanced search filters
- Song recommendations

### Performance Optimizations
- Image lazy loading
- Audio preloading
- Background sync
- Offline-first architecture

## Testing

The app includes comprehensive error handling and loading states. To test different scenarios:

1. **Authentication Flow**: Test login, registration, and password reset
2. **Offline Mode**: Disable network to test offline functionality
3. **Audio Playback**: Test play, pause, seek, and background playback
4. **Downloads**: Test song downloads and storage management
5. **Navigation**: Test deep linking and navigation flows
6. **Settings**: Test theme changes, font size, and preferences

## Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types for new features
3. Include error handling and loading states
4. Test on both iOS and Android platforms
5. Update documentation for new features

## License

This project is part of the Hymnal App MVP and follows the project's licensing terms.