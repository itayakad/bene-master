import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../pages/WaterTracking.css';

const db = getFirestore();
const auth = getAuth();

export default function WaterTracking() {
  const navigate = useNavigate();
  const [waterGoal, setWaterGoal] = useState(64);
  const [watersConsumed, setWatersConsumed] = useState(0);
  const [customWaters, setCustomWaters] = useState('');

  useEffect(() => {
    const fetchWaterFromFirestore = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'users', user.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWatersConsumed(data.waterIntake || 0);
          setWaterGoal(parseInt(data.calculatedGoals?.waterGoal || 64));
        }
      } catch (error) {
        console.error('Error fetching water data:', error);
      }
    };

    fetchWaterFromFirestore();
  }, []);

  const saveWaterToFirestore = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), { waterIntake: amount }, { merge: true });
    } catch (error) {
      console.error('Error saving water data:', error);
    }
  };

  const addWaters = (amount: number) => {
    const updated = watersConsumed + amount;
    setWatersConsumed(updated);
    saveWaterToFirestore(updated);
  };

  const handleManualAdd = () => {
    const amount = parseFloat(customWaters);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid number.');
      return;
    }
    addWaters(amount);
    setCustomWaters('');
  };

  const progress = Math.min(watersConsumed / waterGoal, 1);

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <h1 className="header">Water Tracking</h1>
        <p className="subheader">Goal: {waterGoal} oz</p>
        <p className="intake">You've consumed: {watersConsumed} oz</p>

        <div className="water-progress-bar">
          <div className="water-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        <div className="water-button-row">
          <button className="water-add-btn" onClick={() => addWaters(8)}>+8 oz</button>
          <button className="water-add-btn" onClick={() => addWaters(16)}>+16 oz</button>
        </div>

        <div className="water-input-group">
          <input
            type="number"
            placeholder="Enter oz"
            value={customWaters}
            onChange={(e) => setCustomWaters(e.target.value)}
          />
          <button onClick={handleManualAdd}>Add</button>
        </div>
      </div>

      <div className="go-back">
        <button onClick={() => navigate('/')}>Go Back to Dashboard</button>
      </div>
    </div>
  );
}
