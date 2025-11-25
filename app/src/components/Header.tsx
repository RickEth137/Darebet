'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useUser } from '@/hooks/useUser';
import { WelcomeModal } from './WelcomeModal';
import CustomWalletButton from './CustomWalletButton';
import { SearchBar } from './SearchBar';
import { LoadingSpinner } from './CircularLoader';
import Link from 'next/link';

export default function Header() {
  const { connected, publicKey, disconnect } = useWallet();
  const { user, isAuthenticated, shouldShowWelcome, dismissWelcome } = useUser();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    dismissWelcome();
  };

  return (
    <>
      <header className="bg-anarchist-black border-b-2 border-anarchist-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq"
                alt="Dare Bets Logo"
                className="h-10 w-10 object-contain"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl font-brutal font-bold text-anarchist-red uppercase tracking-wider">
                  DARE BETS
                </h1>
                <span className="text-xs text-anarchist-offwhite font-brutal">
                  DARE BETTING PLATFORM
                </span>
              </div>
            </div>
            
            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <SearchBar />
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-anarchist-offwhite hover:text-anarchist-red px-3 py-2 text-sm font-brutal font-medium uppercase tracking-wider border-l-2 border-transparent hover:border-anarchist-red transition-colors">
                BROWSE DARES
              </Link>
              <Link href="/contestants" className="text-anarchist-offwhite hover:text-anarchist-red px-3 py-2 text-sm font-brutal font-medium uppercase tracking-wider border-l-2 border-transparent hover:border-anarchist-red transition-colors">
                DARETOK
              </Link>
              <Link href="/live-dares" className="text-anarchist-offwhite hover:text-anarchist-red px-3 py-2 text-sm font-brutal font-medium uppercase tracking-wider border-l-2 border-transparent hover:border-anarchist-red transition-colors">
                LIVE DARES
              </Link>
              {isAuthenticated && user?.username && (
                <Link href={`/profile/${user.username}`} className="text-anarchist-offwhite hover:text-anarchist-red px-3 py-2 text-sm font-brutal font-medium uppercase tracking-wider border-l-2 border-transparent hover:border-anarchist-red transition-colors">
                  MY PROFILE
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="md:hidden text-anarchist-offwhite hover:text-anarchist-red p-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {connected && isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-anarchist-offwhite hover:text-anarchist-red px-3 py-2 text-sm font-brutal font-medium border-2 border-anarchist-red hover:bg-anarchist-charcoal transition-colors uppercase tracking-wider"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="Profile"
                        className="w-6 h-6 object-cover border border-anarchist-red"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-anarchist-red border border-anarchist-red flex items-center justify-center text-anarchist-black text-xs font-brutal font-bold">
                        {user.username ? user.username[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <span>
                      {user.username || formatAddress(user.walletAddress)}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-anarchist-black border-2 border-anarchist-red py-1 z-50">
                      <div className="px-4 py-3 border-b border-anarchist-red">
                        <p className="font-brutal font-bold text-anarchist-red uppercase tracking-wider">
                          {user.username || 'ANONYMOUS USER'}
                        </p>
                        <p className="text-xs text-anarchist-offwhite font-brutal">
                          {formatAddress(user.walletAddress)}
                        </p>
                        {user.bio && (
                          <p className="text-sm text-anarchist-offwhite mt-1 line-clamp-2 font-brutal">
                            {user.bio}
                          </p>
                        )}
                      </div>
                      {user._count && (
                        <div className="px-4 py-2 text-sm text-anarchist-offwhite border-b border-anarchist-red font-brutal">
                          <div className="flex justify-between">
                            <span>BETS:</span>
                            <span className="font-bold text-anarchist-red">{user._count.bets}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PROOFS:</span>
                            <span className="font-bold text-anarchist-red">{user._count.proofSubmissions}</span>
                          </div>
                        </div>
                      )}
                      <Link
                        href={user.username ? `/profile/${user.username}` : '/profile'}
                        className="block px-4 py-2 text-sm text-anarchist-offwhite hover:bg-anarchist-charcoal hover:text-anarchist-red font-brutal uppercase tracking-wider transition-colors"
                      >
                        MY PROFILE
                      </Link>
                      <button
                        onClick={() => setShowWelcome(true)}
                        className="w-full text-left px-4 py-2 text-sm text-anarchist-offwhite hover:bg-anarchist-charcoal hover:text-anarchist-red font-brutal uppercase tracking-wider transition-colors"
                      >
                        EDIT PROFILE
                      </button>
                      <button
                        onClick={() => {
                          disconnect();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-anarchist-offwhite hover:bg-anarchist-charcoal hover:text-anarchist-red font-brutal uppercase tracking-wider transition-colors border-t border-anarchist-charcoal"
                      >
                        DISCONNECT WALLET
                      </button>
                    </div>
                  )}
                </div>
              ) : connected && !isAuthenticated ? (
                <LoadingSpinner text="LOADING SYSTEM..." size="sm" />
              ) : null}
              
              {!isAuthenticated && <CustomWalletButton />}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden border-t-2 border-anarchist-red px-4 py-4 bg-anarchist-black">
            <SearchBar onClose={() => setShowMobileSearch(false)} />
          </div>
        )}
      </header>

      <WelcomeModal 
        isOpen={showWelcome || shouldShowWelcome} 
        onClose={handleCloseWelcome} 
      />

      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}
