import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  SafeAreaView,
  TouchableWithoutFeedback,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { db, auth, storage } from '../FirebaseConfig'; // Ensure storage is initialized
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage methods
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function LogExercise() {
  const router = useRouter();

  // State variables
  const [exerciseType, setExerciseType] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null); // State for selected image
  const [imageURL, setImageURL] = useState(''); // State for uploaded image URL
  const [recordWorkout, setRecordWorkout] = useState(''); // State for personal record workout
  const [recordQuantity, setRecordQuantity] = useState(''); // State for personal record quantity

  const exerciseOptions = [
    { label: 'Running', value: 'Running' },
    { label: 'Cycling', value: 'Cycling' },
    { label: 'Swimming', value: 'Swimming' },
    { label: 'Yoga', value: 'Yoga' },
    { label: 'Weightlifting', value: 'Weightlifting' },
  ];

  const calculateCalories = () => {
    const durationInMinutes = parseInt(duration);
    if (isNaN(durationInMinutes) || durationInMinutes <= 0 || !exerciseType) {
      return 'N/A';
    }

    const caloriesPerMinute = {
      Running: 10,
      Cycling: 8,
      Swimming: 12,
      Yoga: 5,
      Weightlifting: 7,
    };

    return durationInMinutes * (caloriesPerMinute[exerciseType] || 0);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;

    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const userId = auth.currentUser?.uid;
      const imageRef = ref(storage, `progress_photos/${userId}/${Date.now()}.jpg`);

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      setImageURL(downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    const caloriesBurned = calculateCalories();
    const userId = auth.currentUser?.uid;
  
    if (!exerciseType || !duration || isNaN(caloriesBurned)) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
  
    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
  
    const durationInMinutes = parseInt(duration);
    const today = new Date(); // Get the current date
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()]; // Convert to day name
  
    try {
      const photoURL = await uploadImage();
  
      // Update the user's total exercise minutes
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
  
      let currentMinutes = 0;
      let workoutDays = [];
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        currentMinutes = data.exerciseMinutes || 0;
        workoutDays = data.workoutDays || [];
      }
  
      const updatedMinutes = currentMinutes + durationInMinutes;
  
      // Add the current day to the workoutDays array if not already included
      if (!workoutDays.includes(dayOfWeek)) {
        workoutDays.push(dayOfWeek);
      }
  
      // Save the updated data to Firestore
      await setDoc(userDocRef, { 
        exerciseMinutes: updatedMinutes, 
        workoutDays 
      }, { merge: true });
  
      // Log the specific exercise
      const exerciseLogRef = doc(db, 'users', userId, 'exercises', `${Date.now()}`);
      await setDoc(exerciseLogRef, {
        exerciseType,
        duration: durationInMinutes,
        caloriesBurned,
        notes,
        photoURL,
        hasPhoto: !!photoURL,
        recordWorkout,
        recordQuantity,
        timestamp: today,
      });
  
      Alert.alert('Success', 'Exercise logged successfully!');
      router.replace('/(tabs)/exercise-tracking'); // Redirect to exercise tracking page
    } catch (error) {
      console.error('Error logging exercise:', error);
      Alert.alert('Error', 'Failed to log exercise. Please try again.');
    }
  };  

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.header}>Log Exercise</Text>

            <Text style={styles.label}>Select Exercise Type:</Text>
            <View style={[styles.dropdownWrapper, { zIndex: 1000 }]}>
              <DropDownPicker
                open={dropdownOpen}
                value={exerciseType}
                items={exerciseOptions}
                setOpen={setDropdownOpen}
                setValue={setExerciseType}
                placeholder="Choose exercise type"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
              />
            </View>

            <Text style={styles.label}>Duration (minutes):</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter duration in minutes"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={duration}
              onChangeText={setDuration}
            />

            <Text style={styles.label}>Estimated Calories Burned:</Text>
            <Text style={styles.caloriesText}>{calculateCalories()} kcal</Text>

            <Text style={styles.label}>Personal Record (optional)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Workout (e.g., Bench Press)"
                placeholderTextColor="#6C757D"
                value={recordWorkout}
                onChangeText={setRecordWorkout}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Record Quantity (e.g., 200 lbs)"
                placeholderTextColor="#6C757D"
                keyboardType="numeric"
                value={recordQuantity}
                onChangeText={setRecordQuantity}
              />
            </View>

            <Text style={styles.label}>Notes (optional):</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Add notes about your session"
              placeholderTextColor="#6C757D"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>Pick a Progress Photo (optional)</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#D3F9D8',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#000',
    paddingHorizontal: 20,
  },
  dropdownWrapper: {
    marginBottom: 15,
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderColor: '#CCC',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#000',
  },
  dropdownContainer: {
    borderColor: '#CCC',
    borderRadius: 10,
  },
  input: {
    height: 40,
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    color: '#000',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#808080',
    paddingHorizontal: 20,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    borderRadius: 10,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: '#CCC',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  photoButton: {
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  photoButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '90%',
    height: 200,
    marginTop: 20,
    alignSelf: 'center',
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5, // Add spacing between the inputs
  },  
});
