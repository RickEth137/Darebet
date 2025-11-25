/**
 * Utility to add watermark to video stream using canvas
 * This burns the watermark into the video permanently
 */

const WATERMARK_LOGO_URL = 'https://gateway.pinata.cloud/ipfs/bafkreihpfyvyryphyedr44zteziu3d3hbq47cekhre5c5zjjyn6w3ezttq';

export interface WatermarkConfig {
  text: string;
  logoUrl?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  padding?: number;
  logoSize?: number;
  fontSize?: number;
  textColor?: string;
  logoOpacity?: number;
}

/**
 * Creates a watermarked video stream from an input stream
 * @param inputStream - The original MediaStream from camera/screen
 * @param config - Watermark configuration
 * @returns Promise<MediaStream> - New MediaStream with watermark burned in
 */
export async function createWatermarkedStream(
  inputStream: MediaStream,
  config: WatermarkConfig = {
    text: 'DAREBET.FUN',
    logoUrl: WATERMARK_LOGO_URL,
    position: 'top-right',
    padding: 32,
    logoSize: 40,
    fontSize: 16,
    textColor: '#ff0000',
    logoOpacity: 0.9
  }
): Promise<MediaStream> {
  const videoTrack = inputStream.getVideoTracks()[0];
  const audioTracks = inputStream.getAudioTracks();

  if (!videoTrack) {
    throw new Error('No video track found in input stream');
  }

  // Get video settings
  const settings = videoTrack.getSettings();
  const width = settings.width || 1280;
  const height = settings.height || 720;

  // Create video element to read from input stream
  const video = document.createElement('video');
  video.srcObject = new MediaStream([videoTrack]);
  video.muted = true;
  video.play();

  // Wait for video to be ready
  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });

  // Create canvas for watermarking
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Load watermark logo
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  logo.src = config.logoUrl || WATERMARK_LOGO_URL;
  
  await new Promise((resolve, reject) => {
    logo.onload = resolve;
    logo.onerror = () => {
      console.warn('Failed to load watermark logo, proceeding without it');
      resolve(null);
    };
  });

  // Calculate watermark position
  const padding = config.padding || 32;
  const logoSize = config.logoSize || 40;
  const fontSize = config.fontSize || 16;
  const textGap = 8; // Gap between logo and text

  let logoX = 0;
  let logoY = 0;
  let textX = 0;
  let textY = 0;

  switch (config.position) {
    case 'top-right':
      logoX = width - padding - logoSize;
      logoY = padding;
      textX = width - padding;
      textY = padding + logoSize + textGap + fontSize;
      break;
    case 'top-left':
      logoX = padding;
      logoY = padding;
      textX = padding;
      textY = padding + logoSize + textGap + fontSize;
      break;
    case 'bottom-right':
      logoX = width - padding - logoSize;
      logoY = height - padding - logoSize - textGap - fontSize;
      textX = width - padding;
      textY = height - padding;
      break;
    case 'bottom-left':
      logoX = padding;
      logoY = height - padding - logoSize - textGap - fontSize;
      textX = padding;
      textY = height - padding;
      break;
    default:
      logoX = width - padding - logoSize;
      logoY = padding;
      textX = width - padding;
      textY = padding + logoSize + textGap + fontSize;
  }

  // Draw frames with watermark
  const drawFrame = () => {
    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Save context state
    ctx.save();

    // Set opacity for watermark
    ctx.globalAlpha = config.logoOpacity || 0.9;

    // Draw semi-transparent background for better visibility
    const bgPadding = 12;
    const bgWidth = logoSize + bgPadding * 2;
    const bgHeight = logoSize + textGap + fontSize + bgPadding * 2;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      logoX - bgPadding,
      logoY - bgPadding,
      bgWidth,
      bgHeight
    );

    // Draw logo
    if (logo.complete && logo.naturalWidth > 0) {
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    }

    // Draw text
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = config.textColor || '#ff0000';
    ctx.textAlign = config.position?.includes('right') ? 'right' : 'left';
    ctx.fillText(config.text, textX, textY);

    // Restore context state
    ctx.restore();
  };

  // Start drawing loop (30 FPS)
  const fps = 30;
  const interval = 1000 / fps;
  let lastTime = performance.now();

  const animate = () => {
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime;

    if (elapsed >= interval) {
      drawFrame();
      lastTime = currentTime - (elapsed % interval);
    }

    requestAnimationFrame(animate);
  };

  animate();

  // Capture stream from canvas
  const watermarkedStream = canvas.captureStream(fps);

  // Add audio tracks from original stream
  audioTracks.forEach(track => {
    watermarkedStream.addTrack(track);
  });

  return watermarkedStream;
}

/**
 * Helper to check if watermark can be applied
 */
export function canApplyWatermark(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const stream = canvas.captureStream();
    return !!stream;
  } catch (error) {
    console.error('Canvas streaming not supported:', error);
    return false;
  }
}
