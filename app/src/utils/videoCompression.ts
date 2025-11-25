/**
 * Video compression utilities for reducing file size before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
  bitrate?: number; // bits per second
  onProgress?: (progress: number) => void;
}

/**
 * Compress video blob using canvas and MediaRecorder
 */
export const compressVideo = async (
  videoBlob: Blob,
  options: CompressionOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 1280,
    maxHeight = 720,
    quality = 0.8,
    bitrate = 2500000, // 2.5 Mbps
    onProgress
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // Create video element
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;

      // Create object URL from blob
      const videoUrl = URL.createObjectURL(videoBlob);
      video.src = videoUrl;

      video.onloadedmetadata = () => {
        // Calculate dimensions maintaining aspect ratio
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Create MediaRecorder from canvas stream
        const stream = canvas.captureStream(30); // 30 fps
        
        const mimeType = getSupportedMimeType();
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: bitrate
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: mimeType });
          URL.revokeObjectURL(videoUrl);
          resolve(compressedBlob);
        };

        mediaRecorder.onerror = (error) => {
          URL.revokeObjectURL(videoUrl);
          reject(error);
        };

        // Start recording
        mediaRecorder.start();

        // Play video and draw frames to canvas
        let startTime = 0;
        let frameCount = 0;
        const totalFrames = Math.floor(video.duration * 30);

        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, width, height);
          frameCount++;

          if (onProgress && totalFrames > 0) {
            const progress = Math.min((frameCount / totalFrames) * 100, 100);
            onProgress(Math.round(progress));
          }

          requestAnimationFrame(drawFrame);
        };

        video.onplay = () => {
          drawFrame();
        };

        video.play().catch(reject);
      };

      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Failed to load video'));
      };

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get supported MIME type for video recording
 */
const getSupportedMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm'; // fallback
};

/**
 * Calculate compression ratio
 */
export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
  return Math.round((1 - (compressedSize / originalSize)) * 100);
};

/**
 * Estimate compressed size (rough approximation)
 */
export const estimateCompressedSize = (
  originalSize: number,
  duration: number,
  bitrate: number = 2500000
): number => {
  // Estimate based on bitrate: (bitrate * duration) / 8
  return Math.round((bitrate * duration) / 8);
};

/**
 * Fast compression using lower quality and resolution
 */
export const fastCompress = async (videoBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> => {
  return compressVideo(videoBlob, {
    maxWidth: 854,
    maxHeight: 480,
    quality: 0.6,
    bitrate: 800000, // 800 Kbps - much more aggressive
    onProgress
  });
};

/**
 * Balanced compression (default settings)
 */
export const balancedCompress = async (videoBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> => {
  return compressVideo(videoBlob, {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.7,
    bitrate: 1200000, // 1.2 Mbps - better compression
    onProgress
  });
};

/**
 * High quality compression
 */
export const highQualityCompress = async (videoBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> => {
  return compressVideo(videoBlob, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    bitrate: 2000000, // 2 Mbps
    onProgress
  });
};
