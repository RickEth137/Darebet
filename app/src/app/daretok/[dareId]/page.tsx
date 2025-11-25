'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useDareApi } from '@/hooks/useDareApi';
import { Dare } from '@/types';
import { getMockDares } from '@/lib/mockDares';
import DareProofSubmissions from '@/components/daretok/DareProofSubmissions';

export default function DareTokPage() {
  const params = useParams();
  const router = useRouter();
  const { getDares } = useDareApi();
  
  const [dare, setDare] = useState<Dare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dareId = params?.dareId as string;

  useEffect(() => {
    if (dareId) {
      loadDare();
    }
  }, [dareId]);

  const loadDare = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if this is a demo dare (try to get it from the mock data)
      const demoDares = getMockDares();
      const demoDare = demoDares.find(d => d.publicKey.toString() === dareId);
      
      if (demoDare) {
        setDare(demoDare);
        return;
      }
      
      // If not a demo dare, try to fetch from API
      try {
        const allDares = await getDares();
        const foundDare = allDares.find(d => d.publicKey.toString() === dareId);
        
        if (foundDare) {
          setDare(foundDare);
        } else {
          setError('Dare not found');
        }
      } catch (err) {
        setError('Invalid dare ID or dare not found');
      }
    } catch (err) {
      console.error('Error loading dare:', err);
      setError('Failed to load dare details');
    } finally {
      setLoading(false);
    }
  };

  const parseDescriptionAndRules = (description: string) => {
    const rulesMatch = description.match(/Rules?:\s*\n([\s\S]*)/i);
    if (rulesMatch) {
      const mainDescription = description.substring(0, rulesMatch.index).trim();
      const rules = rulesMatch[1].trim();
      return { description: mainDescription, rules };
    }
    return { description, rules: '' };
  };

  const formatDeadline = (deadline: number) => {
    const date = new Date(deadline * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1e9).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-anarchist-black">
        <div className="animate-pulse">
          {/* Banner skeleton */}
          <div className="h-48 bg-gray-800"></div>
          {/* Profile skeleton */}
          <div className="max-w-6xl mx-auto px-4 -mt-16">
            <div className="w-32 h-32 bg-gray-700 rounded-full border-4 border-anarchist-black"></div>
            <div className="mt-4 space-y-2">
              <div className="h-8 bg-gray-800 rounded w-2/3"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dare) {
    return (
      <div className="min-h-screen bg-anarchist-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-anarchist-red text-6xl mb-4">😈</div>
          <h1 className="text-2xl font-brutal font-bold text-anarchist-offwhite mb-2">
            DARE NOT FOUND
          </h1>
          <p className="text-anarchist-white mb-6">
            {error || 'The dare you\'re looking for doesn\'t exist.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-anarchist-red hover:bg-red-700 text-anarchist-offwhite px-6 py-2 font-brutal font-bold uppercase tracking-wider transition-colors"
          >
            Back to Dares
          </button>
        </div>
      </div>
    );
  }

  const { description, rules } = parseDescriptionAndRules(dare.account.description);

  return (
    <div className="min-h-screen bg-anarchist-black pb-16">
      {/* Banner Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-anarchist-red to-red-900">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ 
            backgroundImage: `url(${dare.account.logoUrl})`,
            filter: 'blur(8px)'
          }}
        />
      </div>

      {/* Dare Profile Header */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        {/* Profile Picture */}
        <div className="relative inline-block">
          <img
            src={dare.account.logoUrl}
            alt={dare.account.title}
            className="w-32 h-32 rounded-full border-4 border-anarchist-black object-cover bg-gray-800"
          />
        </div>

        {/* Dare Title and Info */}
        <div className="mt-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-brutal font-bold text-anarchist-offwhite mb-2 uppercase">
            {dare.account.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-anarchist-white">
            <div>
              <span className="text-anarchist-red">Created by:</span>{' '}
              {dare.account.creator.toString().slice(0, 8)}...
            </div>
            <div>
              <span className="text-anarchist-red">Deadline:</span>{' '}
              {formatDeadline(dare.account.deadline)}
            </div>
            <div>
              <span className="text-anarchist-red">Total Pool:</span>{' '}
              {formatSOL(dare.account.totalPool)} SOL
            </div>
          </div>
        </div>

        {/* Description and Rules */}
        <div className="bg-anarchist-black border border-anarchist-red p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-xs font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-anarchist-offwhite whitespace-pre-wrap">{description}</p>
          </div>
          {rules && (
            <div>
              <h3 className="text-xs font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">
                Rules
              </h3>
              <p className="text-anarchist-offwhite whitespace-pre-wrap">{rules}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-anarchist-black border border-anarchist-red p-4 text-center">
            <div className="text-3xl font-brutal font-bold text-anarchist-red mb-1">
              {dare.account.submissionCount || 0}
            </div>
            <div className="text-xs text-anarchist-white uppercase tracking-wider">
              Total Entries
            </div>
          </div>

          <div className="bg-anarchist-black border border-anarchist-red p-4 text-center">
            <div className="text-3xl font-brutal font-bold text-green-500 mb-1">
              {formatSOL(dare.account.willDoPool)}
            </div>
            <div className="text-xs text-anarchist-white uppercase tracking-wider">
              Will Do Pool
            </div>
          </div>

          <div className="bg-anarchist-black border border-anarchist-red p-4 text-center">
            <div className="text-3xl font-brutal font-bold text-red-500 mb-1">
              {formatSOL(dare.account.wontDoPool)}
            </div>
            <div className="text-xs text-anarchist-white uppercase tracking-wider">
              Won't Do Pool
            </div>
          </div>

          <div className="bg-anarchist-black border border-anarchist-red p-4 text-center">
            <div className="text-3xl font-brutal font-bold text-anarchist-offwhite mb-1">
              {formatSOL(dare.account.minBet)}
            </div>
            <div className="text-xs text-anarchist-white uppercase tracking-wider">
              Min Bet (SOL)
            </div>
          </div>
        </div>

        {/* Submissions Section */}
        <div>
          <h2 className="text-2xl font-brutal font-bold text-anarchist-offwhite mb-4 uppercase">
            Dare Entries ({dare.account.submissionCount || 0})
          </h2>
          <DareProofSubmissions 
            dareId={dare.publicKey.toString()} 
            dareTitle={dare.account.title}
          />
        </div>
      </div>
    </div>
  );
}
