import React, { useState, useRef } from 'react';
import { User } from '../types';

interface ProfilePageProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateProfile, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profileImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (name.trim() === '') {
      setNameError('Name cannot be empty.');
      return;
    }
    setNameError('');
    onUpdateProfile({ ...user, name: name.trim(), profileImageUrl: previewUrl });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setName(user.name);
    setNameError('');
    setProfileImageFile(null);
    setPreviewUrl(user.profileImageUrl);
    setIsEditing(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if(nameError) {
        setNameError('');
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-float">
      
      {/* Background glow overlay */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full radial-glow-cyan pointer-events-none opacity-40"></div>

      <div className="glass rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-white/5 relative z-10 space-y-8">
        
        <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
            
            {/* Profile Avatar Container */}
            <div className="relative group">
                {previewUrl ? (
                    <img src={previewUrl} alt="Profile Avatar" className="w-32 h-32 rounded-3xl object-cover ring-4 ring-cyan-500/30 transition-transform duration-300 group-hover:scale-105" />
                ) : (
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-black text-5xl ring-4 ring-cyan-500/30">
                        {getInitials(user.name)}
                    </div>
                )}
                {isEditing && (
                    <>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-white dark:bg-cyber-black/90 p-2.5 rounded-xl shadow-md border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 hover:text-cyan-500 dark:hover:text-cyan-400 text-slate-800 dark:text-white transition-all"
                            aria-label="Upload custom avatar image"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </>
                )}
            </div>
            
            {/* Meta details */}
            <div className="flex-grow text-center sm:text-left space-y-2">
                {isEditing ? (
                    <div className="space-y-1">
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            className="w-full text-2xl font-black bg-slate-100/50 dark:bg-white/5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:ring-1 focus:ring-cyan-400 focus:outline-none font-sans"
                        />
                        {nameError && <p className="text-red-400 text-xs font-mono">{nameError}</p>}
                    </div>
                ) : (
                    <h2 className="text-3xl font-black font-heading tracking-tight text-slate-800 dark:text-white">{user.name}</h2>
                )}
                <p className="text-xs uppercase tracking-widest font-mono text-slate-400 dark:text-white/40">Credential Signature</p>
                <p className="text-sm font-mono text-slate-600 dark:text-white/70">{user.email}</p>
            </div>
        </div>

        {/* Action Controls */}
        <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
             {isEditing ? (
                <div className="flex space-x-4 w-full sm:w-auto">
                    <button 
                      onClick={handleSave} 
                      className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all"
                    >
                        Save Credentials
                    </button>
                    <button 
                      onClick={handleCancel} 
                      className="w-full sm:w-auto bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-extrabold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all"
                    >
                        Discard
                    </button>
                </div>
            ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all"
                >
                    Modify Credentials
                </button>
            )}
            <button 
              onClick={onLogout} 
              className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-extrabold text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all"
            >
                Terminate Session
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;