export function calculateProgress(current: number, goal: number): number {
    if (!goal || goal === 0) return 0;
    const percentage = (current / goal) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0 and 100
  }  