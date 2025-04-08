import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { ProgressBar } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { db, auth } from '../FirebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { router } from 'expo-router';

export default function Survey() {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0.5);

  // Survey inputs
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(null);
  const [genderOpen, setGenderOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState(null);
  const [fitnessGoalOpen, setFitnessGoalOpen] = useState(false);
  const [weeklyWorkoutDaysGoal, setWeeklyWorkoutDaysGoal] = useState(null);
  const [weeklyWorkoutDaysGoalOpen, setWeeklyWorkoutDaysGoalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  const fitnessGoalOptions = [
    { label: 'Lose Weight', value: 'Lose Weight' },
    { label: 'Maintain Weight', value: 'Maintain Weight' },
    { label: 'Build Muscle', value: 'Build Muscle' },
  ];

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          Alert.alert('Error', 'User not authenticated.');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAge(data.age || '');
          setGender(data.gender || null);
          setWeight(data.weight || '');
          setHeightFeet(data.height?.feet || '');
          setHeightInches(data.height?.inches || '');
          setFitnessGoal(data.fitnessGoal || null);
          setWeeklyWorkoutDaysGoal(data.weeklyWorkoutDaysGoal || null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Could not fetch user data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const nextStep = () => {
    if (step === 1 && (!age || !gender || !weight || !heightFeet || !heightInches)) {
      Alert.alert('Please fill out all fields before proceeding.');
      return;
    }
    if (step === 2 && (!fitnessGoal || !weeklyWorkoutDaysGoal)) {
      Alert.alert('Please complete this step before proceeding.');
      return;
    }    
    setStep((prevStep) => prevStep + 1);
    setProgress((prevProgress) => prevProgress + 0.5);
  };

  const prevStep = () => {
    setStep((prevStep) => Math.max(prevStep - 1, 1));
    setProgress((prevProgress) => Math.max(prevProgress - 0.5, 0.5));
  };

  const submitSurvey = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    const heightInInches = parseInt(heightFeet) * 12 + parseInt(heightInches);
    const waterGoal = parseInt(weight) * 0.5;

    const weightKg = parseInt(weight) / 2.205;
    const heightCm = heightInInches * 2.54;
    const bmr =
      gender === 'Male'
        ? 88.36 + 13.4 * weightKg + 4.8 * heightCm - 5.7 * parseInt(age)
        : 447.6 + 9.2 * weightKg + 3.1 * heightCm - 4.3 * parseInt(age);
    const calorieGoal = bmr * 1.2;
    const proteinGoal = parseInt(weight)

    try {
      await setDoc(doc(db, 'users', userId), {
        age,
        gender,
        weight,
        height: { feet: heightFeet, inches: heightInches },
        fitnessGoal,
        weeklyWorkoutDaysGoal,
        calculatedGoals: {
          waterGoal: `${waterGoal.toFixed(0)} oz`,
          calorieGoal: `${calorieGoal.toFixed(0)} kcal`,
          proteinGoal: `${proteinGoal.toFixed(0)} g`,
          exerciseGoal: `${weeklyWorkoutDaysGoal} days/week`,
        },
      });
      Alert.alert('Survey Complete', 'Your preferences have been saved!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving survey data:', error);
      Alert.alert('Error', 'Could not save survey data.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading your data...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color="#5C6BC0" style={styles.progressBar} />
          <Text style={styles.progressText}>Step {step} of 2</Text>
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.header}>General Information</Text>

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.dropdownWrapper}>
              <DropDownPicker
                open={genderOpen}
                value={gender}
                items={genderOptions}
                setOpen={setGenderOpen}
                setValue={setGender}
                placeholder="Select Gender"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
              />
            </View>

            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your weight"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />

            <Text style={styles.label}>Height</Text>
            <View style={styles.heightContainer}>
              <TextInput
                style={[styles.halfInput]}
                placeholder="Feet"
                placeholderTextColor="#6C757D"
                keyboardType="numeric"
                value={heightFeet}
                onChangeText={setHeightFeet}
              />
              <TextInput
                style={[styles.halfInput]}
                placeholder="Inches"
                placeholderTextColor="#6C757D"
                keyboardType="numeric"
                value={heightInches}
                onChangeText={setHeightInches}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.header}>Fitness Goals</Text>

            {/* Primary Fitness Goal */}
            <Text style={styles.label}>Primary Fitness Goal</Text>
            <View style={{ zIndex: fitnessGoalOpen ? 3000 : 1000 }}>
              <DropDownPicker
                open={fitnessGoalOpen}
                value={fitnessGoal}
                items={fitnessGoalOptions}
                setOpen={setFitnessGoalOpen}
                setValue={setFitnessGoal}
                placeholder="Select your goal"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={3000} // Ensure the dropdown is displayed above other components
                zIndexInverse={2000} // Lower priority when closed
              />
            </View>

            {/* Weekly Workout Goal */}
            <Text style={styles.label}>Weekly Workout Goal</Text>
            <View style={{ zIndex: weeklyWorkoutDaysGoalOpen ? 3000 : 1000 }}>
              <DropDownPicker
                open={weeklyWorkoutDaysGoalOpen}
                value={weeklyWorkoutDaysGoal}
                items={[
                  { label: '1 Day', value: 1 },
                  { label: '2 Days', value: 2 },
                  { label: '3 Days', value: 3 },
                  { label: '4 Days', value: 4 },
                  { label: '5 Days', value: 5 },
                  { label: '6 Days', value: 6 },
                  { label: '7 Days', value: 7 },
                ]}
                setOpen={setWeeklyWorkoutDaysGoalOpen}
                setValue={setWeeklyWorkoutDaysGoal}
                placeholder="Select weekly goal"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={2000} // Lower priority than Fitness Goal when it's open
                zIndexInverse={1000} // Even lower when closed
              />
            </View>
          </View>
        )}


        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity style={styles.button} onPress={prevStep}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 2 && (
            <TouchableOpacity style={styles.button} onPress={nextStep}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
          {step === 2 && (
            <TouchableOpacity style={styles.button} onPress={submitSurvey}>
              <Text style={styles.buttonText}>Finish</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    width: '90%', // Ensure progress bar doesn't stretch edge-to-edge
    borderRadius: 5,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  stepContainer: {
    marginBottom: 20,
    paddingHorizontal: 20, // Consistent horizontal padding
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343A40',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 5,
    paddingHorizontal: 20, // Align labels with inputs
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderColor: '#CED4DA',
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#343A40',
    marginBottom: 20,
    marginHorizontal: 20, // Horizontal padding to avoid edge-to-edge
  },
  dropdownWrapper: {
    marginBottom: 15,
    zIndex: 1000,
    paddingHorizontal: 20, // Add horizontal padding to align dropdown with inputs
  },
  dropdown: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderColor: '#CED4DA',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  dropdownContainer: {
    borderColor: '#CED4DA',
    borderRadius: 10,
    marginHorizontal: 20, // Add horizontal margin to the expanded dropdown container
    paddingHorizontal: 10, // Add padding inside the dropdown container
  },
  heightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginHorizontal: 20, // Add consistent padding to the container
  },
  halfInput: {
    width: '48%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderColor: '#CED4DA',
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#343A40',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20, // Add padding for buttons
  },
  button: {
    flex: 1,
    backgroundColor: '#5C6BC0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
