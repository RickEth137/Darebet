'use client';

export default function LiveDaresPage() {
  return (
    <div className="min-h-screen bg-anarchist-black flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl w-full">
        {/* Coming Soon Container */}
        <div className="bg-anarchist-charcoal border-4 border-anarchist-red p-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full" 
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 35px,
                  rgba(255, 0, 0, 0.5) 35px,
                  rgba(255, 0, 0, 0.5) 70px
                )`
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 border-4 border-anarchist-red flex items-center justify-center bg-anarchist-black">
                  <div className="text-6xl animate-pulse">📹</div>
                </div>
                <div className="absolute -top-2 -right-2 bg-anarchist-red text-anarchist-black px-3 py-1 font-brutal font-bold text-xs uppercase tracking-wider rotate-12">
                  SOON
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-6">
              LIVE DARES
            </h1>

            {/* Subtitle */}
            <div className="mb-8">
              <div className="inline-block bg-anarchist-red text-anarchist-black px-6 py-2 font-brutal font-bold uppercase tracking-wider text-xl mb-4">
                COMING SOON
              </div>
            </div>

            {/* Description */}
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-anarchist-offwhite text-lg font-brutal leading-relaxed">
                Live stream and let people place live dares, you decide how much SOL to ask to complete the dare.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="border-2 border-anarchist-red bg-anarchist-black/50 p-6">
                <div className="text-3xl mb-3">🎥</div>
                <h3 className="font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">
                  LIVE STREAMING
                </h3>
                <p className="text-sm text-anarchist-offwhite font-brutal">
                  Broadcast your dare attempts in real-time
                </p>
              </div>

              <div className="border-2 border-anarchist-red bg-anarchist-black/50 p-6">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">
                  SET YOUR PRICE
                </h3>
                <p className="text-sm text-anarchist-offwhite font-brutal">
                  You decide how much SOL viewers pay for dares
                </p>
              </div>

              <div className="border-2 border-anarchist-red bg-anarchist-black/50 p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">
                  INSTANT CHALLENGES
                </h3>
                <p className="text-sm text-anarchist-offwhite font-brutal">
                  Complete dares on the spot, earn immediately
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 pt-8 border-t-2 border-anarchist-red/30">
              <p className="text-anarchist-white font-brutal uppercase tracking-wider mb-4">
                Want early access?
              </p>
              <button
                disabled
                className="bg-anarchist-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-anarchist-black px-8 py-3 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
              >
                NOTIFY ME WHEN LIVE
              </button>
            </div>
          </div>
        </div>

        {/* Back to Browse */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="inline-flex items-center text-anarchist-offwhite hover:text-anarchist-red transition-colors font-brutal uppercase tracking-wider text-sm"
          >
            <span className="mr-2">←</span>
            BACK TO BROWSE DARES
          </a>
        </div>
      </div>
    </div>
  );
}
