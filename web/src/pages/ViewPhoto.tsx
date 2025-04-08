import { useEffect, useState } from 'react';
import './ViewPhoto.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDownloadURL, deleteObject, ref } from 'firebase/storage';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth, storage } from '../firebase/firebaseConfig';

export default function ViewPhoto() {
  const [finalPhotoURL, setFinalPhotoURL] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const photoURL = params.get('photoURL');
  const logId = params.get('logId');

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        if (!photoURL) return setImageError(true);

        const decodedURL = decodeURIComponent(photoURL);
        const photoRef = ref(storage, decodedURL);
        const freshURL = await getDownloadURL(photoRef);
        setFinalPhotoURL(freshURL);
      } catch (err) {
        console.error('Error fetching photo:', err);
        setImageError(true);
      }
    };

    fetchPhoto();
  }, [photoURL]);

  const handleDeletePhoto = async () => {
    if (!photoURL || !logId) return alert('Missing photo or log ID.');

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return alert('User not authenticated.');

      const decodedURL = decodeURIComponent(photoURL);
      const photoRef = ref(storage, decodedURL);

      await deleteObject(photoRef);

      const isMealPhoto = photoURL.includes('meal_photos');
      const collectionName = isMealPhoto ? 'meals' : 'exercises';

      const logRef = doc(db, `users/${userId}/${collectionName}/${logId}`);
      await updateDoc(logRef, { hasPhoto: false, photoURL: '' });

      alert('Photo deleted successfully!');
      navigate(-1);
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo. Try again.');
    }
  };

  if (!finalPhotoURL && !imageError) {
    return <div className="view-photo-container">Loading photo...</div>;
  }

  return (
    <div className="view-photo-container">
      {imageError ? (
        <p className="error-text">Failed to load the image.</p>
      ) : (
        <img
          src={finalPhotoURL || ''}
          alt="Logged meal or workout"
          className="photo-preview"
          onError={() => setImageError(true)}
        />
      )}

      <div className="photo-buttons">
        <button className="go-back-button" onClick={() => navigate(-1)}>
          Go Back
        </button>
        <button className="delete-button" onClick={handleDeletePhoto}>
          Delete Photo
        </button>
      </div>
    </div>
  );
}
