import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { db, auth } from '../../FirebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function CaloriesTracking() {
  const router = useRouter();
  const [calorieGoal, setCalorieGoal] = useState(2000); // Default goal
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [customCalories, setCustomCalories] = useState('');
  const [proteinGoal, setProteinGoal] = useState(100); // Default goal for protein
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [showProtein, setShowProtein] = useState(false); // State to determine if the protein bar is shown

  // Fetch preferences and progress from Firestore
  const fetchSettingsFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCaloriesConsumed(data.caloriesConsumed || 0);
        setProteinConsumed(data.proteinConsumed || 0);
        setCalorieGoal(parseInt(data.calculatedGoals?.calorieGoal || 2000));
        setProteinGoal(parseInt(data.calculatedGoals?.proteinGoal || 100));
        setShowProtein(data.showProtein || false); // Fetch the toggle state
      } else {
        console.log('No data found!');
      }
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
    }
  };

  const saveCaloriesToFirestore = async (calories: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(docRef, { caloriesConsumed: calories }, { merge: true });
    } catch (error) {
      console.error('Error saving calories:', error);
    }
  };

  const saveProteinToFirestore = async (protein: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(docRef, { proteinConsumed: protein }, { merge: true });
    } catch (error) {
      console.error('Error saving protein:', error);
    }
  };

  const addCalories = (amount: number) => {
    const updatedCalories = caloriesConsumed + amount;
    setCaloriesConsumed(updatedCalories);
    saveCaloriesToFirestore(updatedCalories);
  };

  const handleManualAdd = () => {
    const amount = parseFloat(customCalories);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid calorie amount.');
      return;
    }
    addCalories(amount);
    setCustomCalories('');
  };

  useEffect(() => {
    fetchSettingsFromFirestore();
  }, []);

  const progress = caloriesConsumed / calorieGoal;
  const proteinProgress = proteinConsumed / proteinGoal;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.header}>Calories Tracking</Text>
          <Text style={styles.subheader}>Goal: {calorieGoal} kcal</Text>
          <Text style={styles.intake}>You've consumed: {caloriesConsumed} kcal</Text>

          <ProgressBar progress={progress} color="#FFA500" style={styles.progressBar} />

          {/* Conditionally render protein progress bar */}
          {showProtein && (
            <View style={styles.row}>
              <Text style={styles.label}>Protein</Text>
              <View style={styles.progressContainer}>
                <ProgressBar progress={proteinProgress} color="#FFAB91" style={styles.proteinProgressBar} />
                {proteinConsumed > 0 && (
                  <Text
                    style={[
                      styles.progressText,
                      { left: `${Math.min(proteinProgress * 100 + 1, 90)}%` },
                    ]}
                  >
                    {proteinConsumed} g
                  </Text>
                )}
              </View>
              <Text style={styles.goal}>{proteinGoal} g</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button title="+100 kcal" onPress={() => addCalories(100)} color="#FFA500" />
            <Button title="+200 kcal" onPress={() => addCalories(200)} color="#FFA500" />
            <Button title="+500 kcal" onPress={() => addCalories(500)} color="#FFA500" />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter kcal"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={customCalories}
              onChangeText={setCustomCalories}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleManualAdd}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.lookupButton}
            onPress={() => router.push('/log-meal')}
          >
            <Text style={styles.buttonText}>Log Food</Text>
          </TouchableOpacity>

          <View style={styles.separateButtonContainer}>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.goBackButtonText}>Go Back to Dashboard</Text>
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
    backgroundColor: '#FFF3E0',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subheader: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  intake: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBar: {
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE4B5',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lookupButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  goBackButton: {
    position: 'absolute',
    bottom: 50, // Updated padding from the bottom of the screen
    left: 20,
    right: 20,
    backgroundColor: '#5C6BC0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // For shadow effect
  },
  goBackButtonText: {
    color: '#FFFFFF', // Keeps the text white for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
  separateButtonContainer: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0, // Align to the bottom of the screen
    left: 0,
    right: 0,
    padding: 60, // Padding inside the white container
  },      
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginTop: -5,
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 10, // Space between label and progress bar
  },
  progressContainer: {
    flex: 1,
    position: 'relative',
  },
  proteinProgressBar: {
    height: 10,
    borderRadius: 10,
    backgroundColor: '#FFE4B5',
  },
  progressText: {
    position: 'absolute',
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goal: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10, // Space between bar and goal
  },
});