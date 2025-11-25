import './globals.css';
import { WalletContextProvider } from '@/components/WalletContextProvider';
import { SocketProvider } from '@/contexts/SocketContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Dare Bets - Dare Betting Platform',
  description: 'A Solana-based platform where you can create dares and bet on outcomes',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://darebet.fun',
    siteName: 'DareBet',
    title: 'Dare Bets - Dare Betting Platform',
    description: 'A Solana-based platform where you can create dares and bet on outcomes',
    images: [
      {
        url: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
        width: 1200,
        height: 630,
        alt: 'DareBet Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dare Bets - Dare Betting Platform',
    description: 'A Solana-based platform where you can create dares and bet on outcomes',
    images: ['https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq'],
    creator: '@darebetdotfun',
  },
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
          <SocketProvider>
            <Header />
            <main className="min-h-screen pb-16">
              {children}
            </main>
            <Footer />
            <Toaster 
              position="top-right"
              toastOptions={{
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
          </SocketProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
