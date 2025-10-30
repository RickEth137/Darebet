import './globals.css';
import { WalletContextProvider } from '@/components/WalletContextProvider';
import Header from '@/components/Header';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Dare Bets - Dare Betting Platform',
  description: 'A Solana-based platform where you can create dares and bet on outcomes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <WalletContextProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </WalletContextProvider>
      </body>
    </html>
  );
}
