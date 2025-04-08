import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Switch } from 'react-native';
import { auth, db } from '../FirebaseConfig';
import { useRouter } from 'expo-router';
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { trackListener, cleanupAllListeners } from '../utils/ListenerManager';

export default function SettingsScreen() {
  const router = useRouter();
  const [showProtein, setShowProtein] = useState(false); // Toggle state for protein bar visibility

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      console.log("No user is logged in. Skipping Firestore listener setup.");
      return;
    }

    const docRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setShowProtein(data.showProtein || false); // Fetch the toggle value
        } else {
          console.log('No user document found in Firestore.');
        }
      },
      (error) => {
        console.error('Error with Firestore listener:', error);
      }
    );

    trackListener(unsubscribe);

    return () => {
      console.log("Cleaning up listener in SettingsScreen.");
      unsubscribe();
    };
  }, []);

  const handleToggleProtein = async (value) => {
    setShowProtein(value);

    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    try {
      await setDoc(docRef, { showProtein: value }, { merge: true }); // Persist toggle value to Firestore
      console.log('Protein bar visibility preference saved to Firestore.');
    } catch (error) {
      console.error('Error saving toggle preference:', error);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: handleSignOut },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and will delete your account and all associated data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: handleDeleteAccount },
      ]
    );
  };

  const handleSignOut = () => {
    cleanupAllListeners();
    auth.signOut()
      .then(() => {
        router.replace('/');
      })
      .catch((error) => {
        console.error('Error signing out:', error);
        Alert.alert('Error', 'An error occurred while signing out.');
      });
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;

    if (user) {
      try {
        cleanupAllListeners();

        await deleteDoc(doc(db, 'users', user.uid));
        await user.delete();

        router.replace('/');
      } catch (error) {
        console.error('Error deleting account:', error.message);
        Alert.alert(
          'Account Deletion Failed',
          'Please sign in again before deleting your account.'
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* Toggle Protein Progress Bar */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Show Protein Progress</Text>
        <Switch
          value={showProtein}
          onValueChange={handleToggleProtein}
          trackColor={{ false: '#ccc', true: '#5C6BC0' }}
          thumbColor={showProtein ? '#5C6BC0' : '#f4f3f4'}
        />
      </View>

      {/* Sign Out Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={confirmSignOut}>
          <Text style={styles.text}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={confirmDeleteAccount}>
          <Text style={styles.text}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Go Back to Dashboard Button */}
      <TouchableOpacity
        style={styles.goBackButton}
        onPress={() => router.push('/(tabs)')} // Change to your Dashboard route
      >
        <Text style={styles.goBackButtonText}>Go Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 45,
    fontWeight: '800',
    color: '#1A237E',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 50, // Space between the title and toggle
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 100, // Spacing below the toggle
  },
  toggleLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    width: '90%',
    marginBottom: 50,
  },
  signOutButton: {
    width: '100%',
    backgroundColor: '#FF6347',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteAccountButton: {
    width: '100%',
    backgroundColor: '#FF6347',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goBackButton: {
    position: 'absolute',
    bottom: 50,
    width: '90%',
    backgroundColor: '#5C6BC0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
