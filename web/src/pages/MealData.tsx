import { useEffect, useState } from 'react';
import './MealData.css';
import { db, auth } from '../firebase/firebaseConfig';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface MealLog {
  id: string;
  ref: any;
  description: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  timestamp: any;
  photoURL?: string;
}

interface GroupedLogs {
  date: string;
  meals: MealLog[];
  totalCalories: number;
}

export default function MealData() {
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogs[]>([]);
  const [expandedDates, setExpandedDates] = useState<{ [date: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const fetchMealLogs = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const q = collection(db, 'users', user.uid, 'meals');
        const querySnapshot = await getDocs(q);

        const logs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
        })) as MealLog[];

        const grouped: { [date: string]: GroupedLogs } = {};
        logs.forEach((log) => {
          const date = new Date(log.timestamp?.seconds * 1000).toLocaleDateString();

          if (!grouped[date]) {
            grouped[date] = {
              date,
              meals: [],
              totalCalories: 0,
            };
          }

          grouped[date].meals.push(log);
          grouped[date].totalCalories += log.calories || 0;
        });

        setGroupedLogs(Object.values(grouped));
      }
    } catch (error) {
      console.error('Error fetching meal logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMealLog = async (logRef: any, logCalories: number, logDate: string) => {
    const todayDate = new Date().toLocaleDateString();

    if (!window.confirm('Are you sure you want to delete this meal log?')) return;

    try {
      await deleteDoc(logRef);

      if (logDate === todayDate) {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const currentCalories = userDocSnap.data().caloriesConsumed || 0;
            const updatedCalories = Math.max(0, currentCalories - logCalories);
            await setDoc(userDocRef, { caloriesConsumed: updatedCalories }, { merge: true });
          }
        }
      }

      fetchMealLogs();
    } catch (error) {
      console.error('Error deleting meal log:', error);
      alert('Failed to delete meal log. Please try again.');
    }
  };

  useEffect(() => {
    fetchMealLogs();
  }, []);

  return (
    <div className="meal-data-container">
      <h1 className="meal-data-header">Meal Logs</h1>

      {loading ? (
        <p className="meal-data-status">Loading meal logs...</p>
      ) : groupedLogs.length === 0 ? (
        <p className="meal-data-status">No meal logs found.</p>
      ) : (
        groupedLogs.map((group) => (
          <div key={group.date} className="meal-group">
            <div
              className="meal-date-header"
              onClick={() => toggleExpand(group.date)}
            >
              <h3>{group.date}</h3>
              <p>
                Total Calories: {group.totalCalories} kcal | Meals:{' '}
                {group.meals.length}
              </p>
            </div>
            {expandedDates[group.date] &&
              group.meals.map((log) => (
                <div key={log.id} className="meal-log-card">
                  <div className="meal-log-content">
                    <p>Description: {log.description}</p>
                    <p>Calories: {log.calories} kcal</p>
                    <p>
                      Carbs: {log.carbs}g | Fat: {log.fat}g | Protein: {log.protein}g
                    </p>
                    {log.photoURL && (
                      <button
                        className="meal-photo-button"
                        onClick={() =>
                          navigate(`/view-photo?photoURL=${encodeURIComponent(log.photoURL || '')}&logId=${log.id}`)
                        }
                      >
                        View Meal Photo
                      </button>
                    )}
                  </div>
                  <button
                    className="meal-delete-button"
                    onClick={() =>
                      deleteMealLog(
                        log.ref,
                        log.calories,
                        new Date(log.timestamp?.seconds * 1000).toLocaleDateString()
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        ))
      )}

      <button
        className="go-back-button"
        onClick={() => navigate('/dashboard')}
      >
        Go Back
      </button>
    </div>
  );
}
