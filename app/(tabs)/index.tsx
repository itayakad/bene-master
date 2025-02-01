import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, Animated } from 'react-native';
import { auth, db } from '../../FirebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularProgress } from 'react-native-circular-progress';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import { trackListener } from '../../utils/ListenerManager'; // Import ListenerManager

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State for progress bars
  const [waterFill, setWaterFill] = useState(0);
  const [calorieFill, setCalorieFill] = useState(0);
  const [exerciseFill, setExerciseFill] = useState(0);

  const waterProgress = useRef(new Animated.Value(0)).current;
  const calorieProgress = useRef(new Animated.Value(0)).current;
  const exerciseProgress = useRef(new Animated.Value(0)).current;

  // Fetch progress data from Firestore
  useEffect(() => {
    const user = auth.currentUser;

    // Guard: Ensure the listener only runs if the user is logged in
    if (!user) {
      console.log("No user is logged in. Skipping Firestore listener setup.");
      return;
    }

    const docRef = doc(db, 'users', user.uid);

    // Set up Firestore listener
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          const waterGoal = parseInt(data.calculatedGoals?.waterGoal?.split(" ")[0] || 95);
          const waterIntake = data.waterIntake || 0;
          const calorieGoal = parseInt(data.calculatedGoals?.calorieGoal?.split(" ")[0] || 2000);
          const caloriesConsumed = data.caloriesConsumed || 0;
          const weeklyWorkoutDaysGoal = data.weeklyWorkoutDaysGoal || 3;
          const workoutDays = data.workoutDays || [];
          const newExerciseProgress = (workoutDays.length / weeklyWorkoutDaysGoal) * 100;

          // Animate progress
          Animated.timing(waterProgress, {
            toValue: (waterIntake / waterGoal) * 100,
            duration: 500,
            useNativeDriver: false,
          }).start();
          Animated.timing(calorieProgress, {
            toValue: (caloriesConsumed / calorieGoal) * 100,
            duration: 500,
            useNativeDriver: false,
          }).start();
          Animated.timing(exerciseProgress, {
            toValue: newExerciseProgress,
            duration: 500,
            useNativeDriver: false,
          }).start();
        } else {
          console.log("No document found for the user.");
        }
      },
      (error) => {
        console.error("Error with Firestore listener:", error);
      }
    );

    // Track listener globally
    trackListener(unsubscribe);

    // Set listeners for animated values
    const waterListener = waterProgress.addListener(({ value }) => setWaterFill(value));
    const calorieListener = calorieProgress.addListener(({ value }) => setCalorieFill(value));
    const exerciseListener = exerciseProgress.addListener(({ value }) => setExerciseFill(value));

    // Cleanup on component unmount
    return () => {
      console.log("Cleaning up Firestore listener and animation listeners.");
      unsubscribe(); // Clean up Firestore listener
      waterProgress.removeListener(waterListener);
      calorieProgress.removeListener(calorieListener);
      exerciseProgress.removeListener(exerciseListener);
    };
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top + 40 }]}>
      <Text style={styles.title}>Your Dashboard</Text>

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        <TouchableOpacity onPress={() => router.push('/water-tracking')}>
          <CircularProgress size={110} width={8} fill={waterFill} tintColor="#1E90FF" backgroundColor="#e0e0e0">
            {() => <FontAwesome name="tint" size={52} color="#1E90FF" />}
          </CircularProgress>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/calorie-tracking')}>
          <CircularProgress size={110} width={8} fill={calorieFill} tintColor="#FFA500" backgroundColor="#e0e0e0">
            {() => <MaterialCommunityIcons name="food-apple" size={57} color="#FFA500" />}
          </CircularProgress>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/exercise-tracking')}>
          <CircularProgress size={110} width={8} fill={exerciseFill} tintColor="#32CD32" backgroundColor="#e0e0e0">
            {() => <FontAwesome6 name="dumbbell" size={45} color="#32CD32" />}
          </CircularProgress>
        </TouchableOpacity>
      </View>

      {/* Existing Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/survey')}>
        <Text style={styles.text}>Edit Health Info</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.greenButton} onPress={() => router.push('/exercise-data')}>
        <Text style={styles.text}>View Exercise Log</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.mealButton} onPress={() => router.push('/meal-data')}>
        <Text style={styles.text}>View Meal Log</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('../settings')}>
        <Text style={styles.text}>Account Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 45,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 50,
    marginTop: 50,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '90%',
    marginBottom: 50,
  },
  button: {
    width: '90%',
    backgroundColor: '#5C6BC0',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  greenButton: {
    width: '90%',
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  mealButton: {
    width: '90%',
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  settingsButton: {
    width: '90%',
    backgroundColor: '#5C6BC0',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    position: 'absolute',
    bottom: 50,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
