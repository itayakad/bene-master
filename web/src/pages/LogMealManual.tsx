import React, { useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import '../pages/LogMealManual.css';

export default function LogMealManual() {
  const navigate = useNavigate();
  const [mealDescription, setMealDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [protein, setProtein] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      const userId = auth.currentUser?.uid;
      const imageRef = ref(storage, `meal_photos/${userId}/${Date.now()}.jpg`);
      await uploadBytes(imageRef, imageFile);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const logMeal = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('User not authenticated.');
      return;
    }

    if (!mealDescription || !calories || !carbs || !fat || !protein) {
      alert('Please fill in all fields.');
      return;
    }

    const mealCalories = parseInt(calories);
    const mealCarbs = parseInt(carbs);
    const mealFat = parseInt(fat);
    const mealProtein = parseInt(protein);

    if (
      isNaN(mealCalories) || isNaN(mealCarbs) ||
      isNaN(mealFat) || isNaN(mealProtein)
    ) {
      alert('Macros must be valid numbers.');
      return;
    }

    try {
      const photoURL = await uploadImage();
      const userDoc = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDoc);

      let currentCalories = 0;
      let currentProtein = 0;
      if (docSnap.exists()) {
        const data = docSnap.data();
        currentCalories = data.caloriesConsumed || 0;
        currentProtein = data.proteinConsumed || 0;
      }

      const updatedCalories = currentCalories + mealCalories;
      const updatedProtein = currentProtein + mealProtein;

      await setDoc(userDoc, { caloriesConsumed: updatedCalories }, { merge: true });
      await setDoc(userDoc, { proteinConsumed: updatedProtein }, { merge: true });

      const mealRef = collection(db, 'users', user.uid, 'meals');
      await addDoc(mealRef, {
        description: mealDescription,
        calories: mealCalories,
        carbs: mealCarbs,
        fat: mealFat,
        protein: mealProtein,
        photoURL: photoURL || '',
        hasPhoto: !!photoURL,
        timestamp: new Date(),
      });

      alert('Meal logged successfully!');
      navigate('/calorie-tracking');
    } catch (error) {
      console.error('Logging meal failed:', error);
      alert('Failed to log meal. Please try again.');
    }
  };

  return (
    <div className="logmeal-container">
      <h1 className="logmeal-header">Log Meal Manually</h1>
      <input
        className="logmeal-input"
        placeholder="Meal description"
        value={mealDescription}
        onChange={(e) => setMealDescription(e.target.value)}
      />
      <input
        className="logmeal-input"
        placeholder="Calories"
        type="number"
        value={calories}
        onChange={(e) => setCalories(e.target.value)}
      />
      <input
        className="logmeal-input"
        placeholder="Carbs (g)"
        type="number"
        value={carbs}
        onChange={(e) => setCarbs(e.target.value)}
      />
      <input
        className="logmeal-input"
        placeholder="Fat (g)"
        type="number"
        value={fat}
        onChange={(e) => setFat(e.target.value)}
      />
      <input
        className="logmeal-input"
        placeholder="Protein (g)"
        type="number"
        value={protein}
        onChange={(e) => setProtein(e.target.value)}
      />

      <input type="file" accept="image/*" onChange={handleImageChange} className="logmeal-upload" />
      {imagePreview && <img src={imagePreview} alt="Preview" className="logmeal-image-preview" />}

      <div className="logmeal-button-row">
        <button className="cancel-button" onClick={() => navigate('/calorie-tracking')}>
          Cancel
        </button>
        <button className="submit-button" onClick={logMeal}>
          Submit
        </button>
      </div>
    </div>
  );
}
