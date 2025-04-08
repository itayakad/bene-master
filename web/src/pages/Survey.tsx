import { useEffect, useState } from 'react';
import '../pages/Survey.css';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Survey() {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [weeklyWorkoutDaysGoal, setWeeklyWorkoutDaysGoal] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAge(data.age || '');
        setGender(data.gender || '');
        setWeight(data.weight || '');
        setHeightFeet(data.height?.feet || '');
        setHeightInches(data.height?.inches || '');
        setFitnessGoal(data.fitnessGoal || '');
        setWeeklyWorkoutDaysGoal(data.weeklyWorkoutDaysGoal || '');
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleNext = () => {
    if (step === 1 && (!age || !gender || !weight || !heightFeet || !heightInches)) {
      alert('Please fill out all fields before proceeding.');
      return;
    }
    if (step === 2 && (!fitnessGoal || !weeklyWorkoutDaysGoal)) {
      alert('Please complete this step before proceeding.');
      return;
    }
    setStep(step + 1);
    setProgress(progress + 0.5);
  };

  const handleBack = () => {
    setStep(step - 1);
    setProgress(progress - 0.5);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const heightInInches = parseInt(heightFeet) * 12 + parseInt(heightInches);
    const waterGoal = parseInt(weight) * 0.5;

    const weightKg = parseInt(weight) / 2.205;
    const heightCm = heightInInches * 2.54;
    const bmr =
      gender === 'Male'
        ? 88.36 + 13.4 * weightKg + 4.8 * heightCm - 5.7 * parseInt(age)
        : 447.6 + 9.2 * weightKg + 3.1 * heightCm - 4.3 * parseInt(age);
    const calorieGoal = bmr * 1.2;
    const proteinGoal = parseInt(weight);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        age,
        gender,
        weight,
        height: { feet: heightFeet, inches: heightInches },
        fitnessGoal,
        weeklyWorkoutDaysGoal,
        calculatedGoals: {
          waterGoal: `${waterGoal.toFixed(0)} oz`,
          calorieGoal: `${calorieGoal.toFixed(0)} kcal`,
          proteinGoal: `${proteinGoal.toFixed(0)} g`,
          exerciseGoal: `${weeklyWorkoutDaysGoal} days/week`,
        },
      });
      alert('Survey complete! Your preferences have been saved.');
      navigate('/');
    } catch (error) {
      alert('Error saving data.');
      console.error(error);
    }
  };

  if (isLoading) return <div className="survey-container">Loading...</div>;

  return (
    <div className="survey-container">
      <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
      <p className="progress-text">Step {step} of 2</p>

      {step === 1 && (
        <div className="form-section">
          <h2>General Info</h2>
          <input placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input placeholder="Weight (lbs)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <div className="height-inputs">
            <input placeholder="Height (ft)" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} />
            <input placeholder="Height (in)" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="form-section">
          <h2>Fitness Goals</h2>
          <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)}>
            <option value="">Select Goal</option>
            <option value="Lose Weight">Lose Weight</option>
            <option value="Maintain Weight">Maintain Weight</option>
            <option value="Build Muscle">Build Muscle</option>
          </select>
          <select value={weeklyWorkoutDaysGoal} onChange={(e) => setWeeklyWorkoutDaysGoal(Number(e.target.value))}>
            <option value="">Workout Days/Week</option>
            {[...Array(7)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} Days</option>
            ))}
          </select>
        </div>
      )}

      <div className="survey-buttons">
        {step > 1 && <button onClick={handleBack}>Back</button>}
        {step < 2 && <button onClick={handleNext}>Next</button>}
        {step === 2 && <button onClick={handleSubmit}>Finish</button>}
      </div>
    </div>
  );
}
