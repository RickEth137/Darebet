/**
 * Pinata IPFS upload utilities for video proof storage
 */

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload video blob to Pinata IPFS
 */
export const uploadToPinata = async (
  videoBlob: Blob,
  metadata: {
    dareId: string;
    userId?: string;
    description: string;
    recordedAt: string;
  },
  onProgress?: (progress: UploadProgress) => void
): Promise<PinataUploadResponse> => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Generate filename with timestamp and dare ID
    const timestamp = Date.now();
    const filename = `proof-${metadata.dareId}-${timestamp}.webm`;
    formData.append('file', videoBlob, filename);
    
    // Add metadata
    const pinataMetadata = JSON.stringify({
      name: filename,
      keyvalues: {
        dareId: metadata.dareId,
        userId: metadata.userId || 'anonymous',
        description: metadata.description,
        recordedAt: metadata.recordedAt,
        uploadedAt: new Date().toISOString(),
        type: 'proof-video'
      }
    });
    formData.append('pinataMetadata', pinataMetadata);
    
    // Add pinning options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', pinataOptions);

    // Upload to API endpoint (which will handle Pinata upload)
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse upload response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('POST', '/api/upload-to-pinata');
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
};

/**
 * Get IPFS gateway URL for a given hash
 */
export const getIPFSUrl = (ipfsHash: string, gateway: 'pinata' | 'ipfs' | 'cloudflare' = 'pinata'): string => {
  const gateways = {
    pinata: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    ipfs: `https://ipfs.io/ipfs/${ipfsHash}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
  };
  
  return gateways[gateway];
};

/**
 * Validate video blob before upload
 */
export const validateVideoBlob = (blob: Blob): { valid: boolean; error?: string } => {
  // Check file type
  if (!blob.type.startsWith('video/')) {
    return { valid: false, error: 'File must be a video' };
  }
  
  // Check file size (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (blob.size > maxSize) {
    return { valid: false, error: 'Video file too large (max 100MB)' };
  }
  
  // Check minimum size (at least 100KB)
  const minSize = 100 * 1024; // 100KB
  if (blob.size < minSize) {
    return { valid: false, error: 'Video file too small (min 100KB)' };
  }
  
  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
