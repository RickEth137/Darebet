'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';

export default function CustomWalletButton() {
  const { wallet, connect, connecting, connected, disconnect, disconnecting, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-4 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors">
        LOADING...
      </button>
    );
  }

  if (connected && publicKey) {
    return (
      <button
        onClick={disconnect}
        disabled={disconnecting}
        className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-4 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
      >
        {disconnecting ? 'DISCONNECTING...' : `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`}
      </button>
    );
  }

  if (connecting) {
    return (
      <button
        disabled
        className="bg-anarchist-charcoal text-anarchist-white px-4 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors opacity-50"
      >
        CONNECTING...
      </button>
    );
  }

  if (wallet) {
    return (
      <button
        onClick={connect}
        className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-4 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
      >
        CONNECT {wallet.adapter.name}
      </button>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-4 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
    >
      CONNECT WALLET
    </button>
  );
}