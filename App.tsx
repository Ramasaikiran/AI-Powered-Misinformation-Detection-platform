import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import Chatbot from './components/Chatbot';
import { ToastProvider } from './components/ToastProvider';
import { Page, User } from './types';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [theme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (savedTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogin = useCallback((loginDetails: { identifier: string }) => {
    const identifier = loginDetails.identifier;
    const isEmail = identifier.includes('@');
    const nameFromIdentifier = isEmail ? identifier.split('@')[0] : identifier;
    
    const finalUser: User = {
        name: nameFromIdentifier.charAt(0).toUpperCase() + nameFromIdentifier.slice(1),
        email: isEmail ? identifier : `${identifier}@example.com`,
        username: isEmail ? identifier.split('@')[0] : identifier,
        profileImageUrl: null,
    };

    setUser(finalUser);
    setIsLoggedIn(true);
    setCurrentPage('home');
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('login');
    setAuthPage('login');
  }, []);

  const handleRegister = useCallback((username: string, emailOrPhone: string, type: 'email' | 'phone') => {
    setUser({
      name: username,
      username: username,
      email: type === 'email' ? emailOrPhone : 'user@example.com', // For phone, a placeholder email is used
      profileImageUrl: null,
    });
    setIsLoggedIn(true);
    setCurrentPage('home');
  }, []);

  const handleProfileUpdate = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const handleNavigation = useCallback((page: Page) => {
    if (page === 'login' && isLoggedIn) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage(page);
    }
  }, [isLoggedIn]);

  const renderPage = useMemo(() => {
    if (!isLoggedIn) {
      if (authPage === 'register') {
        return <RegistrationPage onRegister={handleRegister} onSwitchToLogin={() => setAuthPage('login')} />;
      }
      return <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setAuthPage('register')} />;
    }
    switch (currentPage) {
      case 'home':
        return <HomePage user={user!} onNavigateToDashboard={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'faq':
        return <FaqPage />;
      case 'contact':
        return <ContactPage />;
      case 'profile':
        return <ProfilePage user={user!} onUpdateProfile={handleProfileUpdate} onLogout={handleLogout} />;
      default:
        return <DashboardPage />;
    }
  }, [currentPage, isLoggedIn, handleLogin, authPage, handleRegister, user, handleProfileUpdate, handleLogout]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
      <Header 
        isLoggedIn={isLoggedIn} 
        onNavigate={handleNavigation} 
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderPage}
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
);


export default App;