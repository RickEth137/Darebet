import { Metadata } from 'next';
import { db } from '@/lib/db';
import DareDetailsClient from './DareDetailsClient';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;

  try {
    // Fetch dare from DB
    // We try to find by onChainId first as that seems to be the ID used in URLs
    const dare = await db.dare.findFirst({
      where: {
        OR: [
          { onChainId: id },
          { id: id }
        ]
      }
    });

    if (!dare) {
      return {
        title: 'Dare Not Found | DareBet',
        description: 'The dare you are looking for does not exist.',
      };
    }

    const DEFAULT_IMAGES = [
      'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
      'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy'
    ];

    let imageUrl = dare.logoUrl || dare.bannerUrl;
    
    // If no image or it's one of the defaults, generate a dynamic OG image
    if (!imageUrl || DEFAULT_IMAGES.includes(imageUrl)) {
      const params = new URLSearchParams();
      params.set('title', dare.title);
      params.set('description', dare.description.substring(0, 100));
      params.set('amount', dare.minBet.toString());
      imageUrl = `https://darebet.fun/api/og?${params.toString()}`;
    }

    return {
      title: `${dare.title} | DareBet`,
      description: dare.description.substring(0, 200),
      openGraph: {
        title: dare.title,
        description: dare.description.substring(0, 200),
        url: `https://darebet.fun/dare/${id}`,
        siteName: 'DareBet',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: dare.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: dare.title,
        description: dare.description.substring(0, 200),
        images: [imageUrl],
        creator: '@darebetdotfun', 
      },
    };
  } catch (error) {
    console.error('Error generating metadata for dare:', id, error);
    return {
      title: 'Dare Details | DareBet',
      description: 'View dare details and place your bets.',
    };
  }
}

export default function DarePage() {
  return <DareDetailsClient />;
}