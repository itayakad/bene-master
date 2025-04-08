import { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../pages/CalorieTracking.css';

export default function CaloriesTracking() {
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();

  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [customCalories, setCustomCalories] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCaloriesConsumed(data.caloriesConsumed || 0);
        setCalorieGoal(parseInt(data.calculatedGoals?.calorieGoal || 2000));
      }
    };

    fetchData();
  }, []);

  const saveToFirestore = async (updatedCalories: number) => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { caloriesConsumed: updatedCalories }, { merge: true });
  };

  const addCalories = (amount: number) => {
    const updated = caloriesConsumed + amount;
    setCaloriesConsumed(updated);
    saveToFirestore(updated);
  };

  const handleManualAdd = () => {
    const amount = parseFloat(customCalories);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid number.');
      return;
    }
    addCalories(amount);
    setCustomCalories('');
  };

  const progress = Math.min(caloriesConsumed / calorieGoal, 1);

  return (
    <div className="calorie-container">
      <h1 className="calorie-header">Calories Tracking</h1>
      <p className="calorie-subheader">Goal: {calorieGoal} kcal</p>
      <p className="calorie-intake">You've consumed: {caloriesConsumed} kcal</p>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }}></div>
      </div>

      <div className="calorie-buttons">
        <button onClick={() => addCalories(100)}>+100 kcal</button>
        <button onClick={() => addCalories(200)}>+200 kcal</button>
        <button onClick={() => addCalories(500)}>+500 kcal</button>
      </div>

      <div className="input-group">
        <input
          type="number"
          placeholder="Enter kcal"
          value={customCalories}
          onChange={(e) => setCustomCalories(e.target.value)}
        />
        <button onClick={handleManualAdd}>Add</button>
      </div>

      <button className="log-food-button" onClick={() => navigate('/select-meal')}>
        Log Food
      </button>
    </div>
  );
}
