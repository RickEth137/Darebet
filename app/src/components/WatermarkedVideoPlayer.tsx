'use client';

import React from 'react';
import Image from 'next/image';

interface WatermarkedVideoPlayerProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLVideoElement>) => void;
  poster?: string;
}

const WatermarkedVideoPlayer: React.FC<WatermarkedVideoPlayerProps> = ({
  src,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  onPlay,
  onMouseEnter,
  poster,
}) => {
  return (
    <div className="relative inline-block w-full h-full">
      {/* Video */}
      <video
        src={src}
        className={className}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        onPlay={onPlay}
        onMouseEnter={onMouseEnter}
        poster={poster}
      />
      
      {/* Watermark - Bottom Right Corner - Matching VideoRecorder style */}
      <div className="absolute bottom-12 right-8 z-20 opacity-80 flex flex-col items-center gap-0 pointer-events-none">
        <img 
          src="https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq"
          alt="Watermark"
          className="w-24 h-auto"
        />
        <span className="text-white font-brutal text-sm -mt-1">darebet.fun</span>
      </div>
    </div>
  );
};

export default WatermarkedVideoPlayer;
