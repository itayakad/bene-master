import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../FirebaseConfig';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function MealData() {
  const [groupedLogs, setGroupedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState({});
  const router = useRouter();

  const toggleExpand = (date) => {
    setExpandedDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  const fetchMealLogs = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const q = collection(db, 'users', user.uid, 'meals');
        const querySnapshot = await getDocs(q);

        const logs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref, // Add the document reference for deletion
          ...doc.data(),
        }));

        const grouped = logs.reduce((acc, log) => {
          const date = new Date(
            log.timestamp?.seconds * 1000
          ).toLocaleDateString();

          if (!acc[date]) {
            acc[date] = {
              meals: [],
              totalCalories: 0,
            };
          }

          acc[date].meals.push(log);
          acc[date].totalCalories += log.calories || 0;

          return acc;
        }, {});

        const groupedArray = Object.keys(grouped).map((date) => ({
          date,
          ...grouped[date],
        }));

        setGroupedLogs(groupedArray);
      }
    } catch (error) {
      console.error('Error fetching meal logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMealLog = async (logRef, logCalories, logDate) => {
    const todayDate = new Date().toLocaleDateString();
  
    Alert.alert(
      'Delete Meal Log',
      'Are you sure you want to delete this meal log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the meal log from Firestore
              await deleteDoc(logRef);
  
              // If the meal was logged today, subtract the calories from `caloriesConsumed`
              if (logDate === todayDate) {
                const user = auth.currentUser;
                if (user) {
                  const userDocRef = doc(db, 'users', user.uid);
                  const userDocSnap = await getDoc(userDocRef);
  
                  if (userDocSnap.exists()) {
                    const currentCalories = userDocSnap.data().caloriesConsumed || 0;
  
                    const updatedCalories = Math.max(0, currentCalories - logCalories); // Prevent negative calories
                    await setDoc(userDocRef, { caloriesConsumed: updatedCalories }, { merge: true });
                  }
                }
              }
  
              // Refresh logs after deletion
              fetchMealLogs();
            } catch (error) {
              console.error('Error deleting meal log:', error);
              Alert.alert('Error', 'Failed to delete meal log. Please try again.');
            }
          },
        },
      ]
    );
  };  

  useFocusEffect(
    React.useCallback(() => {
      fetchMealLogs(); // Refresh meal logs whenever the page is accessed
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Meal Logs</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading meal logs...</Text>
        ) : groupedLogs.length === 0 ? (
          <Text style={styles.noLogsText}>No meal logs found.</Text>
        ) : (
          <FlatList
            data={groupedLogs}
            keyExtractor={(item) => item.date}
            renderItem={({ item }) => (
              <View style={styles.dateSection}>
                <TouchableOpacity
                  onPress={() => toggleExpand(item.date)}
                  style={styles.dateHeader}
                >
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Text style={styles.summaryText}>
                    Total Calories: {item.totalCalories} kcal | Meals: {item.meals.length}
                  </Text>
                </TouchableOpacity>
                {expandedDates[item.date] && (
                  <FlatList
                    data={item.meals}
                    keyExtractor={(log) => log.id}
                    renderItem={({ item: log }) => (
                      <View style={styles.logItemRow}>
                        <View style={styles.logContent}>
                          <Text style={styles.logText}>Description: {log.description}</Text>
                          <Text style={styles.logText}>Calories: {log.calories} kcal</Text>
                          <Text style={styles.logText}>
                            Carbs: {log.carbs} g | Fat: {log.fat} g | Protein: {log.protein} g
                          </Text>
                          {log.photoURL && (
                            <TouchableOpacity
                              style={styles.photoButton}
                              onPress={() =>
                                router.push({
                                  pathname: '/view-photo', // Use existing `ViewPhoto` screen
                                  params: { photoURL: log.photoURL, logId: log.id },
                                })
                              }
                            >
                              <Text style={styles.photoButtonText}>View Meal Photo</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteMealLog(log.ref, log.calories, new Date(log.timestamp?.seconds * 1000).toLocaleDateString())}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                )}
              </View>
            )}
          />
        )}
      </View>
      <TouchableOpacity
        style={styles.goBackButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.goBackText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
    padding: 20,
  },
  content: {
    flex: 1,
    paddingBottom: 10,
  },
  goBackButton: {
    backgroundColor: '#CCC',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 20,
  },
  goBackText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  noLogsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  dateSection: {
    marginBottom: 20,
    width: '100%',
  },
  dateHeader: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 10,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFE4B5',
    marginTop: 5,
  },
  logItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    marginLeft: 10,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logContent: {
    flex: 1,
  },
  logText: {
    fontSize: 16,
    color: '#000',
  },
  photoButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
