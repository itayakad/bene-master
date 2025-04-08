import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

export const options = {
  headerShown: false, // Hide the header for this screen
};

const LoadingScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      router.replace('/'); // Redirect to login page
    }, 1000); // Short delay to ensure proper state sync
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5C6BC0" />
      <Text style={styles.message}>Signing you out...</Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA', // Light background for a clean look
  },
  message: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#5C6BC0', // Indigo color matching the app theme
  },
});
