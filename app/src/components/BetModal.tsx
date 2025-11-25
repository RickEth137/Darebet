'use client';

import { useState } from 'react';
import { BetType } from '@/types';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceBet: (amount: string, betType: BetType) => Promise<void>;
  minBet: number;
  willDoOdds: string;
  wontDoOdds: string;
  dareTitle: string;
  isLoading: boolean;
}

export const BetModal: React.FC<BetModalProps> = ({
  isOpen,
  onClose,
  onPlaceBet,
  minBet,
  willDoOdds,
  wontDoOdds,
  dareTitle,
  isLoading
}) => {
  const [betAmount, setBetAmount] = useState('');
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BetType.WillDo);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!betAmount || parseFloat(betAmount) < minBet / 1e9) {
      alert(`Minimum bet is ${(minBet / 1e9).toFixed(2)} SOL`);
      return;
    }
    await onPlaceBet(betAmount, selectedBetType);
    setBetAmount('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-anarchist-black border-2 border-anarchist-red max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-anarchist-red font-brutal text-2xl font-bold w-8 h-8 flex items-center justify-center border border-anarchist-red hover:bg-anarchist-red hover:text-anarchist-black transition-colors"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
            PLACE YOUR BET
          </h2>
          <p className="text-anarchist-offwhite text-sm font-brutal line-clamp-2">
            {dareTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bet Type Selection */}
          <div>
            <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
              SELECT OUTCOME
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setSelectedBetType(BetType.WillDo)}
                className={`flex-1 py-3 px-4 text-sm font-brutal font-bold uppercase tracking-wider transition-colors border-2 ${
                  selectedBetType === BetType.WillDo
                    ? 'bg-green-600 text-anarchist-black border-green-600'
                    : 'bg-anarchist-black text-anarchist-offwhite border-anarchist-red hover:border-green-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg">WILL DO</div>
                  <div className="text-xs opacity-80">{willDoOdds}% odds</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBetType(BetType.WontDo)}
                className={`flex-1 py-3 px-4 text-sm font-brutal font-bold uppercase tracking-wider transition-colors border-2 ${
                  selectedBetType === BetType.WontDo
                    ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                    : 'bg-anarchist-black text-anarchist-offwhite border-anarchist-red hover:border-anarchist-red hover:bg-anarchist-charcoal'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg">WON'T DO</div>
                  <div className="text-xs opacity-80">{wontDoOdds}% odds</div>
                </div>
              </button>
            </div>
          </div>

          {/* Bet Amount Input */}
          <div>
            <label className="block text-sm font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
              BET AMOUNT (SOL)
            </label>
            <input
              type="number"
              step="0.01"
              min={minBet / 1e9}
              placeholder={`Min: ${(minBet / 1e9).toFixed(2)} SOL`}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-4 py-3 bg-anarchist-charcoal border-2 border-anarchist-red text-anarchist-white font-brutal placeholder-anarchist-gray focus:outline-none focus:border-green-600 transition-colors"
              disabled={isLoading}
            />
            <p className="text-xs text-anarchist-offwhite mt-1 font-brutal">
              Minimum bet: {(minBet / 1e9).toFixed(2)} SOL
            </p>
          </div>

          {/* Potential Payout Info */}
          {betAmount && parseFloat(betAmount) > 0 && (
            <div className="bg-anarchist-charcoal border border-anarchist-red p-3">
              <div className="flex justify-between text-sm font-brutal mb-1">
                <span className="text-anarchist-offwhite">YOUR BET:</span>
                <span className="text-anarchist-white font-bold">{betAmount} SOL</span>
              </div>
              <div className="flex justify-between text-sm font-brutal">
                <span className="text-anarchist-offwhite">POTENTIAL WIN:</span>
                <span className="text-green-600 font-bold">
                  {selectedBetType === BetType.WillDo
                    ? (parseFloat(betAmount) * (parseFloat(willDoOdds) / 100)).toFixed(2)
                    : (parseFloat(betAmount) * (parseFloat(wontDoOdds) / 100)).toFixed(2)
                  } SOL
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-anarchist-charcoal hover:bg-anarchist-gray text-anarchist-white py-3 px-4 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-gray disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isLoading || !betAmount || parseFloat(betAmount) < minBet / 1e9}
              className="flex-1 bg-anarchist-red hover:bg-red-700 text-anarchist-black py-3 px-4 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'PLACING...' : 'PLACE BET'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
