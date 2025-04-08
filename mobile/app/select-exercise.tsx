import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

const exerciseOptions = [
  { label: 'Running', emoji: '🏃' },
  { label: 'Cycling', emoji: '🚴' },
  { label: 'Swimming', emoji: '🏊' },
  { label: 'Yoga', emoji: '🧘' },
  { label: 'Weightlifting', emoji: '🏋️' },
];

const SelectExerciseScreen: React.FC = () => {
  const router = useRouter();

  const handleExerciseSelect = (exerciseType: string) => {
    router.push({
      pathname: '/log-exercise', // Adjust if route name is different
      params: { exerciseType },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Choose Your Exercise</Text>
      {exerciseOptions.map(({ label, emoji }) => (
        <TouchableOpacity
          key={label}
          style={styles.button}
          onPress={() => handleExerciseSelect(label)}
        >
          <Text style={styles.buttonText}>
            {emoji} {label}
          </Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
};

export default SelectExerciseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D3F9D8',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#000',
  },
  button: {
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
});
