import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import './Index.css';

export default function Index() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      if (user) navigate('/dashboard'); // or your main route after login
    } catch (error) {
      console.error(error);
      alert('Sign in failed: Please create an account.');
    }
  };

  const signUp = async () => {
    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      if (user) navigate('/survey'); // survey after account creation
    } catch (error) {
      console.error(error);
      alert('Account creation failed: Email already in use.');
    }
  };

  return (
    <div className="container">
      <h1 className="title">Welcome to JUNO!</h1>
      <input
        className="input"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="button" onClick={signIn}>
        Login
      </button>
      <button className="button" onClick={signUp}>
        Create Account
      </button>
    </div>
  );
}
