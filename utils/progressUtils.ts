import { Animated } from 'react-native';

export function calculateProgress(
  goal: number, // The goal value (e.g., water goal)
  current: number, // The current progress value (e.g., water intake)
  animationRef: Animated.Value, // Animated value for progress
  setState: (value: number) => void // State setter function to update the fill value
): string {
  const progress = (current / goal) * 100; // Calculate the percentage progress

  // Animate the progress bar
  Animated.timing(animationRef, {
    toValue: progress,
    duration: 500,
    useNativeDriver: false,
  }).start();

  // Listen to the animated value changes and update state
  const listener = animationRef.addListener(({ value }) => {
    setState(value);
  });

  return listener; // Return the listener ID for cleanup
}
