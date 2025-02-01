import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { db, auth } from '../../FirebaseConfig'; // Import Firestore and Auth
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function WaterTracking() {
  // State variables
  const router = useRouter();
  const [waterGoal, setWaterGoal] = useState(64); // Default goal in oz
  const [watersConsumed, setWatersConsumed] = useState(0);
  const [customWaters, setCustomWaters] = useState('');

  // Functions to save and fetch data
  const saveWaterToFirestore = async (water: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(docRef, { waterIntake: water }, { merge: true });
      console.log('Water data saved to Firestore!');
    } catch (error) {
      console.error('Error saving water data:', error);
    }
  };

  const fetchWaterFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWatersConsumed(data.waterIntake || 0);
        setWaterGoal(parseInt(data.calculatedGoals?.waterGoal || 64)); // Fetch water goal
      } else {
        console.log('No water data found!');
      }
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  };

  // Functions to handle water changes
  const addWaters = (amount: number) => {
    const updatedWater = watersConsumed + amount;
    setWatersConsumed(updatedWater);
    saveWaterToFirestore(updatedWater);
  };

  const handleManualAdd = () => {
    const amount = parseFloat(customWaters);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid water amount.');
      return;
    }
    addWaters(amount);
    setCustomWaters('');
  };

  // Fetch data when the screen loads
  useEffect(() => {
    fetchWaterFromFirestore();
  }, []);

  const progress = watersConsumed / waterGoal;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.header}>Water Tracking</Text>
          <Text style={styles.subheader}>Goal: {waterGoal} oz</Text>
          <Text style={styles.intake}>You've consumed: {watersConsumed} oz</Text>
          <ProgressBar progress={progress} color="#1E90FF" style={styles.progressBar} />
          <View style={styles.buttonContainer}>
            <Button title="+8 oz" onPress={() => addWaters(8)} color="#1E90FF" />
            <Button title="+16 oz" onPress={() => addWaters(16)} color="#1E90FF" />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter custom amount (oz)"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={customWaters}
              onChangeText={setCustomWaters}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleManualAdd}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Separate Container for Go Back Button */}
          <View style={styles.separateButtonContainer}>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => router.push('/')} // Change this to the correct Dashboard route
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
    backgroundColor: '#E6F7FF', // Light blue background color
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
    backgroundColor: '#D3E8FF',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#B0C4DE', // Lighter shade of blue
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#1E90FF', // Main blue color for the button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
});
