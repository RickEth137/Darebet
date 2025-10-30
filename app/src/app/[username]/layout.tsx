import { Metadata } from 'next';
import { db } from '@/lib/db';

interface Props {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const user = await db.user.findUnique({
      where: { username: params.username },
    });

    if (!user) {
      return {
        title: 'User Not Found - Dare Bets',
        description: 'The user you are looking for does not exist.',
      };
    }

    const title = `@${user.username} - Dare Bets Profile`;
    const description = user.bio 
      ? `${user.bio} | View profile on Dare Bets`
      : `Check out @${user.username}'s profile on Dare Bets - The ultimate dare betting platform`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'profile',
        siteName: 'Dare Bets',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'User Profile - Dare Bets',
      description: 'View this user profile on Dare Bets - The ultimate dare betting platform.',
    };
  }
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}