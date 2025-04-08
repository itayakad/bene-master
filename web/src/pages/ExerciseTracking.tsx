import { useEffect, useState } from 'react';
import '../pages/ExerciseTracking.css';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function ExerciseTracking() {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [workoutDays, setWorkoutDays] = useState<string[]>([]);

  useEffect(() => {
    const fetchWorkoutDays = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setWorkoutDays(data.workoutDays || []);
        setWeeklyGoal(data.weeklyWorkoutDaysGoal || 3);
      }
    };

    fetchWorkoutDays();
  }, []);

  const saveWorkoutDays = async (updatedDays: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, 'users', user.uid), { workoutDays: updatedDays }, { merge: true });
  };

  const markWorkoutDay = async (day: string, index: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const todayIndex = new Date().getDay();
    if (index > todayIndex) {
      alert('You cannot mark future days.');
      return;
    }

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - (todayIndex - index));
    targetDate.setHours(0, 0, 0, 0);
    const start = Timestamp.fromDate(targetDate);

    targetDate.setHours(23, 59, 59, 999);
    const end = Timestamp.fromDate(targetDate);

    const exercisesRef = collection(db, 'users', user.uid, 'exercises');
    const q = query(exercisesRef, where('timestamp', '>=', start), where('timestamp', '<=', end));
    const snapshot = await getDocs(q);

    if (!snapshot.empty && workoutDays.includes(day)) {
      const confirm = window.confirm(
        'This will delete logged exercises for this day. Continue?'
      );
      if (!confirm) return;

      const batch = writeBatch(db);
      snapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      const updatedDays = workoutDays.filter((d) => d !== day);
      setWorkoutDays(updatedDays);
      saveWorkoutDays(updatedDays);
    } else {
      const updatedDays = workoutDays.includes(day)
        ? workoutDays.filter((d) => d !== day)
        : [...workoutDays, day];
      setWorkoutDays(updatedDays);
      saveWorkoutDays(updatedDays);
    }
  };

  const progress = workoutDays.length / weeklyGoal;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="exercise-container">
      <div className="exercise-content">
        <h1 className="exercise-title">Exercise Tracking</h1>
        <p className="exercise-subheader">Weekly Goal: {weeklyGoal} days</p>
        <p className="exercise-intake">You've worked out {workoutDays.length} day(s) this week</p>
  
        <div className="exercise-progress-bar">
          <div className="exercise-progress-fill" style={{ width: `${progress * 100}%` }}></div>
        </div>
  
        <div className="calendar-buttons">
          {days.map((day, i) => {
            const isToday = new Date().getDay() === i;
            const isFuture = i > new Date().getDay();
            const isActive = workoutDays.includes(day);
  
            return (
              <button
                key={day}
                className={`calendar-day ${isActive ? 'active' : ''} ${
                  isToday ? 'today' : ''
                } ${isFuture ? 'future' : ''}`}
                onClick={() => markWorkoutDay(day, i)}
                disabled={isFuture}
              >
                {day}
              </button>
            );
          })}
        </div>
  
        <button className="log-exercise-button" onClick={() => navigate('/select-exercise')}>
          Log Exercise
        </button>
      </div>
  
      <button className="go-back-button" onClick={() => navigate('/')}>
        Go Back to Dashboard
      </button>
    </div>
  );  
}
