import { useEffect, useState } from 'react';
import '../pages/Dashboard.css';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  CircularProgressbar,
  buildStyles,
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const [waterFill, setWaterFill] = useState(0);
  const [/*calorieFill*/, setCalorieFill] = useState(0);
  const [/*exerciseFill*/, setExerciseFill] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        const waterGoal = parseInt(data.calculatedGoals?.waterGoal?.split(' ')[0] || 95);
        const waterIntake = data.waterIntake || 0;
        const calorieGoal = parseInt(data.calculatedGoals?.calorieGoal?.split(' ')[0] || 2000);
        const caloriesConsumed = data.caloriesConsumed || 0;
        const weeklyWorkoutDaysGoal = data.weeklyWorkoutDaysGoal || 3;
        const workoutDays = data.workoutDays || [];

        setWaterFill(Math.min((waterIntake / waterGoal) * 100, 100));
        setCalorieFill(Math.min((caloriesConsumed / calorieGoal) * 100, 100));
        setExerciseFill(Math.min((workoutDays.length / weeklyWorkoutDaysGoal) * 100, 100));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Your Dashboard</h1>

      <div className="progress-ring-row">
      <div className="ring" onClick={() => navigate('/water-tracking')}>
        <CircularProgressbar
            value={waterFill}
            styles={buildStyles({
            pathColor: '#42A5F5',
            trailColor: '#E0E0E0',
            })}
        />
        <div className="ring-emoji">💧</div>
        </div>
        <div className="ring" onClick={() => navigate('/calorie-tracking')}>
            <CircularProgressbar
                value={waterFill}
                styles={buildStyles({
                    pathColor: '#FFA726',
                    trailColor: '#E0E0E0',
                })}
            />
         <div className="ring-emoji">🍎</div>
        </div>
        <div className="ring" onClick={() => navigate('/exercise-tracking')}>
        <CircularProgressbar
            value={waterFill}
            styles={buildStyles({
            pathColor: '#66BB6A',
            trailColor: '#E0E0E0',
            })}
        />
        <div className="ring-emoji">🏋️‍♀️</div>
        </div>
      </div>

      <button className="button purple" onClick={() => navigate('/survey')}>Edit Health Info</button>
      <button className="button green" onClick={() => navigate('/exercise-data')}>View Exercise Log</button>
      <button className="button orange" onClick={() => navigate('/meal-data')}>View Meal Log</button>
      <button className="button purple bottom-button" onClick={() => navigate('/settings')}>Account Settings</button>
    </div>
  );
}
