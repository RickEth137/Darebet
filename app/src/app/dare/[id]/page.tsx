import { Metadata } from 'next';
import { db } from '@/lib/db';
import DareDetailsClient from './DareDetailsClient';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = params.id;

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

  const imageUrl = dare.logoUrl || dare.bannerUrl || 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq';

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
}

export default function DarePage() {
  return <DareDetailsClient />;
}