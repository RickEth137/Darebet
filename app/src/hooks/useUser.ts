'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  walletAddress: string;
  username?: string;
  bio?: string;
  email?: string;
  avatar?: string;
  createdAt: string;
  _count?: {
    bets: number;
    proofSubmissions: number;
  };
}

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  registerUser: (username?: string, bio?: string, email?: string, avatar?: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

export const useUser = (): UseUserReturn => {
  const { publicKey, connected, connecting } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = useCallback(async (username?: string, bio?: string, email?: string, avatar?: string): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          username,
          bio,
          email,
          avatar,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        if (data.isNewUser) {
          toast.success('Welcome to Dare Bets! Your account has been created.');
        } else {
          toast.success('Welcome back!');
        }
        return true;
      } else {
        setError(data.error);
        toast.error('Failed to register user');
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to connect to server';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!publicKey) {
      setUser(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users?walletAddress=${publicKey.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else if (response.status === 404) {
        // User doesn't exist, we'll need to register them
        setUser(null);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch user data';
      setError(errorMsg);
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Auto-register/login when wallet connects
  useEffect(() => {
    const handleWalletConnection = async () => {
      console.log('useUser: Wallet state changed:', { connected, publicKey: publicKey?.toString(), connecting });
      
      if (connected && publicKey && !connecting) {
        // Prevent unnecessary re-fetching if user already exists for this wallet
        if (user && user.walletAddress === publicKey.toString()) {
          console.log('useUser: User already exists for this wallet, skipping fetch');
          return;
        }

        console.log('useUser: Fetching user data for wallet:', publicKey.toString());
        
        // First, try to fetch existing user
        setLoading(true);
        setError(null);

        try {
          const response = await fetch(`/api/users?walletAddress=${publicKey.toString()}`);
          const data = await response.json();

          if (data.success) {
            console.log('useUser: User found:', data.user);
            setUser(data.user);
          } else if (response.status === 404) {
            console.log('useUser: User not found, registering new user');
            // User doesn't exist, auto-register them
            await registerUser();
          } else {
            console.log('useUser: Error fetching user:', data.error);
            setError(data.error);
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Failed to fetch user data';
          console.log('useUser: Exception fetching user:', err);
          setError(errorMsg);
          console.error('Error fetching user:', err);
        } finally {
          setLoading(false);
        }
      } else if (!connected && !connecting) {
        // Only clear user if definitely disconnected (not just loading)
        console.log('useUser: Wallet disconnected, clearing user');
        setUser(null);
        setError(null);
      }
    };

    // Add a small delay to prevent race conditions during page load
    const timer = setTimeout(handleWalletConnection, 100);
    return () => clearTimeout(timer);
  }, [connected, publicKey, connecting, registerUser]);

  return {
    user,
    loading,
    error,
    registerUser,
    refreshUser,
    isAuthenticated: !!user && connected,
  };
};