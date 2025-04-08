import { useState } from 'react';
import './LogExercise.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db, storage } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function LogExercise() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const exerciseType = params.get('exerciseType') || '';

  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [recordWorkout, setRecordWorkout] = useState('');
  const [recordQuantity, setRecordQuantity] = useState('');
  const [image, setImage] = useState<File | null>(null);
  // const [imageURL, setImageURL] = useState('');

  const calculateCalories = () => {
    const minutes = parseInt(duration);
    const rates: any = {
      Running: 10, Cycling: 8, Swimming: 12, Yoga: 5, Weightlifting: 7,
    };
    return isNaN(minutes) || minutes <= 0 ? 'N/A' : minutes * (rates[exerciseType] || 0);
  };

  const handleImageUpload = async () => {
    if (!image) return null;
    const userId = auth.currentUser?.uid;
    const imgRef = ref(storage, `progress_photos/${userId}/${Date.now()}.jpg`);
    const snapshot = await uploadBytes(imgRef, image);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert('User not authenticated.');

    const durationMinutes = parseInt(duration);
    if (!exerciseType || !duration || isNaN(durationMinutes)) {
      alert('Please fill in all required fields.');
      return;
    }

    const caloriesBurned = calculateCalories();
    const photoURL = await handleImageUpload();

    const docRef = doc(db, 'users', user.uid);
    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : {};
    const workoutDays = data.workoutDays || [];
    const currentMinutes = data.exerciseMinutes || 0;
    const dayOfWeek = new Date().toLocaleString('en-US', { weekday: 'short' });

    const updatedMinutes = currentMinutes + durationMinutes;
    if (!workoutDays.includes(dayOfWeek)) workoutDays.push(dayOfWeek);

    await setDoc(docRef, {
      exerciseMinutes: updatedMinutes,
      workoutDays,
    }, { merge: true });

    await setDoc(doc(db, 'users', user.uid, 'exercises', `${Date.now()}`), {
      exerciseType,
      duration: durationMinutes,
      caloriesBurned,
      notes,
      recordWorkout,
      recordQuantity,
      hasPhoto: !!photoURL,
      photoURL: photoURL || '',
      timestamp: new Date(),
    });

    alert('Exercise logged successfully!');
    navigate('/exercise-tracking');
  };

  return (
    <div className="log-exercise-container">
      <h1>Log Exercise</h1>
      <label>Exercise Type:</label>
      <p className="selected-exercise">{exerciseType}</p>

      <label>Duration (minutes):</label>
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Enter duration"
      />

      <label>Estimated Calories Burned:</label>
      <p className="calories-text">{calculateCalories()} kcal</p>

      <label>Personal Record (optional):</label>
      <div className="row-inputs">
        <input
          type="text"
          value={recordWorkout}
          onChange={(e) => setRecordWorkout(e.target.value)}
          placeholder="Workout name"
        />
        <input
          type="text"
          value={recordQuantity}
          onChange={(e) => setRecordQuantity(e.target.value)}
          placeholder="e.g. 200 lbs"
        />
      </div>

      <label>Notes (optional):</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes about your workout"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
      />

      <div className="button-group">
        <button className="cancel-btn" onClick={() => navigate('/exercise-tracking')}>Cancel</button>
        <button className="submit-btn" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}
