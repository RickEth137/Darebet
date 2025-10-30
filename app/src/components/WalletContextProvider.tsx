'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  Coin98WalletAdapter,
  TrustWalletAdapter,
  WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useMemo } from 'react';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({
  children,
}) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      // Popular mobile and desktop wallets
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      
      // WalletConnect for mobile wallet connections
      new WalletConnectWalletAdapter({
        network: network,
        options: {
          relayUrl: 'wss://relay.walletconnect.com',
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'devils-due-betting',
          metadata: {
            name: 'Dare Bets',
            description: 'Solana Dare Betting Platform',
            url: 'https://devils-due.app',
            icons: ['https://devils-due.app/icon.png'],
          },
        },
      }),
      
      // Additional wallet options
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new Coin98WalletAdapter(),
      new TrustWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        localStorageKey="dare-bets-wallet"
        onError={(error) => {
          console.error('Wallet error:', error);
        }}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
