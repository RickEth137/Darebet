import { Metadata } from 'next';
import { db } from '@/lib/db';

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const bet = await db.bet.findUnique({
      where: { onChainId: params.id },
      include: {
        dare: {
          select: {
            title: true,
            description: true,
            logoUrl: true,
          }
        },
        user: {
          select: {
            username: true,
            walletAddress: true,
          }
        }
      }
    });

    if (!bet) {
      return {
        title: 'Bet Not Found - Dare Bets',
        description: 'The bet you are looking for does not exist.',
      };
    }

    const username = bet.user.username || `${bet.user.walletAddress.slice(0, 4)}...${bet.user.walletAddress.slice(-4)}`;
    const betTypeText = bet.betType === 'WILL_DO' ? 'WILL' : "WON'T";
    
    const title = `${username} bet ${bet.amount} SOL that they ${betTypeText} complete "${bet.dare.title}"`;
    const description = `Check out this exciting bet on Dare Bets! ${bet.dare.description.slice(0, 100)}${bet.dare.description.length > 100 ? '...' : ''}`;
    
    return {
      title: `${title} - Dare Bets`,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: bet.dare.logoUrl,
            width: 1200,
            height: 630,
            alt: bet.dare.title,
          }
        ],
        type: 'website',
        siteName: 'Dare Bets',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [bet.dare.logoUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Bet - Dare Bets',
      description: 'View this bet on Dare Bets - The ultimate dare betting platform.',
    };
  }
}

export default function BetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}