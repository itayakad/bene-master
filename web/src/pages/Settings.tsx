import { useEffect, useState } from 'react';
import '../pages/Settings.css';
import { getAuth } from 'firebase/auth';
import { doc, deleteDoc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const [showProtein, setShowProtein] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setShowProtein(data.showProtein || false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleProtein = async (checked: boolean) => {
    setShowProtein(checked);
    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { showProtein: checked }, { merge: true });
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      alert('Error signing out.');
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = window.confirm(
      'This will permanently delete your account and all data. Are you sure?'
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await user.delete();
      navigate('/');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error deleting account:', error.message);
          } else {
            console.error('Error deleting account:', error);
          }          
      alert('You must sign in again before deleting your account.');
    }
  };

  return (
    <div className="settings-container">
      <h1 className="settings-title">Settings</h1>

      <div className="toggle-section">
        <label className="toggle-label">Show Protein Progress</label>
        <input
          type="checkbox"
          checked={showProtein}
          onChange={(e) => handleToggleProtein(e.target.checked)}
        />
      </div>

      <div className="button-group">
        <button className="signout-button" onClick={handleSignOut}>Sign Out</button>
        <button className="delete-button" onClick={handleDeleteAccount}>Delete Account</button>
      </div>

      <button className="go-back-button" onClick={() => navigate('/')}>
        Go Back to Dashboard
      </button>
    </div>
  );
}
