import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

const SelectMealEntry: React.FC = () => {
  const router = useRouter();

  const handleNavigation = (method: 'api' | 'manual') => {
    if (method === 'api') {
      router.push('/log-meal'); // Your existing API-based meal logger
    } else {
      router.push('/log-meal-manual'); // New screen we'll build next
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Log a Meal</Text>
      <Text style={styles.subtext}>Choose how you’d like to enter your meal:</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleNavigation('api')}
      >
        <Text style={styles.buttonText}>🍴 Use API (Estimate Nutrition)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.manualButton]}
        onPress={() => handleNavigation('manual')}
      >
        <Text style={styles.buttonText}>✍️ Enter Manually</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SelectMealEntry;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#FFA500',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  manualButton: {
    backgroundColor: '#FF8C00',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
