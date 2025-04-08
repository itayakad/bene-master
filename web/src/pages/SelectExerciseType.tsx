import './SelectExerciseType.css';
import { useNavigate } from 'react-router-dom';

const exerciseOptions = [
  { label: 'Running', emoji: '🏃' },
  { label: 'Cycling', emoji: '🚴' },
  { label: 'Swimming', emoji: '🏊' },
  { label: 'Yoga', emoji: '🧘' },
  { label: 'Weightlifting', emoji: '🏋️' },
  { label: 'Other', emoji: '🤸' },
];

export default function SelectExercise() {
  const navigate = useNavigate();

  const handleSelect = (exerciseType: string) => {
    navigate(`/log-exercise?exerciseType=${encodeURIComponent(exerciseType)}`);
  };

  return (
    <div className="select-exercise-container">
      <h1 className="select-exercise-header">Choose Your Exercise</h1>
      <div className="exercise-grid">
        {exerciseOptions.map(({ label, emoji }) => (
          <button
            key={label}
            className="exercise-button"
            onClick={() => handleSelect(label)}
          >
            {emoji} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
