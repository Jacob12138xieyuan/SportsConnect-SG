import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Test function to verify SecureStore is working
export const testSecureStore = async () => {
  try {
    console.log('Testing SecureStore...');
    console.log('Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('Running on web, using localStorage fallback');
      localStorage.setItem('test-key', 'test-value');
      const value = localStorage.getItem('test-key');
      console.log('localStorage test result:', value);
      localStorage.removeItem('test-key');
      return true;
    }
    
    // Test SecureStore on native platforms
    await SecureStore.setItemAsync('test-key', 'test-value');
    const value = await SecureStore.getItemAsync('test-key');
    console.log('SecureStore test result:', value);
    await SecureStore.deleteItemAsync('test-key');
    
    return value === 'test-value';
  } catch (error) {
    console.error('SecureStore test failed:', error);
    return false;
  }
};
