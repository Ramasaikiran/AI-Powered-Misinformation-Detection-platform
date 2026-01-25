import React, { useState } from 'react';
import { ICONS } from '../constants';

interface LoginPageProps {
  onLogin: (loginDetails: { identifier: string }) => void;
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToRegister }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
        setError('Username or Email is required.');
        return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setError('');
    onLogin({ identifier: usernameOrEmail });
  };
  
  const handleGoogleSignIn = () => {
    // This is a simulation. In a real app, this would trigger the Google OAuth flow.
    setError('');
    onLogin({ identifier: 'user@google.com' });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in-up">
      <div className="max-w-4xl w-full bg-white/10 dark:bg-black/10 backdrop-blur-2xl rounded-2xl p-10 md:p-16 border border-black/10 dark:border-white/10 shadow-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-black dark:text-white">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">CodeHustlers</span>
        </h1>
        <p className="text-lg md:text-xl text-black/70 dark:text-white/70 max-w-3xl mx-auto mb-8">
          Harness the power of advanced AI to navigate the complex digital landscape with confidence. Our tools provide real-time analysis of articles, images, and online trends to uncover misinformation, empowering you with the clarity to distinguish fact from fiction.
        </p>
        
        <div className="max-w-sm mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-black dark:text-white">Sign In</h2>
            <form onSubmit={handleFormSubmit}>
                <div className="mb-4">
                    <input 
                      type="text" 
                      placeholder="Username or Email" 
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
                <div className="mb-4">
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105">
                    Login
                </button>
            </form>

            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-black/20 dark:border-white/20"></div>
                <span className="flex-shrink mx-4 text-black/60 dark:text-white/60 text-sm">OR</span>
                <div className="flex-grow border-t border-black/20 dark:border-white/20"></div>
            </div>

            <button 
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center bg-white dark:bg-black border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
                {ICONS.google}
                <span className="ml-3">Sign in with Google</span>
            </button>
            
            <p className="mt-8 text-sm text-black/60 dark:text-white/60">
                Don't have an account?{' '}
                <button onClick={onSwitchToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Register here
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;