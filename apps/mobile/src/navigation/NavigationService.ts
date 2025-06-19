import { NavigationContainerRef } from '@react-navigation/native';
import { createRef } from 'react';

export const navigationRef = createRef<NavigationContainerRef<any>>();

export function navigate(name: string, params?: any) {
  navigationRef.current?.navigate(name, params);
}

export function goBack() {
  navigationRef.current?.goBack();
}

export function reset(routeName: string, params?: any) {
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: routeName, params }],
  });
}

export function getCurrentRoute() {
  return navigationRef.current?.getCurrentRoute();
}

export function canGoBack() {
  return navigationRef.current?.canGoBack() ?? false;
}