'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirectPage() {
  const { user, isAuthenticated, loading: userLoading } = useUser();
  const { connected, connecting } = useWallet();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for wallet connection to stabilize
    if (connecting) return;

    // If not connected, redirect to home
    if (!connected) {
      router.push('/');
      return;
    }

    // If connected, wait for user data loading
    if (userLoading) return;

    // If connected and not loading, but no user, it might be the initial delay in useUser
    // However, if we wait too long we should redirect. 
    // But useUser should eventually set user or error.
    
    if (user) {
      if (!isRedirecting) {
        setIsRedirecting(true);
        if (user.username) {
          router.push(`/profile/${user.username}`);
        } else {
          // Redirect to wallet address if no username
          router.push(`/profile/${user.walletAddress}`);
        }
      }
    } else {
      // Connected but no user found (and not loading). 
      // This could happen if the 100ms delay in useUser hasn't fired yet.
      // Or if the API returned 404 (but useUser auto-registers).
      
      // Let's give it a small grace period or check if we really should redirect.
      // For now, if we are here, it means useUser thinks we are done loading.
      // But due to the 100ms delay, loading might be false initially.
      
      // We can rely on the fact that if connected is true, useUser WILL eventually load.
      // So we should just show loading state until user appears.
      // But what if user never appears? (e.g. API error)
      
      // We can check if we've waited "long enough"? 
      // Or just rely on the fact that useUser sets loading=true eventually.
    }
  }, [user, isAuthenticated, userLoading, connected, connecting, router, isRedirecting]);

  // Safety timeout to redirect if stuck
  useEffect(() => {
    if (connected && !user && !userLoading) {
      const timer = setTimeout(() => {
        if (!user && !userLoading) {
           router.push('/');
        }
      }, 2000); // 2 second timeout
      return () => clearTimeout(timer);
    }
  }, [connected, user, userLoading, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto text-center">
        <div className="animate-pulse">
          <div className="text-anarchist-red text-4xl font-brutal mb-4">[REDIRECTING...]</div>
          <p className="text-anarchist-white font-brutal">LOADING YOUR PROFILE</p>
        </div>
      </div>
    </div>
  );
}
