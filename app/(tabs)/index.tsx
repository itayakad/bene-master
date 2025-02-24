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
import Colors from '../../constants/Colors';
import CommonStyles from '../../constants/CommonStyles';

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
          <CircularProgress size={110} width={8} fill={waterFill} tintColor={Colors.lightblue} backgroundColor={Colors.lightgrey}>
            {() => <FontAwesome name="tint" size={52} color={Colors.lightblue} />}
          </CircularProgress>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/calorie-tracking')}>
          <CircularProgress size={110} width={8} fill={calorieFill} tintColor={Colors.orange} backgroundColor={Colors.lightgrey}>
            {() => <MaterialCommunityIcons name="food-apple" size={57} color={Colors.orange} />}
          </CircularProgress>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/exercise-tracking')}>
          <CircularProgress size={110} width={8} fill={exerciseFill} tintColor={Colors.green} backgroundColor={Colors.lightgrey}>
            {() => <FontAwesome6 name="dumbbell" size={45} color={Colors.green} />}
          </CircularProgress>
        </TouchableOpacity>
      </View>

      {/* Existing Buttons */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/survey')}>
        <Text style={CommonStyles.buttonText}>Edit Health Info</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.greenButton} onPress={() => router.push('/exercise-data')}>
        <Text style={CommonStyles.buttonText}>View Exercise Log</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.mealButton} onPress={() => router.push('/meal-data')}>
        <Text style={CommonStyles.buttonText}>View Meal Log</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('../settings')}>
        <Text style={CommonStyles.buttonText}>Account Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 45,
    fontWeight: '800',
    color: Colors.darkpurple,
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
    backgroundColor: Colors.purple,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  greenButton: {
    width: '90%',
    backgroundColor: Colors.green,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  mealButton: {
    width: '90%',
    backgroundColor: Colors.orange,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  settingsButton: {
    width: '90%',
    backgroundColor: Colors.purple,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    position: 'absolute',
    bottom: 50,
  },
});
