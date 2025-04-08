import { useNavigate } from 'react-router-dom';
import '../pages/SelectMealEntry.css';

export default function SelectMealEntry() {
  const navigate = useNavigate();

  const handleNavigation = (method: 'api' | 'manual') => {
    if (method === 'api') {
      navigate('/log-meal');
    } else {
      navigate('/log-meal-manual');
    }
  };

  return (
    <div className="meal-container">
      <h1 className="meal-header">Log a Meal</h1>
      <p className="meal-subtext">Choose how you’d like to enter your meal:</p>

      <button className="meal-button" onClick={() => handleNavigation('api')}>
        🍴 Use API (Estimate Nutrition)
      </button>

      <button className="meal-button manual-button" onClick={() => handleNavigation('manual')}>
        ✍️ Enter Manually
      </button>
    </div>
  );
}
