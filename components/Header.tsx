import React, { useState, useEffect, useRef } from 'react';
import type { Page, User } from '../types';
import { NAV_LINKS } from '../constants';

interface HeaderProps {
  isLoggedIn: boolean;
  onNavigate: (page: Page) => void;
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onNavigate, user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-40 shadow-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => onNavigate(isLoggedIn ? 'home' : 'login')} className="flex-shrink-0 text-black dark:text-white text-xl font-bold flex items-center">
               <svg className="w-8 h-8 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              CodeHustlers
            </button>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                {isLoggedIn && NAV_LINKS.map((link) => (
                    <button
                    key={link.name}
                    onClick={() => onNavigate(link.page)}
                    className="text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                    {link.name}
                    </button>
                ))}
                </div>
            </div>
            {isLoggedIn && user && (
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                        {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <span className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                                {getInitials(user.name)}
                            </span>
                        )}
                        <span className="hidden sm:inline text-sm font-medium text-black dark:text-white">{user.name}</span>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black rounded-md shadow-lg py-1 ring-1 ring-black/10 dark:ring-white/10 z-50 animate-fade-in-down-sm">
                           <button onClick={() => { onNavigate('profile'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5">
                                Profile
                            </button>
                            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;