import React, { useState, useEffect, useCallback } from 'react';
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
import Colors from '../../constants/Colors';
import CommonStyles from '../../constants/CommonStyles';

export default function CaloriesTracking() {
  const router = useRouter();

  /** State Initialization */
  const [calorieGoal, setCalorieGoal] = useState(() => 2000);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [customCalories, setCustomCalories] = useState('');
  const [proteinGoal, setProteinGoal] = useState(() => 100);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [showProtein, setShowProtein] = useState(false);

  /** Fetch User Data from Firestore */
  const fetchSettingsFromFirestore = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCaloriesConsumed(data.caloriesConsumed || 0);
        setProteinConsumed(data.proteinConsumed || 0);
        setCalorieGoal(parseInt(data.calculatedGoals?.calorieGoal || 2000));
        setProteinGoal(parseInt(data.calculatedGoals?.proteinGoal || 100));
        setShowProtein(data.showProtein || false);
      } else {
        console.log('No data found!');
      }
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
    }
  }, []);

  /** Save Data to Firestore */
  const saveToFirestore = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  /** Update Calories */
  const addCalories = (amount: any) => {
    const updatedCalories = caloriesConsumed + amount;
    setCaloriesConsumed(updatedCalories);
    saveToFirestore({ caloriesConsumed: updatedCalories });
  };

  /** Handle Manual Input for Calories */
  const handleManualAdd = () => {
    if (!customCalories.trim()) {
      Alert.alert('Invalid Input', 'Please enter a valid calorie amount.');
      return;
    }
    
    const amount = parseFloat(customCalories);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid calorie amount.');
      return;
    }

    addCalories(amount);
    setCustomCalories('');
  };

  /** Fetch Data on Component Mount */
  useEffect(() => {
    fetchSettingsFromFirestore();
  }, [fetchSettingsFromFirestore]);

  /** Progress Calculation */
  const progress = caloriesConsumed / calorieGoal;
  const proteinProgress = proteinConsumed / proteinGoal;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={CommonStyles.header}>Calories Tracking</Text>
          <Text style={CommonStyles.subheader}>Goal: {calorieGoal} cal</Text>
          <Text style={CommonStyles.intake}>You've consumed: {caloriesConsumed} cal</Text>

          <ProgressBar progress={progress} color={Colors.orange} style={styles.progressBar} />

          {/* Conditionally render protein progress bar */}
          {showProtein && (
            <View style={styles.row}>
              <Text style={styles.proteinLabel}>Protein</Text>
              <View style={styles.progressContainer}>
                <ProgressBar progress={proteinProgress} color={Colors.pink} style={styles.proteinProgressBar} />
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

          <View style={CommonStyles.buttonContainer}>
            <Button title="+100 cal" onPress={() => addCalories(100)} color={Colors.orange} />
            <Button title="+200 cal" onPress={() => addCalories(200)} color={Colors.orange} />
            <Button title="+500 cal" onPress={() => addCalories(500)} color={Colors.orange} />
          </View>

          <View style={CommonStyles.inputContainer}>
            <TextInput
              style={CommonStyles.input}
              placeholder="Enter cal"
              placeholderTextColor={Colors.grey}
              keyboardType="numeric"
              value={customCalories}
              onChangeText={setCustomCalories}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleManualAdd}>
              <Text style={CommonStyles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.lookupButton}
            onPress={() => router.push('/select-meal')}
          >
            <Text style={CommonStyles.buttonText}>Log Food</Text>
          </TouchableOpacity>

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
    backgroundColor: Colors.lightorange,
  },
  progressBar: {
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.medorange,
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  lookupButton: {
    backgroundColor: Colors.orange,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  }, 
  // PROTEIN BAR
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginTop: -5,
  },
  proteinLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.black,
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
    position: 'relative',
  },
  proteinProgressBar: {
    height: 10,
    borderRadius: 10,
    backgroundColor: Colors.medorange,
  },
  progressText: {
    position: 'absolute',
    fontSize: 8,
    color: Colors.black,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  goal: {
    fontSize: 8,
    fontWeight: 'bold',
    color: Colors.black,
    marginLeft: 10,
  },
});