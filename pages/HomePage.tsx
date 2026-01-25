import React from 'react';
import { User } from '../types';

interface HomePageProps {
  user: User;
  onNavigateToDashboard: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onNavigateToDashboard }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in-up">
      <div className="max-w-4xl w-full bg-white/10 dark:bg-black/10 backdrop-blur-2xl rounded-2xl p-10 md:p-16 border border-black/10 dark:border-white/10 shadow-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-black dark:text-white">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">{user.name}</span>
        </h1>
        <p className="text-lg md:text-xl text-black/70 dark:text-white/70 max-w-2xl mx-auto mb-2">
            You are logged in as {user.username} ({user.email}).
        </p>
        <p className="text-lg md:text-xl text-black/70 dark:text-white/70 max-w-3xl mx-auto mb-8">
          Harness the power of advanced AI to navigate the complex digital landscape with confidence. Our tools provide real-time analysis of articles, images, and online trends to uncover misinformation, empowering you with the clarity to distinguish fact from fiction.
        </p>
        <div className="flex justify-center">
            <button onClick={onNavigateToDashboard} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105">
                Go to Dashboard
            </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;