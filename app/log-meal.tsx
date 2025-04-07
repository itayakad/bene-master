import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
import Slider from '@react-native-community/slider';
import { SPOONACULAR_API_KEY } from '../constants/ApiKey';
import * as ImagePicker from 'expo-image-picker';

export default function LogMeal() {
  const [mealDescription, setMealDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState(null);
  const [portionSize, setPortionSize] = useState(1); // 1 = normal, 0.8 = small, 1.2 = large
  const [image, setImage] = useState(null); // State for selected image
  const [imageURL, setImageURL] = useState(''); // State for uploaded image URL

  const router = useRouter();

  const fetchNutrition = async () => {
    if (!mealDescription.trim()) {
      Alert.alert('Error', 'Please enter a description of your meal.');
      return;
    }

    setLoading(true);
    setNutrition(null);

    try {
      const apiKey = SPOONACULAR_API_KEY;
      const endpoint = `https://api.spoonacular.com/recipes/guessNutrition`;

      const response = await fetch(`${endpoint}?title=${encodeURIComponent(mealDescription)}&apiKey=${apiKey}`);
      const data = await response.json();

      if (data && data.calories) {
        setNutrition(data);
      } else {
        Alert.alert('Error', 'Could not estimate nutrition. Please try again. (HINT: Check your spelling)');
      }
    } catch (error) {
      console.error('Error fetching nutrition:', error);
      Alert.alert('Error', 'Failed to fetch nutrition data.');
    } finally {
      setLoading(false);
    }
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
    if (!nutrition) {
      Alert.alert('Error', 'No nutrition data to log.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
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

      const mealCalories = Math.round(nutrition.calories.value * portionSize);
      const updatedCalories = currentCalories + mealCalories;
      const mealProtein = Math.round(nutrition.protein.value * portionSize);
      const updatedProtein = currentProtein + mealProtein;

      // Update total calories and protein in Firestore
      await setDoc(docRef, { caloriesConsumed: updatedCalories }, { merge: true });
      await setDoc(docRef, { proteinConsumed: updatedProtein }, { merge: true });

      // Log the meal details in a sub-collection
      const userMealsCollection = collection(db, 'users', user.uid, 'meals');
      await addDoc(userMealsCollection, {
        description: mealDescription,
        calories: mealCalories,
        carbs: Math.round(nutrition.carbs.value * portionSize),
        fat: Math.round(nutrition.fat.value * portionSize),
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
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.header}>Log Meal</Text>
  
            <TextInput
              style={styles.input}
              placeholder="Describe your meal (e.g., 'Hamburger')"
              placeholderTextColor="#6C757D"
              value={mealDescription}
              onChangeText={setMealDescription}
            />
  
            <TouchableOpacity style={styles.estimateButton} onPress={fetchNutrition}>
              <Text style={styles.buttonText}>{loading ? 'Estimating...' : 'Estimate Nutrition'}</Text>
            </TouchableOpacity>
  
            {loading && <ActivityIndicator size="large" color="#FFA500" style={styles.loader} />}
  
            {nutrition && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultText}>Calories: {Math.round(nutrition.calories.value * portionSize)} kcal</Text>
                <Text style={styles.resultText}>Carbs: {Math.round(nutrition.carbs.value * portionSize)} g</Text>
                <Text style={styles.resultText}>Fat: {Math.round(nutrition.fat.value * portionSize)} g</Text>
                <Text style={styles.resultText}>Protein: {Math.round(nutrition.protein.value * portionSize)} g</Text>
  
                {/* Portion Size Adjustment Buttons */}
                <View style={styles.portionContainer}>
                  <Text style={styles.portionText}>Portion Size:</Text>
                  <TouchableOpacity
                    style={[styles.portionButton, portionSize === 0.8 && styles.activePortionButton]}
                    onPress={() => setPortionSize(0.8)}
                  >
                    <Text style={styles.portionButtonText}>Small</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.portionButton, portionSize === 1 && styles.activePortionButton]}
                    onPress={() => setPortionSize(1)}
                  >
                    <Text style={styles.portionButtonText}>Normal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.portionButton, portionSize === 1.2 && styles.activePortionButton]}
                    onPress={() => setPortionSize(1.2)}
                  >
                    <Text style={styles.portionButtonText}>Large</Text>
                  </TouchableOpacity>
                </View>
  
                {/* Slider for Adjusting Portion Size */}
                <View style={styles.sliderContainer}>
                  <Text style={styles.adjustText}>Adjust Portion Size: {portionSize.toFixed(1)}x</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0.2}
                    maximumValue={1.8}
                    step={0.1}
                    value={portionSize}
                    onValueChange={(value) => setPortionSize(value)}
                    minimumTrackTintColor="#FFA500"
                    maximumTrackTintColor="#DDD"
                    thumbTintColor="#FF8C00"
                  />
                </View>
  
                {/* Choose Photo Button */}
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Text style={styles.photoButtonText}>Pick a Meal Photo (optional)</Text>
                </TouchableOpacity>
                {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
              </View>
            )}
  
            {/* Conditional Button Rendering */}
            {!nutrition ? (
              <View style={styles.singleButtonContainer}>
                <TouchableOpacity
                  style={styles.largeCancelButton}
                  onPress={() => router.replace('/(tabs)/calorie-tracking')}
                >
                  <Text style={styles.largeCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
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
            )}
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
  },
  estimateButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    marginHorizontal: 20,
  },
  logButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
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
  portionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  portionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  portionButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 5,
  },
  activePortionButton: {
    backgroundColor: '#FF8C00',
  },
  portionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginTop: 20,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  adjustText: {
    fontSize: 16,
    alignSelf: 'flex-start', // Aligns the text to the left within the parent container
    marginTop: 10, // Adds space below the buttons
    marginLeft: 10, // Adjusts spacing from the left edge
    marginBottom: 0, // Adds space between the text and slider
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 10,
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
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  singleButtonContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeCancelButton: {
    backgroundColor: '#CCC',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%', // Makes the button large and centered
  },
  largeCancelButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
