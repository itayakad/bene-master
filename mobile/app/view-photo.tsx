import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, storage, db } from '../FirebaseConfig';

export default function ViewPhoto() {
  const router = useRouter();
  const { photoURL, logId } = useLocalSearchParams(); // Accept `logId` to identify the log
  const [imageError, setImageError] = useState(false);
  const [finalPhotoURL, setFinalPhotoURL] = useState(null);

  useEffect(() => {
    const fetchFreshURL = async () => {
      try {
        if (!photoURL) {
          setImageError(true);
          return;
        }

        // Decode and fetch a fresh URL if needed
        const encodedPhotoURL = decodeURIComponent(photoURL);
        const storageRef = ref(storage, encodedPhotoURL);

        const freshURL = await getDownloadURL(storageRef);
        console.log('Fresh URL fetched:', freshURL);
        setFinalPhotoURL(freshURL);
      } catch (error) {
        console.error('Error fetching fresh URL:', error);
        setImageError(true);
      }
    };

    fetchFreshURL();
  }, [photoURL]);

  const handleDeletePhoto = async () => {
    if (!photoURL || !logId) {
      Alert.alert('Error', 'Missing photo URL or log ID.');
      return;
    }
  
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }
  
      const encodedPhotoURL = decodeURIComponent(photoURL);
      const storageRef = ref(storage, encodedPhotoURL);
  
      console.log('Deleting photo for logId:', logId);
  
      // Delete photo from Firebase Storage
      await deleteObject(storageRef);
      console.log('Photo deleted from Firebase Storage.');
  
      // Determine the correct collection based on the context
      const isMealPhoto = photoURL.includes('meal_photos'); // Check if it's a meal photo
      const collectionName = isMealPhoto ? 'meals' : 'exercises';
  
      console.log('Firestore collection:', collectionName);
  
      // Update `hasPhoto` flag in Firestore
      const logRef = doc(db, `users/${userId}/${collectionName}`, logId);
      await updateDoc(logRef, { hasPhoto: false, photoURL: '' });
      console.log('Firestore log updated.');
  
      Alert.alert('Success', 'Photo deleted successfully.');
      router.back(); // Navigate back after deletion
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete the photo. Please try again.');
    }
  };  

  if (!finalPhotoURL) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading photo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {imageError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load the image.</Text>
        </View>
      ) : (
        <Image
          source={{ uri: finalPhotoURL }}
          style={styles.photo}
          onLoadStart={() => console.log('Image loading started')}
          onLoad={() => console.log('Image loaded successfully')}
          onError={(error) => {
            console.error('Error loading image:', error.nativeEvent);
            setImageError(true);
            Alert.alert('Error', 'Failed to load the image.');
          }}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePhoto}
        >
          <Text style={styles.deleteButtonText}>Delete Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  photo: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
    backgroundColor: '#E0E0E0',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  goBackButton: {
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  goBackText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    marginBottom: 20,
  },
});
