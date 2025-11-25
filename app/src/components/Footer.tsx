'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);

  useEffect(() => {
    // Binance WebSocket for SOL/USDT real-time price
    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket('wss://stream.binance.com:9443/ws/solusdt@ticker');

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const currentPrice = parseFloat(data.c); // Current price
        const priceChangePercent = parseFloat(data.P); // 24h price change percentage
        
        setSolPrice(currentPrice);
        setPriceChange(priceChangePercent);
      };

      ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
      };
    } catch (err) {
      console.error('Failed to connect to Binance WebSocket:', err);
    }

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-black border-t border-anarchist-red z-50">
      <div className="container mx-auto px-4 py-1.5">
        <div className="flex items-center justify-between">
          {/* Left: Solana Price */}
          <div className="flex items-center space-x-3">
            <div className="relative w-6 h-6">
              <img
                src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreicxogvdmww43gtl7zeqp55ym4xnpwdytjccvkdaimtr2uheugwmg4"
                alt="Solana"
                className="w-full h-full object-contain"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(25%) sepia(98%) saturate(7426%) hue-rotate(356deg) brightness(95%) contrast(118%)'
                }}
              />
            </div>
            {solPrice !== null ? (
              <div className="flex items-center space-x-2">
                <span className="text-anarchist-offwhite font-mono text-xs font-bold">
                  ${solPrice.toFixed(2)}
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    priceChange >= 0 ? 'text-green-500' : 'text-anarchist-red'
                  }`}
                >
                  {priceChange >= 0 ? '+' : ''}
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            ) : (
              <span className="text-anarchist-gray text-xs font-mono">Loading...</span>
            )}
          </div>

          {/* Center: Branding */}
          <div className="text-anarchist-offwhite font-brutal text-xs">
            <span className="text-anarchist-red">DARE</span>BET.FUN
          </div>

          {/* Right: Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/darebetdotfun"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="X (Twitter)"
            >
              <img
                src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreibnnykiwhp7zif76mlmxsrf3lrzwqhuyk5i7jio7dakk57u6dfjou"
                alt="X (Twitter)"
                className="w-5 h-5 object-contain"
              />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity -mt-0.5"
              aria-label="GMGN"
            >
              <img
                src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreicll5cnrcorgp27fkgmc45uxnkgvev46763e2gbj6jnqxyizkhxbe"
                alt="GMGN"
                className="w-[24px] h-[24px] object-contain"
              />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Gitbook Documentation"
            >
              <img
                src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreic6go73466no6tq7ybuozixsxclw7z3z73qgkavos4ux7hfgermuy"
                alt="Gitbook"
                className="w-5 h-5 object-contain"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
