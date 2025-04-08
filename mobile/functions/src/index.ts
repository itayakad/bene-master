/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functionsV1 from "firebase-functions/v1"; // Use v1 for `schedule`
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

exports.resetDailyData = functionsV1.pubsub.schedule("0 0 * * *")
  .onRun(async (context) => {
    try {
      const usersSnapshot = await db.collection("users").get();
      const resetPromises: Promise<FirebaseFirestore.WriteResult>[] = [];

      usersSnapshot.forEach((doc) => {
        const updates: {
        proteinConsumed: number;
        caloriesConsumed: number;
        waterIntake: number;
        workoutDays?: string[];
      } = {
        proteinConsumed: 0,
        caloriesConsumed: 0,
        waterIntake: 0,
      };

        // Reset workoutDays only on Sundays
        if (new Date().getDay() === 0) {
          updates.workoutDays = [];
        }

        resetPromises.push(doc.ref.update(updates));
      });

      await Promise.all(resetPromises);
      functionsV1.logger.info("Successfully reset user data.");
    } catch (error) {
      functionsV1.logger.error("Error resetting user data:", error);
    }
  });
