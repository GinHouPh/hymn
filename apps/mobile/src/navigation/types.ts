import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainDrawerParamList>;
  Loading: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Main Drawer Navigator
export type MainDrawerParamList = {
  Home: NavigatorScreenParams<HomeTabParamList>;
  Settings: undefined;
  Downloads: undefined;
  About: undefined;
};

// Home Tab Navigator
export type HomeTabParamList = {
  SongList: undefined;
  Favorites: undefined;
  Recent: undefined;
  Search: undefined;
};

// Song Stack Navigator
export type SongStackParamList = {
  SongView: {
    songId: string;
    songNumber?: number;
  };
  SongList: undefined;
};

// Deep linking configuration
export const linking = {
  prefixes: ['hymnal://', 'https://hymnal.app'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              SongList: 'songs',
              Favorites: 'favorites',
              Recent: 'recent',
              Search: 'search',
            },
          },
          Settings: 'settings',
          Downloads: 'downloads',
          About: 'about',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password/:token',
        },
      },
      SongView: 'song/:songId',
    },
  },
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}