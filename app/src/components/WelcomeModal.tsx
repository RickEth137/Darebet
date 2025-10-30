'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { registerUser } = useUser();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const DEFAULT_AVATAR = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreihpfyvyryphyedr44zteziu3d3hbq47cekhre5c5zjjyn6w3ezttq';

  const validateUsername = (value: string) => {
    if (!value) {
      setUsernameError('Username is required');
      return false;
    }
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (value.length > 20) {
      setUsernameError('Username must be less than 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setAvatar(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatarToPinata = async (file: File): Promise<string | null> => {
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        return data.ipfsUrl;
      } else {
        console.error('Upload failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUsername(username)) {
      return;
    }

    setIsLoading(true);

    // Upload avatar if provided
    let avatarUrl = DEFAULT_AVATAR;
    if (avatar) {
      const uploadedUrl = await uploadAvatarToPinata(avatar);
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      } else {
        alert('Failed to upload avatar. Using default image.');
      }
    }

    const success = await registerUser(
      username.trim(), 
      bio.trim() || undefined,
      undefined, // email removed
      avatarUrl
    );

    if (success) {
      onClose();
    }
    setIsLoading(false);
  };

  const handleSkip = async () => {
    // For now, we require username - users can't skip
    // This could be changed in the future if needed
    return;
  };

  return (
    <div className="fixed inset-0 bg-anarchist-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-anarchist-black border-2 border-anarchist-red max-w-md w-full p-6 max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-anarchist-red hover:text-anarchist-white font-brutal text-xl font-bold w-8 h-8 flex items-center justify-center border border-anarchist-red hover:bg-anarchist-red hover:text-anarchist-black transition-colors"
          aria-label="Close modal"
        >
          ×
        </button>
        
        <div className="text-center mb-6">
          <div className="text-4xl mb-4 text-anarchist-red font-brutal">[SETUP]</div>
          <h2 className="text-2xl font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">WELCOME TO DARE BETS</h2>
          <p className="text-anarchist-offwhite font-brutal">
            THE ULTIMATE SOLANA DARE BETTING PLATFORM. SETUP YOUR PROFILE TO ACCESS THE SYSTEM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
              PROFILE PICTURE (OPTIONAL)
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 overflow-hidden bg-anarchist-charcoal border-2 border-anarchist-red">
                <img 
                  src={avatarPreview || DEFAULT_AVATAR}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-anarchist-red hover:bg-anarchist-darkred text-anarchist-black px-4 py-2 text-sm font-brutal font-bold transition-colors inline-block uppercase tracking-wider border border-anarchist-red"
                >
                  CHOOSE IMAGE
                </label>
                <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">
                  MAX 5MB. JPG, PNG, GIF SUPPORTED.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
              USERNAME *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                validateUsername(e.target.value);
              }}
              className={`w-full px-3 py-2 border-2 bg-anarchist-black text-anarchist-offwhite font-brutal focus:ring-2 focus:ring-anarchist-red focus:border-anarchist-red ${
                usernameError ? 'border-anarchist-red' : 'border-anarchist-darkgray'
              }`}
              placeholder="CHOOSE A UNIQUE USERNAME"
              maxLength={20}
              required
            />
            {usernameError && (
              <p className="text-anarchist-red text-xs mt-1 font-brutal">{usernameError}</p>
            )}
            <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">
              THIS CANNOT BE CHANGED LATER. ONLY LETTERS, NUMBERS, AND UNDERSCORES ALLOWED.
            </p>
          </div>

          <div>
            <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
              BIO (OPTIONAL)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border-2 border-anarchist-darkgray bg-anarchist-black text-anarchist-offwhite font-brutal focus:ring-2 focus:ring-anarchist-red focus:border-anarchist-red"
              placeholder="TELL OTHERS ABOUT YOURSELF..."
              maxLength={200}
            />
            <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">
              {bio.length}/200 CHARACTERS
            </p>
          </div>

          <div className="bg-anarchist-charcoal border border-anarchist-red p-4">
            <h3 className="font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">How it works:</h3>
            <ul className="text-sm text-anarchist-white space-y-1 font-brutal">
              <li>• Create dares or bet on existing ones</li>
              <li>• Upload video proof when completing dares</li>
              <li>• Winners share the prize pool automatically</li>
              <li>• Cash out early with a 10% penalty (if allowed)</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || uploadingAvatar || !username || usernameError !== ''}
              className="w-full bg-anarchist-red hover:bg-red-700 disabled:bg-anarchist-charcoal text-anarchist-black disabled:text-anarchist-offwhite py-2 px-4 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
            >
              {isLoading ? 'CREATING ACCOUNT...' : uploadingAvatar ? 'UPLOADING IMAGE...' : 'COMPLETE SETUP'}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-anarchist-red text-center">
          <p className="text-xs text-anarchist-offwhite font-brutal">
            USERNAME CANNOT BE CHANGED AFTER CREATION. BY CONTINUING, YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.
          </p>
        </div>
      </div>
    </div>
  );
};
