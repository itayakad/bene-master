import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';

import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import SelectMealEntry from './pages/SelectMealEntry';
import LogMeal from './pages/LogMeal';
import LogMealManual from './pages/LogMealManual';
import WaterTracking from './pages/WaterTracking';
import CalorieTracking from './pages/CalorieTracking';
import ExerciseTracking from './pages/ExerciseTracking';
import Survey from './pages/Survey';
import Settings from './pages/Settings';
import MealData from './pages/MealData';
import ViewPhoto from './pages/ViewPhoto';
import SelectExerciseType from './pages/SelectExerciseType';
import LogExercise from './pages/LogExercise';
import TabLayout from './layouts/TabLayout';
import ExerciseData from './pages/ExerciseData';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Force sign-out every time the app loads
  useEffect(() => {
    signOut(auth).then(() => console.log('🔒 User signed out on load'));
  }, []);

  // ✅ Just listen to auth changes to set user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userAuth) => {
      console.log('🔄 Auth state changed:', userAuth);
      setUser(userAuth);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div>Loading...</div>;

  const hideTabsOnRoutes = [
    '/', '/survey', '/log-exercise', '/log-meal',
    '/view-photo', '/exercise-data', '/meal-data',
    '/settings', '/select-meal'
  ];
  const hideTabs = hideTabsOnRoutes.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/select-meal" element={user ? <SelectMealEntry /> : <Navigate to="/" />} />
        <Route path="/log-meal" element={user ? <LogMeal /> : <Navigate to="/" />} />
        <Route path="/log-meal-manual" element={user ? <LogMealManual /> : <Navigate to="/" />} />
        <Route path="/water-tracking" element={user ? <WaterTracking /> : <Navigate to="/" />} />
        <Route path="/calorie-tracking" element={user ? <CalorieTracking /> : <Navigate to="/" />} />
        <Route path="/exercise-tracking" element={user ? <ExerciseTracking /> : <Navigate to="/" />} />
        <Route path="/survey" element={user ? <Survey /> : <Navigate to="/" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
        <Route path="/meal-data" element={user ? <MealData /> : <Navigate to="/" />} />
        <Route path="/view-photo" element={user ? <ViewPhoto /> : <Navigate to="/" />} />
        <Route path="/select-exercise" element={user ? <SelectExerciseType /> : <Navigate to="/" />} />
        <Route path="/log-exercise" element={user ? <LogExercise /> : <Navigate to="/" />} />
        <Route path="/exercise-data" element={user ? <ExerciseData /> : <Navigate to="/" />} />
      </Routes>

      {user && !hideTabs && <TabLayout />}
    </>
  );
}
