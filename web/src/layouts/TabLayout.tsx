import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';
import { calculateProgress } from '../utils/calculateProgress';
import '../layouts/TabLayout.css';

export default function TabLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [waterFill, setWaterFill] = useState(0);
  const [calorieFill, setCalorieFill] = useState(0);
  const [exerciseFill, setExerciseFill] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        const waterGoal = parseInt(data.calculatedGoals?.waterGoal?.split(" ")[0] || 95);
        const waterIntake = data.waterIntake || 0;

        const calorieGoal = parseInt(data.calculatedGoals?.calorieGoal?.split(" ")[0] || 2000);
        const caloriesConsumed = data.caloriesConsumed || 0;

        const weeklyWorkoutDaysGoal = data.weeklyWorkoutDaysGoal || 3;
        const workoutDays = data.workoutDays || [];

        setWaterFill(calculateProgress(waterIntake, waterGoal));
        setCalorieFill(calculateProgress(caloriesConsumed, calorieGoal));
        setExerciseFill(calculateProgress(workoutDays.length, weeklyWorkoutDaysGoal));
      }
    });

    return () => unsubscribe();
  }, []);

  const hideTabs = location.pathname === '/dashboard';

  return (
    !hideTabs && (
      <div className="tab-bar">
        <div className="tab" onClick={() => navigate('/water-tracking')}>
          <div className="circle" style={{ background: `conic-gradient(#5C6BC0 ${waterFill}%, #E0E0E0 0%)` }} />
          <span>Water</span>
        </div>
        <div className="tab" onClick={() => navigate('/calorie-tracking')}>
          <div className="circle" style={{ background: `conic-gradient(#FFA500 ${calorieFill}%, #E0E0E0 0%)` }} />
          <span>Calories</span>
        </div>
        <div className="tab" onClick={() => navigate('/exercise-tracking')}>
          <div className="circle" style={{ background: `conic-gradient(#32CD32 ${exerciseFill}%, #E0E0E0 0%)` }} />
          <span>Exercise</span>
        </div>
        <div className="tab dashboard-tab">
          <button className="dashboard-button" onClick={() => navigate('/dashboard')}>
            Go Back to Dashboard
          </button>
        </div>
      </div>
    )
  );  
}
