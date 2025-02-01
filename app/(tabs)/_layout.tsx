import React, { useEffect, useState, useRef } from 'react';
import { Animated } from 'react-native';
import { CircularProgress } from 'react-native-circular-progress';
import { FontAwesome, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useSegments } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../FirebaseConfig';
import { trackListener } from '../../utils/ListenerManager';
import { calculateProgress } from '../../utils/progressUtils';
import Colors from '../../constants/Colors';

export default function TabLayout() {
  const [waterFill, setWaterFill] = useState(0);
  const [calorieFill, setCalorieFill] = useState(0);
  const [exerciseFill, setExerciseFill] = useState(0);

  const waterProgress = useRef(new Animated.Value(0)).current;
  const calorieProgress = useRef(new Animated.Value(0)).current;
  const exerciseProgress = useRef(new Animated.Value(0)).current;

  const segments = useSegments(); // Get the current route segments

  useEffect(() => {
    const user = auth.currentUser;
  
    if (!user) {
      console.log("No user is logged in. Skipping Firestore listener setup.");
      return;
    }
  
    const docRef = doc(db, 'users', user.uid);
  
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
  
          // Water progress
          const waterGoal = parseInt(data.calculatedGoals?.waterGoal?.split(" ")[0] || 95);
          const waterIntake = data.waterIntake || 0;
          calculateProgress(waterGoal, waterIntake, waterProgress, setWaterFill);
  
          // Calorie progress
          const calorieGoal = parseInt(data.calculatedGoals?.calorieGoal?.split(" ")[0] || 2000);
          const caloriesConsumed = data.caloriesConsumed || 0;
          calculateProgress(calorieGoal, caloriesConsumed, calorieProgress, setCalorieFill);
  
          // Exercise progress
          const weeklyWorkoutDaysGoal = data.weeklyWorkoutDaysGoal || 3;
          const workoutDays = data.workoutDays || [];
          calculateProgress(weeklyWorkoutDaysGoal, workoutDays.length, exerciseProgress, setExerciseFill);
        } else {
          console.log("No user data found in Firestore.");
        }
      },
      (error) => {
        console.error("Error with Firestore listener:", error);
      }
    );
  
    // Track the listener globally
    trackListener(unsubscribe);
  
    return () => {
      console.log("Cleaning up Firestore listener in TabLayout.");
      waterProgress.removeAllListeners();
      calorieProgress.removeAllListeners();
      exerciseProgress.removeAllListeners();
    };
  }, []);  

  // Determine if the current screen is the Dashboard
  const isDashboard = segments.length === 1 && segments[0] === '(tabs)';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.darkgrey,
        tabBarPosition: 'top',
        tabBarStyle: isDashboard
          ? { display: 'none' } // Hide tab bar on Dashboard page
          : {
              backgroundColor: Colors.white,
              paddingTop: 80,
              paddingBottom: 10,
              height: 140,
              borderBottomWidth: 2,
              borderBottomColor: Colors.white,
              paddingHorizontal: 50,
            },
      }}
    >
      <Tabs.Screen
        name="water-tracking"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <CircularProgress
              size={50}
              width={5}
              fill={waterFill}
              tintColor={focused ? Colors.lightblue : Colors.darkgrey}
              backgroundColor={Colors.lightgrey}
            >
              {() => <FontAwesome name="tint" size={30} color={focused ? Colors.lightblue : Colors.darkgrey} />}
            </CircularProgress>
          ),
        }}
      />
      <Tabs.Screen
        name="calorie-tracking"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <CircularProgress
              size={50}
              width={5}
              fill={calorieFill}
              tintColor={focused ? Colors.orange : Colors.darkgrey}
              backgroundColor={Colors.lightgrey}
            >
              {() => (
                <MaterialCommunityIcons name="food-apple" size={30} color={focused ? Colors.orange : Colors.darkgrey} />
              )}
            </CircularProgress>
          ),
        }}
      />
      <Tabs.Screen
        name="exercise-tracking"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <CircularProgress
              size={50}
              width={5}
              fill={exerciseFill}
              tintColor={focused ? Colors.lightgreen : Colors.darkgrey}
              backgroundColor={Colors.lightgrey}
            >
              {() => (
                <FontAwesome6 name="dumbbell" size={25} color={focused ? Colors.lightgreen : Colors.darkgrey} />
              )}
            </CircularProgress>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Completely hide the index from the tab bar
          title: '',
          tabBarIcon: () => null, // No icon for index page
        }}
      />
    </Tabs>
  );
}
