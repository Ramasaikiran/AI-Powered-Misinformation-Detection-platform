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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-cyber-black/75 dark:bg-cyber-black/75 backdrop-blur-md border-b border-white/5 py-3 shadow-lg' 
          : 'bg-transparent py-5'
      }`}
    >
      <nav className="container mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo / Brand */}
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate(isLoggedIn ? 'home' : 'login')} 
              className="flex-shrink-0 text-white text-2xl font-black font-heading flex items-center tracking-wider group focus:outline-none"
            >
              <div className="relative mr-3 w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-[0_0_20px_rgba(0,240,255,0.4)] group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                <div className="absolute inset-0 rounded-xl bg-cyan-400 opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 group-hover:text-cyan-400 transition-colors duration-300 font-heading">
                KRONOSX <span className="text-cyan-400 font-light">AI</span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              {isLoggedIn && NAV_LINKS.map((link) => (
                <button
                  key={link.name}
                  onClick={() => onNavigate(link.page)}
                  className="relative text-white/70 hover:text-cyan-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-white/5 active:scale-95"
                >
                  {link.name}
                </button>
              ))}
            </div>

            {/* Profile Dropdown */}
            {isLoggedIn && user && (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                  className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 focus:outline-none"
                >
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-cyan-400/30" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                      {getInitials(user.name)}
                    </span>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-white/90">{user.name}</span>
                  <svg className={`w-4 h-4 text-white/60 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-52 glass dark:glass rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 border border-white/10 z-50 animate-float">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Authorized Account</p>
                      <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    </div>
                    <button 
                      onClick={() => { onNavigate('profile'); setIsDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-cyan-400 hover:bg-white/5 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      <span>Security Profile</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate('dashboard'); setIsDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:text-cyan-400 hover:bg-white/5 flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                      <span>Control Console</span>
                    </button>
                    <div className="border-t border-white/5 my-1"></div>
                    <button 
                      onClick={() => { onLogout(); setIsDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      <span>Terminate Session</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {isLoggedIn && (
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="text-white hover:text-cyan-400 focus:outline-none p-2"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                )}
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Mobile Dropdown Panel */}
      {isLoggedIn && isMobileMenuOpen && (
        <div className="md:hidden glass border-t border-white/5 py-4 px-6 animate-fade-in-down">
          <div className="flex flex-col space-y-3">
            {NAV_LINKS.map((link) => (
              <button
                key={link.name}
                onClick={() => { onNavigate(link.page); setIsMobileMenuOpen(false); }}
                className="w-full text-left text-white/80 hover:text-cyan-400 py-2.5 text-base font-semibold border-b border-white/5 transition-all"
              >
                {link.name}
              </button>
            ))}
            {user && (
              <>
                <button
                  onClick={() => { onNavigate('profile'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left text-white/80 hover:text-cyan-400 py-2.5 text-base font-semibold border-b border-white/5 transition-all flex items-center space-x-2"
                >
                  <span>My Security Profile</span>
                </button>
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left text-red-400 hover:text-red-300 py-2.5 text-base font-semibold transition-all flex items-center space-x-2"
                >
                  <span>Terminate Session</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;