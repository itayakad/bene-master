import { useState } from 'react';
import './LogMeal.css';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getDoc, doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db, auth, storage } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';

export default function LogMeal() {
  const [mealDescription, setMealDescription] = useState('');
  const [nutrition, setNutrition] = useState<any>(null);
  const [portionSize, setPortionSize] = useState(1);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchNutrition = async () => {
    if (!mealDescription.trim()) return alert('Please enter a meal description');

    setLoading(true);
    setNutrition(null);

    try {
      const res = await fetch(
        `https://api.spoonacular.com/recipes/guessNutrition?title=${encodeURIComponent(
          mealDescription
        )}&apiKey=78ce4b73a54e47deaa040375d8417f49`
      );
      const data = await res.json();

      if (data?.calories) {
        setNutrition(data);
      } else {
        alert('Could not estimate nutrition. Try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch nutrition.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!image) return null;

    const userId = auth.currentUser?.uid;
    const imgRef = ref(storage, `meal_photos/${userId}/${Date.now()}.jpg`);
    const snapshot = await uploadBytes(imgRef, image);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    if (!nutrition) return alert('No nutrition data to log.');

    const user = auth.currentUser;
    if (!user) return alert('User not authenticated');

    const photoURL = await handleImageUpload();

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const currentData = snap.exists() ? snap.data() : {};

    const mealCalories = Math.round(nutrition.calories.value * portionSize);
    const mealProtein = Math.round(nutrition.protein.value * portionSize);

    await setDoc(userRef, {
      caloriesConsumed: (currentData.caloriesConsumed || 0) + mealCalories,
      proteinConsumed: (currentData.proteinConsumed || 0) + mealProtein,
    }, { merge: true });

    await addDoc(collection(db, 'users', user.uid, 'meals'), {
      description: mealDescription,
      calories: mealCalories,
      carbs: Math.round(nutrition.carbs.value * portionSize),
      fat: Math.round(nutrition.fat.value * portionSize),
      protein: mealProtein,
      hasPhoto: !!photoURL,
      photoURL: photoURL || '',
      timestamp: new Date()
    });

    alert('Meal logged successfully!');
    navigate('/calorie-tracking');
  };

  return (
    <div className="logmeal-container">
      <h1>Log a Meal</h1>
      <input
        type="text"
        placeholder="Describe your meal"
        value={mealDescription}
        onChange={(e) => setMealDescription(e.target.value)}
      />
      <button className="primary-btn" onClick={fetchNutrition}>
        {loading ? 'Estimating...' : 'Estimate Nutrition'}
      </button>

      {nutrition && (
        <>
          <div className="nutrition-results">
            <p>Calories: {Math.round(nutrition.calories.value * portionSize)} kcal</p>
            <p>Carbs: {Math.round(nutrition.carbs.value * portionSize)} g</p>
            <p>Fat: {Math.round(nutrition.fat.value * portionSize)} g</p>
            <p>Protein: {Math.round(nutrition.protein.value * portionSize)} g</p>
          </div>

          <div className="portion-size">
            <label>Portion Size:</label>
            <select value={portionSize} onChange={(e) => setPortionSize(parseFloat(e.target.value))}>
              <option value="0.8">Small</option>
              <option value="1">Normal</option>
              <option value="1.2">Large</option>
            </select>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />

          <button className="submit-btn" onClick={handleSubmit}>
            Submit Meal
          </button>
        </>
      )}

      {!nutrition && (
        <button className="cancel-btn" onClick={() => navigate('/calorie-tracking')}>
          Cancel
        </button>
      )}
    </div>
  );
}
