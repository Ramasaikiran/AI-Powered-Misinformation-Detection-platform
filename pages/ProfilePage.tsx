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
    // In a real app, the image file would be uploaded to a server,
    // and the new URL would be saved. Here, we'll use the local preview URL.
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
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in-up">
      <div className="bg-transparent rounded-2xl shadow-lg p-8 border border-black/10 dark:border-white/10">
        <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
            <div className="relative">
                {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover ring-4 ring-indigo-500/50" />
                ) : (
                    <div className="w-32 h-32 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-5xl ring-4 ring-indigo-500/50">
                        {getInitials(user.name)}
                    </div>
                )}
                {isEditing && (
                    <>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-white dark:bg-black p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-900 border border-black/10 dark:border-white/10"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black dark:text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
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
            <div className="flex-grow text-center sm:text-left">
                {isEditing ? (
                    <>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            className="w-full text-3xl font-bold bg-transparent p-2 rounded-md border border-black/20 dark:border-white/20 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                         {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                    </>
                ) : (
                    <h2 className="text-3xl font-bold text-black dark:text-white">{user.name}</h2>
                )}
                <p className="text-black/60 dark:text-white/60 mt-1">{user.email}</p>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
             {isEditing ? (
                <div className="flex space-x-4">
                    <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
                        Save
                    </button>
                    <button onClick={handleCancel} className="bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-white font-bold py-2 px-6 rounded-lg">
                        Cancel
                    </button>
                </div>
            ) : (
                <button onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
                    Edit Profile
                </button>
            )}
            <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg">
                Logout
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;