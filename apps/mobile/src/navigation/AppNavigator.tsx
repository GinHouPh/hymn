import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

import { RootStackParamList, MainDrawerParamList, HomeTabParamList, linking } from './types';
import { navigationRef } from './NavigationService';

// Screens
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import SongListScreen from '../screens/songs/SongListScreen';
import SongViewScreen from '../screens/songs/SongViewScreen';
import FavoritesScreen from '../screens/songs/FavoritesScreen';
import RecentScreen from '../screens/songs/RecentScreen';
import SearchScreen from '../screens/songs/SearchScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import DownloadsScreen from '../screens/downloads/DownloadsScreen';
import AboutScreen from '../screens/about/AboutScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator();
const MainDrawer = createDrawerNavigator<MainDrawerParamList>();
const HomeTab = createBottomTabNavigator<HomeTabParamList>();

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function HomeTabNavigator() {
  return (
    <HomeTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'SongList') {
            iconName = focused ? 'musical-notes' : 'musical-notes-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Recent') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <HomeTab.Screen 
        name="SongList" 
        component={SongListScreen}
        options={{ tabBarLabel: 'Songs' }}
      />
      <HomeTab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Favorites' }}
      />
      <HomeTab.Screen 
        name="Recent" 
        component={RecentScreen}
        options={{ tabBarLabel: 'Recent' }}
      />
      <HomeTab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
    </HomeTab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainDrawer.Navigator
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#2563eb',
        drawerInactiveTintColor: 'gray',
        headerTintColor: '#2563eb',
      }}
    >
      <MainDrawer.Screen 
        name="Home" 
        component={HomeTabNavigator}
        options={{
          title: 'Hymnal App',
          drawerLabel: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <MainDrawer.Screen 
        name="Downloads" 
        component={DownloadsScreen}
        options={{
          title: 'Downloads',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="download-outline" size={size} color={color} />
          ),
        }}
      />
      <MainDrawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <MainDrawer.Screen 
        name="About" 
        component={AboutScreen}
        options={{
          title: 'About',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </MainDrawer.Navigator>
  );
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
      await SplashScreen.hideAsync();
    }
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <RootStack.Screen name="Loading" component={LoadingScreen} />
        ) : isAuthenticated ? (
          <>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen 
              name="SongView" 
              component={SongViewScreen}
              options={{
                headerShown: true,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}