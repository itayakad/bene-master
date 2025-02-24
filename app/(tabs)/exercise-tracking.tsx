import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { db, auth } from '../../FirebaseConfig';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';
import CommonStyles from '../../constants/CommonStyles';

export default function ExerciseTracking() {
  const router = useRouter();

  const navigateToLogExercise = () => {
    router.push('/log-exercise'); // Navigate to the log-exercise page
  };

  const [weeklyWorkoutDaysGoal, setWeeklyWorkoutDaysGoal] = useState(3); // Default: 3 days/week
  const [workoutDays, setWorkoutDays] = useState([]); // Tracks days the user worked out

  const saveWorkoutDayToFirestore = async (updatedWorkoutDays) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(docRef, { workoutDays: updatedWorkoutDays }, { merge: true });
      console.log('Workout days saved to Firestore!');
    } catch (error) {
      console.error('Error saving workout days:', error);
    }
  };

  const fetchWorkoutDaysFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWorkoutDays(data.workoutDays || []);
        setWeeklyWorkoutDaysGoal(data.weeklyWorkoutDaysGoal || 3);
      } else {
        console.log('No workout data found!');
      }
    } catch (error) {
      console.error('Error fetching workout data:', error);
    }
  };

  const markWorkoutDay = async (day) => {
    console.log(`Marking workout day: ${day}`); // Debug
    const user = auth.currentUser;
    if (!user) {
      console.error('No user logged in'); // Debug
      return;
    }
  
    const today = new Date().getDay(); // Sunday = 0, Monday = 1, etc.
    const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
  
    // Prevent marking future days
    if (dayIndex > today) {
      console.warn('Attempted to mark a future day'); // Debug
      Alert.alert('Invalid Action', 'You cannot mark future days as workout days.');
      return;
    }
  
    try {
      // Calculate the date range for the selected day
      const now = new Date();
      const selectedDay = new Date(now.setDate(now.getDate() - (today - dayIndex)));
      selectedDay.setHours(0, 0, 0, 0); // Start of the day
      const startOfDay = Timestamp.fromDate(selectedDay); // Firestore Timestamp
      selectedDay.setHours(23, 59, 59, 999); // End of the day
      const endOfDay = Timestamp.fromDate(selectedDay); // Firestore Timestamp
  
      console.log(`Selected day range: ${startOfDay.toDate()} - ${endOfDay.toDate()}`); // Debug
  
      // Query Firestore to check if logs exist for this day
      const exercisesRef = collection(db, 'users', user.uid, 'exercises');
      console.log(`Querying exercises for user ${user.uid}...`); // Debug
  
      const q = query(
        exercisesRef,
        where('timestamp', '>=', startOfDay),
        where('timestamp', '<=', endOfDay)
      );
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        console.log(`Found ${querySnapshot.size} logs for the day: ${day}`); // Debug
      } else {
        console.log(`No logs found for the day: ${day}`); // Debug
      }
  
      if (!querySnapshot.empty && workoutDays.includes(day)) {
        // If logs exist, confirm before deleting
        Alert.alert(
          'Confirmation',
          'Are you sure you want to unadd log? This deletes the exercise(s) logged on that day.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, Delete',
              onPress: async () => {
                console.log('User confirmed log deletion'); // Debug
              
                try {
                  // Create a batch using writeBatch
                  const batch = writeBatch(db);
              
                  querySnapshot.forEach((doc) => {
                    console.log(`Preparing to delete log with ID: ${doc.id}`); // Debug
                    batch.delete(doc.ref);
                  });
              
                  console.log('Committing batch delete...'); // Debug
                  await batch.commit();
                  console.log('Batch delete committed successfully!'); // Debug
              
                  // Update workoutDays to remove the day
                  const updatedWorkoutDays = workoutDays.filter((d) => d !== day);
                  console.log('Updated workoutDays after deletion:', updatedWorkoutDays); // Debug
                  setWorkoutDays(updatedWorkoutDays);
                  saveWorkoutDayToFirestore(updatedWorkoutDays);
                } catch (error) {
                  console.error('Error during batch deletion:', error); // Debug
                  Alert.alert('Error', 'Failed to delete logs. Please try again.');
                }
              }
            },
          ]
        );
      } else {
        // Toggle day normally if no logs exist
        console.log(`Toggling workout day: ${day}`); // Debug
        const updatedWorkoutDays = workoutDays.includes(day)
          ? workoutDays.filter((d) => d !== day)
          : [...workoutDays, day];
        console.log('Updated workoutDays:', updatedWorkoutDays); // Debug
        setWorkoutDays(updatedWorkoutDays);
        saveWorkoutDayToFirestore(updatedWorkoutDays);
      }
    } catch (error) {
      console.error('Error handling workout day:', error); // Debug
    }
  };

  useEffect(() => {
    fetchWorkoutDaysFromFirestore();
  }, []);

  const progress = workoutDays.length / weeklyWorkoutDaysGoal;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={CommonStyles.header}>Exercise Tracking</Text>
          <Text style={CommonStyles.subheader}>
            Weekly Goal: {weeklyWorkoutDaysGoal} days
          </Text>
          <Text style={CommonStyles.intake}>
            You've worked out {workoutDays.length} day(s) this week
          </Text>
          <ProgressBar progress={progress} color={Colors.green} style={styles.progressBar} />

          {/* Week Calendar for Quick Marking */}
          <View style={styles.calendarContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const today = new Date().getDay();
              const isToday = today === index;
              const isFuture = index > today;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    workoutDays.includes(day) ? styles.dayButtonActive : null,
                    isToday ? styles.dayButtonToday : null,
                    isFuture ? styles.dayButtonFuture : null,
                  ]}
                  onPress={() => markWorkoutDay(day)}
                  disabled={isFuture} // Disable buttons for future days
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      workoutDays.includes(day) ? styles.dayButtonTextActive : null,
                      isFuture ? styles.dayButtonTextFuture : null,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Log Exercise Button */}
          <TouchableOpacity
            style={styles.logExerciseButton}
            onPress={navigateToLogExercise}
          >
            <Text style={CommonStyles.buttonText}>Log Exercise</Text>
          </TouchableOpacity>

          {/* Go Back Button */}
          <View style={CommonStyles.goBackButtonContainer}>
            <TouchableOpacity
              style={CommonStyles.goBackButton}
              onPress={() => router.push('/')}
            >
              <Text style={CommonStyles.buttonText}>Go Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: Colors.lightgreen,
  },
  progressBar: {
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.medgreen,
    marginVertical: 20,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 20,
  },
  dayButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.lightgrey,
    backgroundColor: Colors.white,
  },
  dayButtonActive: {
    backgroundColor: Colors.green,
  },
  dayButtonToday: {
    borderColor: Colors.yellow,
    borderWidth: 3,
  },
  dayButtonFuture: {
    backgroundColor: Colors.grey,
  },
  dayButtonText: {
    fontSize: 16,
  },
  dayButtonTextActive: {
    color: Colors.white,
  },
  dayButtonTextFuture: {
    color: Colors.darkgrey,
  },
  logExerciseButton: {
    backgroundColor: Colors.green,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
});
