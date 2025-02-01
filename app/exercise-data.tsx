import React, { useState } from 'react';
import {
  StyleSheet,
  Alert,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../FirebaseConfig';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function ExerciseData() {
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

  const fetchExerciseLogs = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const q = collection(db, 'users', user.uid, 'exercises');
        const querySnapshot = await getDocs(q);

        const logs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ref: doc.ref, // Include the Firestore document reference
          ...doc.data(),
        }));        

        const grouped = logs.reduce((acc, log) => {
          const date = new Date(
            log.timestamp?.seconds * 1000
          ).toLocaleDateString();

          if (!acc[date]) {
            acc[date] = {
              exercises: [],
              totalCalories: 0,
              totalDuration: 0,
            };
          }

          acc[date].exercises.push(log);
          acc[date].totalCalories += log.caloriesBurned || 0;
          acc[date].totalDuration += log.duration || 0;

          return acc;
        }, {});

        const groupedArray = Object.keys(grouped).map((date) => ({
          date,
          ...grouped[date],
        }));

        setGroupedLogs(groupedArray);
      }
    } catch (error) {
      console.error('Error fetching exercise logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExerciseLog = async (logRef) => {
    try {
      await deleteDoc(logRef); // Delete the log using the Firestore reference
      Alert.alert('Success', 'Log deleted successfully!');
      fetchExerciseLogs(); // Refresh the logs
    } catch (error) {
      console.error('Error deleting log:', error);
      Alert.alert('Error', 'Failed to delete log. Please try again.');
    }
  };  

  useFocusEffect(
    React.useCallback(() => {
      fetchExerciseLogs(); // Refresh exercise logs whenever the page is accessed
    }, [])
  );  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Exercise Logs</Text>
  
        {loading ? (
          <Text style={styles.loadingText}>Loading exercise logs...</Text>
        ) : groupedLogs.length === 0 ? (
          <Text style={styles.noLogsText}>No exercise logs found.</Text>
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
                    Total Calories: {item.totalCalories} kcal | Total Duration: {item.totalDuration} mins | Exercises: {item.exercises.length}
                  </Text>
                </TouchableOpacity>
                {expandedDates[item.date] && (
                  <FlatList
                    data={item.exercises}
                    keyExtractor={(log) => log.id}
                    renderItem={({ item: log }) => (
                      <View style={styles.logItemRow}>
                        <View style={styles.logContent}>
                          <Text style={styles.logText}>
                            Type: {log.exerciseType}
                          </Text>
                          <Text style={styles.logText}>
                            Duration: {log.duration} mins
                          </Text>
                          <Text style={styles.logText}>
                            Calories Burned: {log.caloriesBurned} kcal
                          </Text>
                          {log.notes && (
                            <Text style={styles.logText}>Notes: {log.notes}</Text>
                          )}
                          {log.hasPhoto && (
                            <TouchableOpacity
                              style={styles.photoButton}
                              onPress={() =>
                                router.push({
                                  pathname: '/view-photo',
                                  params: { photoURL: log.photoURL, logId: log.id },
                                })
                              }
                            >
                              <Text style={styles.photoButtonText}>
                                View Photo
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteExerciseLog(log.ref)}
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
    backgroundColor: '#D3F9D8',
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
    backgroundColor: '#32CD32',
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
    color: '#E3F2FD',
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
    backgroundColor: '#32CD32',
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
