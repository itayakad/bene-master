import { useEffect, useState } from 'react';
import './ExerciseData.css';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, deleteDoc, getDocs } from 'firebase/firestore';

export default function ExerciseData() {
  const [groupedLogs, setGroupedLogs] = useState<any[]>([]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const fetchExerciseLogs = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const snapshot = await getDocs(collection(db, 'users', user.uid, 'exercises'));
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref,
          ...doc.data(),
        }));

        const grouped = logs.reduce((acc: any, log: any) => {
          const date = new Date(log.timestamp?.seconds * 1000).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { exercises: [], totalCalories: 0, totalDuration: 0 };
          }
          acc[date].exercises.push(log);
          acc[date].totalCalories += log.caloriesBurned || 0;
          acc[date].totalDuration += log.duration || 0;
          return acc;
        }, {});

        const result = Object.entries(grouped).map(([date, details]: any) => ({
          date,
          ...details,
        }));

        setGroupedLogs(result);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ref: any) => {
    try {
      await deleteDoc(ref);
      alert('Log deleted.');
      fetchExerciseLogs();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete log.');
    }
  };

  useEffect(() => {
    fetchExerciseLogs();
  }, []);

  return (
    <div className="exercise-data-container">
      <h1>Exercise Logs</h1>

      {loading ? (
        <p>Loading logs...</p>
      ) : groupedLogs.length === 0 ? (
        <p>No exercise logs found.</p>
      ) : (
        groupedLogs.map((group) => (
          <div key={group.date} className="log-group">
            <button className="date-header" onClick={() => toggleExpand(group.date)}>
              <strong>{group.date}</strong>
              <span>
                | Calories: {group.totalCalories} kcal | Duration: {group.totalDuration} mins | {group.exercises.length} exercises
              </span>
            </button>

            {expandedDates[group.date] &&
              group.exercises.map((log: any) => (
                <div key={log.id} className="log-entry">
                  <div>
                    <p>Type: {log.exerciseType}</p>
                    <p>Duration: {log.duration} mins</p>
                    <p>Calories Burned: {log.caloriesBurned} kcal</p>
                    {log.notes && <p>Notes: {log.notes}</p>}
                    {log.hasPhoto && (
                      <button
                        className="view-photo-btn"
                        onClick={() =>
                          navigate(`/view-photo?photoURL=${encodeURIComponent(log.photoURL)}&logId=${log.id}`)
                        }
                      >
                        View Photo
                      </button>
                    )}
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(log.ref)}>
                    Delete
                  </button>
                </div>
              ))}
          </div>
        ))
      )}

      <button className="go-back-btn" onClick={() => navigate('/exercise-tracking')}>
        Go Back
      </button>
    </div>
  );
}
