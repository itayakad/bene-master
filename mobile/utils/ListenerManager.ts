// functions/ListenerManager.ts

// The type for Firestore's unsubscribe function
type Unsubscribe = () => void;

// List to track all active listeners
const activeListeners: Unsubscribe[] = [];

/**
 * Track a Firestore listener by adding its unsubscribe function
 * to the global list.
 *
 * @param unsubscribe - The unsubscribe function returned by Firestore.
 */
export const trackListener = (unsubscribe: Unsubscribe): void => {
  activeListeners.push(unsubscribe);
};

/**
 * Clean up all tracked Firestore listeners by calling each
 * unsubscribe function in the list, and then clear the list.
 */
export const cleanupAllListeners = (): void => {
  activeListeners.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch (error) {
      console.error("Error unsubscribing Firestore listener:", error);
    }
  });
  activeListeners.length = 0; // Clear the list
};
