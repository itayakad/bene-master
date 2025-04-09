import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import './Index.css';
import logo from '../../../images/bear_logo.png';

export default function Index() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign in successful');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Sign in failed: Please check your credentials.');
    }
  };

  const signUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Sign up successful');
      navigate('/survey');
    } catch (error) {
      console.error(error);
      alert('Account creation failed: Email may already be in use.');
    }
  };

  return (
    <div className="container">
      <div className="branding">
        <img src={logo} alt="Bear Necessities Logo" className="logo" />
        <h1 className="title">The Bear Necessities</h1>
        <p className="subtitle">Water, Calorie, & Fitness Tracker</p>
      </div>

      <div className="auth-form">
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
    </div>
  );
}
