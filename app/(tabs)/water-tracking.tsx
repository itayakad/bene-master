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
import Colors from '../../constants/Colors';
import CommonStyles from '../../constants/CommonStyles';

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
          <Text style={CommonStyles.header}>Water Tracking</Text>
          <Text style={CommonStyles.subheader}>Goal: {waterGoal} oz</Text>
          <Text style={CommonStyles.intake}>You've consumed: {watersConsumed} oz</Text>
          <ProgressBar progress={progress} color={Colors.lightblue} style={styles.progressBar} />
          <View style={CommonStyles.buttonContainer}>
            <Button title="+8 oz" onPress={() => addWaters(8)} color={Colors.lightblue} />
            <Button title="+16 oz" onPress={() => addWaters(16)} color={Colors.lightblue} />
          </View>
          <View style={CommonStyles.inputContainer}>
            <TextInput
              style={CommonStyles.input}
              placeholder="Enter custom amount (oz)"
              placeholderTextColor={Colors.grey}
              keyboardType="numeric"
              value={customWaters}
              onChangeText={setCustomWaters}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleManualAdd}>
              <Text style={CommonStyles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Separate Container for Go Back Button */}
          <View style={CommonStyles.goBackButtonContainer}>
            <TouchableOpacity
              style={CommonStyles.goBackButton}
              onPress={() => router.push('/')} // Change this to the correct Dashboard route
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
    backgroundColor: Colors.verylightblue,
  },
  progressBar: {
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.aqua,
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: Colors.lightblue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
});
