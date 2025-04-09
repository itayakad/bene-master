import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import { db, auth, storage } from '../FirebaseConfig';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function LogMealManual() {
  const [mealDescription, setMealDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [protein, setProtein] = useState('');
  const [image, setImage] = useState(null);
  const [imageURL, setImageURL] = useState('');

  const router = useRouter();

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
      const imageRef = ref(storage, `meal_photos/${userId}/${Date.now()}.jpg`);

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      setImageURL(downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const logMeal = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    if (!mealDescription || !calories) {
      Alert.alert('Error', 'Please enter at least a meal description and calories.');
      return;
    }    

    try {
      const mealCalories = parseInt(calories);
      const mealCarbs = carbs ? parseInt(carbs) : 0;
      const mealFat = fat ? parseInt(fat) : 0;
      const mealProtein = protein ? parseInt(protein) : 0;

      if (
        isNaN(mealCalories) ||
        isNaN(mealCarbs) ||
        isNaN(mealFat) ||
        isNaN(mealProtein)
      ) {
        Alert.alert('Error', 'Macros must be valid numbers.');
        return;
      }

      const photoURL = await uploadImage();

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      let currentCalories = 0;
      let currentProtein = 0;
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentCalories = data.caloriesConsumed || 0;
        currentProtein = data.proteinConsumed || 0;
      }

      const updatedCalories = currentCalories + mealCalories;
      const updatedProtein = currentProtein + mealProtein;

      await setDoc(docRef, { caloriesConsumed: updatedCalories }, { merge: true });
      await setDoc(docRef, { proteinConsumed: updatedProtein }, { merge: true });

      const userMealsCollection = collection(db, 'users', user.uid, 'meals');
      await addDoc(userMealsCollection, {
        description: mealDescription,
        calories: mealCalories,
        carbs: mealCarbs,
        fat: mealFat,
        protein: mealProtein,
        photoURL: photoURL || '',
        hasPhoto: !!photoURL,
        timestamp: new Date(),
      });

      Alert.alert('Success', 'Meal logged successfully!');
      router.replace('/(tabs)/calorie-tracking');
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.header}>Log Meal Manually</Text>

            <TextInput
              style={styles.input}
              placeholder="Meal description"
              placeholderTextColor="#6C757D"
              value={mealDescription}
              onChangeText={setMealDescription}
            />

            <TextInput
              style={styles.input}
              placeholder="Calories"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={calories}
              onChangeText={setCalories}
            />
            <TextInput
              style={styles.input}
              placeholder="Carbs (g)"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={carbs}
              onChangeText={setCarbs}
            />
            <TextInput
              style={styles.input}
              placeholder="Fat (g)"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={fat}
              onChangeText={setFat}
            />
            <TextInput
              style={styles.input}
              placeholder="Protein (g)"
              placeholderTextColor="#6C757D"
              keyboardType="numeric"
              value={protein}
              onChangeText={setProtein}
            />

            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>Pick a Meal Photo (optional)</Text>
            </TouchableOpacity>
            {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.replace('/(tabs)/calorie-tracking')}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={logMeal}>
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
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF3E0',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
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
  photoButton: {
    backgroundColor: '#FFA500',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
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
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
